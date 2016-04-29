var bayes = require('bayes');
var classifier = bayes();
var natural = require('natural');
natural.PorterStemmer.attach();
var pos = require('pos');

var lexer = new pos.Lexer();
var tagger = new pos.Tagger();

var trainingData = require('./../public/trainingData.json');
var mayorIntent = require('./femaleMayorIntent').Intent(trainingData, classifier);
var birthdateIntent = require('./birthdateIntent').Intent(trainingData, classifier);
var leadingIntent = require('./leadingIntent').Intent(trainingData, classifier);
var voldemortIntent = require('./voldemortIntent').Intent(trainingData, classifier);
// var populationIntent = require('./populationIntent');
// var dateOfDeathIntent = require('./dateOfDeathIntent');
// var inceptionIntent = require('./inceptionIntent');
// var filmIntent = require('./filmIntent');
var intentArray = [leadingIntent, mayorIntent, birthdateIntent, voldemortIntent]; // populationIntent, dateOfDeathIntent, inceptionIntent, filmIntent
var intentNameToPositionMapping = {};

for (var i = 0; i < intentArray.length; i++) {
  intentNameToPositionMapping[intentArray[i].getName()] = i;
}

var QUESTION_NOT_UNDERSTOOD = {
    interpretation: 'I didn\'t understand the question. Please try asking the question in a different way. Maybe, this type of question isn\'t supported yet. In that case, feel free to contact the development team (TODO: Link einfügen)',
    speechOutput: 'I am sorry, but I don\'t know...'
}

exports.mapAndAnswerQuestion = function(question, callback) {
    var words = lexer.lex(question)
    var taggedWords = tagger.tag(words);

    var namedEntity = findNamedEntity(taggedWords);

    question = question.toLowerCase().replace(/[^a-z0-9 äöüß]/g, '');
    intentPosition = intentNameToPositionMapping[this.map(question)];
    intentArray[intentPosition].answer(question, function(err, result) {
        if (namedEntity == result.searchText) {
          console.log("POS found same namedEntity as the intent: ", namedEntity);
        } else {
          console.log("Search text in result: " + result.searchText + ", while POS found: " + namedEntity);
        }
        callback(result);
    });
}

exports.map = function(question) {
    var intentName = classifier.categorize(question.tokenizeAndStem().join(' '));
    console.log("Mapping returned: ", intentName);
    return intentName;
}

function findNamedEntity(taggedWords) {
  var namedEntity = "";
  var tags = ["NNP", "NN"];

  // at first, try to find NNP or NNPS ("Proper Noun"); if this wasn't successful, also try "NN" or "NNS" ("Noun")
  for (i in tags) {
    for (j in taggedWords) {
        var taggedWord = taggedWords[j];
        var word = taggedWord[0];
        var tag = taggedWord[1];
        console.log(word + " / " + tag);
        if (tag.startsWith(tags[i])) {
          namedEntity += word + " ";
        }
    }
    if (namedEntity != "") {
      return namedEntity.trim();
    }
  }

  return namedEntity.trim();
}
