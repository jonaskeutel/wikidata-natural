var pos = require('pos');
var lexer = new pos.Lexer();
var tagger = new pos.Tagger();

var entityResolver = require('./entityResolver');
var propertyResolver = require('./propertyResolver');
var conversationHistory = require('./../conversationHistory.js');

exports.answer = function(question, callback, fallback) {
  var questionId = conversationHistory.addQuestion(question);
  var words = lexer.lex(question)
  var taggedWords = tagger.tag(words);

  var namedEntity = entityResolver.findNamedEntity(taggedWords);
  var propertyId = propertyResolver.findPropertyId(taggedWords);
  var wikidataIdLookup = require('./../wikidataIdLookup');
  wikidataIdLookup.getWikidataId({searchText: namedEntity}, function(err, data){
    console.log('We are looking for ' + propertyId + ' of ' + data.id + ' (' + data.label + ')');
    if (data.id && propertyId) {
      // try it with dynamically found entities
      var Client = require('node-rest-client').Client;
      var client = new Client();
      var queryBuilder = require('./../sparqlConstants');
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
