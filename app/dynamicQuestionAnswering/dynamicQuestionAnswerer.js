var pos = require('pos');
var lexer = new pos.Lexer();
var tagger = new pos.Tagger();

var wikidataIdLookup = require('./../wikidataIdLookup');
var Client = require('node-rest-client').Client;
var client = new Client();
var queryBuilder = require('./../sparqlConstants');
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');

var entityResolver = require('./entityResolver');
var propertyResolver = require('./propertyResolver');
var conversationHistory = require('./../conversationHistory.js');

exports.answer = function(question, callback, fallback) {
  var questionId = conversationHistory.addQuestion(question);
  var words = lexer.lex(question)
  var taggedWords = tagger.tag(words);

  var namedEntity = entityResolver.findNamedEntity(taggedWords);
  var propertyId = propertyResolver.findPropertyId(taggedWords);

  wikidataIdLookup.getWikidataId({searchText: namedEntity}, function(err, data){
    if (!err && data.id && propertyId) {
      console.log('We are looking for ' + propertyId + ' of ' + data.id + ' (' + data.label + ')');
      // try it with dynamically found entities
      client.get( queryBuilder.genercicSingleStatement(data.id, propertyId), function(queryData, response) {
          data.interpretation = propertyId + " of " + data.label + "?";
          conversationHistory.addInterpretation(data.interpretation, questionId);
          var jsonResponse = JSON.parse(decoder.write(queryData));
          if (jsonResponse.results.bindings.length == 0) {
              data.answer = "Sorry, I didn't find an answer on Wikidata. Maybe its data is incomplete. " +
                              "You would do me a big favor if you could look it up and add it to Wikidata."
              callback(data);
              return;
          }
          data.result = jsonResponse.results.bindings[0].objectLabel.value;
          data.answer = propertyId + " of " + data.label + " is " + data.result + ".";
          conversationHistory.addAnswer(data.answer, questionId);
          callback(data);
      });
    } else {
      fallback();
    }
  })
}
