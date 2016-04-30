var bayes = require('bayes');
var classifier = bayes();
var natural = require('natural');
natural.PorterStemmer.attach();
var stringSimilarity = require('string-similarity');
var pos = require('pos');

var lexer = new pos.Lexer();
var tagger = new pos.Tagger();

var trainingData = require('./../public/trainingData.json');
var propertiesWithSynonyms = require('./../public/propertiesWithSynonyms.json');
var mayorIntent = require('./femaleMayorIntent').Intent(trainingData, classifier);
var birthdateIntent = require('./birthdateIntent').Intent(trainingData, classifier);
var leadingIntent = require('./leadingIntent').Intent(trainingData, classifier);
var voldemortIntent = require('./voldemortIntent').Intent(trainingData, classifier);
var intentArray = [leadingIntent, mayorIntent, birthdateIntent, voldemortIntent];
var intentNameToPositionMapping = {};

for (var i = 0; i < intentArray.length; i++) {
  intentNameToPositionMapping[intentArray[i].getName()] = i;
}

var QUESTION_NOT_UNDERSTOOD = {
    interpretation: 'I didn\'t understand the question. Please try asking the question in a different way. Maybe, this type of question isn\'t supported yet. In that case, feel free to contact the development team (TODO: Link einfügen)',
    speechOutput: 'I am sorry, but I don\'t know...'
}

var conversationHistory = require('./conversationHistory.js');

exports.mapAndAnswerQuestion = function(question, callback) {
    var questionId = conversationHistory.addQuestion(question);

    // try to extract all the information through NLP, dynamically build the query and answer question
    // if unsuccessful, see if question can be mapped to "complicated" intent and be answered there
    answerQuestionDynamically(question, callback, function(){
      question = question.toLowerCase().replace(/[^a-z0-9 äöüß]/g, '');
      intentPosition = intentNameToPositionMapping[map(question)];
      intentArray[intentPosition].answer(question, function(err, result) {
          conversationHistory.addInterpretation(result.interpretation, questionId);
          conversationHistory.addAnswer(result.speechOutput, questionId);
          callback(result);
      });
    });
}

function map(question) {
    var intentName = classifier.categorize(question.tokenizeAndStem().join(' '));
    console.log("Mapping returned: ", intentName);
    return intentName;
}

function answerQuestionDynamically(question, callback, fallback) {
  var words = lexer.lex(question)
  var taggedWords = tagger.tag(words);

  var namedEntity = findNamedEntity(taggedWords);
  var propertyId = findPropertyId(taggedWords);
  var wikidataIdLookup = require('./wikidataIdLookup');
  wikidataIdLookup.getWikidataId({searchText: namedEntity}, function(err, data){
    console.log('We are looking for ' + propertyId + ' of ' + data.id + ' (' + data.label + ')');
    if (data.id && propertyId) {
      // try it with dynamically found entities
      var Client = require('node-rest-client').Client;
    	var client = new Client();
      var queryBuilder = require('./queryBuilder');
    	var StringDecoder = require('string_decoder').StringDecoder;
    	var decoder = new StringDecoder('utf8');
      client.get( queryBuilder.genercicSingleStatement(data.id, propertyId), function(queryData, response) {
          data.interpretation = propertyId + " of " + data.label + "?";
          var jsonResponse = JSON.parse(decoder.write(queryData));
          if (jsonResponse.results.bindings.length == 0) {
              data.speechOutput = "Sorry, I didn't find an answer on Wikidata. Maybe its data is incomplete. " +
                              "You would do me a big favor if you could look it up and add it to Wikidata."
              callback(data);
              return;
          }
          data.result = jsonResponse.results.bindings[0].objectLabel.value;
          data.speechOutput = propertyId + " of " + data.label + " is " + data.result + ".";
          console.log(data.speechOutput);
          callback(data);
      });
    } else {
      fallback();
    }
  })
}

function findNamedEntity(taggedWords) {
  var namedEntity = "";
  var tags = ["NNP", "NN"];
  var prepositionMightBeInEntity = false; // birthdate of Barack Obama --> NN NN IN NN --> namedEntity = birthdate Barack Obama --> check for IN

  // at first, try to find NNP or NNPS ("Proper Noun"); if this wasn't successful, also try "NN" or "NNS" ("Noun")
  for (i in tags) {
    for (j in taggedWords) {
        var taggedWord = taggedWords[j];
        var word = taggedWord[0];
        var tag = taggedWord[1];
        if (tag.startsWith(tags[i])) {
          if (prepositionMightBeInEntity) {
            namedEntity = "";
            prepositionMightBeInEntity = false;
          }
          namedEntity += word + " ";
        }
        if (namedEntity != "" && tag == 'IN') {
          prepositionMightBeInEntity = true;
        }
    }
    if (namedEntity != "") {
      return namedEntity.trim();
    }
  }

  return namedEntity.trim();
}

function findPropertyId(taggedWords) {
  var property = findPropertyAsVerb(taggedWords);
  if (property == "") {
    property = findPropertyAsDescription(taggedWords);
  }
  propertyId = lookupPropertyId(property);
  return propertyId;
}

function findPropertyAsVerb(taggedWords) {
  var property = "";
  for (i in taggedWords) {
      var taggedWord = taggedWords[i];
      var word = taggedWord[0];
      var tag = taggedWord[1];
      if (tag.startsWith('V')) {
        property += word + " ";
      }
  }

  property = property.toLowerCase().replace(/is|are|was|were|been/g, '');
  return property.trim();
}

function findPropertyAsDescription(taggedWords) {
  // everything between DT (determiner: the, some, ...) and IN (preposition: of, by, in, ...)
  var property = "";
  start = false;

  for (i in taggedWords) {
      var taggedWord = taggedWords[i];
      var word = taggedWord[0];
      var tag = taggedWord[1];
      if (start) {
        if (tag == 'IN') {
          break;
        }
        property += word + " ";
      }

      if (tag == 'DT') {
        start = true;
      }
  }
  return property.trim();
}

// returns propertyId that fits best, if there is no good fit: returns false
function lookupPropertyId(property) {
  var SIMILARITY_THRESHOLD = 0.6;
  // var possibleIds = [];
  var propertyId = false;
  var maxRating = 0;
  for (var i = 0; i < propertiesWithSynonyms.length; i++) {
    var allPossibleNames = propertiesWithSynonyms[i].aliases;
    allPossibleNames.push(propertiesWithSynonyms[i].label);
    var bestMatch = stringSimilarity.findBestMatch(property, allPossibleNames);
    var bestRating = bestMatch.bestMatch.rating;
    if (bestRating > SIMILARITY_THRESHOLD) {
      // possibleIds.push({'id': propertiesWithSynonyms[i].id, 'rating': bestRating > 0.6})
      if (bestRating > maxRating) {
        maxRating = bestRating;
        propertyId = propertiesWithSynonyms[i].id;
      }
    }
    if (bestRating == 1) {
      return propertyId;
    }
  }
  return propertyId;
}
