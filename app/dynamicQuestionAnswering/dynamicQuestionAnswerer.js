"use strict";

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
    var words = lexer.lex(question);
    var taggedWords = tagger.tag(words);

    var property = null;
    var namedEntity = null;

    entityResolver.findNamedEntity(taggedWords, questionId, onEntityFound);
    propertyResolver.findPropertyId(taggedWords, questionId, onPropertyFound);


    function onEntityFound(err, foundEntity) {
        /* TODO error handling */
        namedEntity = foundEntity;
        if (bothResultsArrived()) {
            buildQuery();
        }
    }

    function onPropertyFound(err, foundProperty) {
        /* TODO error handling */
        property = foundProperty;
        if (bothResultsArrived()) {
            buildQuery();
        }
    }

    function bothResultsArrived() {
        return (property !== null && namedEntity !== null);
    }

    function buildQuery() {
        conversationHistory.addProperty(property, questionId);
        conversationHistory.addNamedEntity(namedEntity, questionId);

        var query = queryBuilder.genercicSingleStatement(namedEntity.id, property.id);

        client.get(query, onQueryResult).on('error', function (err) {
            console.log('something went wrong on the request', err.request.options);
            fallback();
        });

        function onQueryResult(queryData) {
            var data = {};

            data.interpretation = property.label + " of " + namedEntity.label + "?";
            conversationHistory.addInterpretation(data.interpretation, questionId);

            var jsonResponse = JSON.parse(decoder.write(queryData));

            if (jsonResponse.results.bindings.length === 0) {
                data.answer = "Sorry, I didn't find an answer on Wikidata. Maybe its data is incomplete. " +
                                "You would do me a big favor if you could look it up and add it to Wikidata.";
                callback(data);
                return;
            }

            var queryResult = jsonResponse.results.bindings[0];

            data.result = queryResult.objectLabel.value;
            data.answer = property.label + " of " + namedEntity.label + " is " + data.result + ".";
            conversationHistory.addAnswer(data.answer, questionId);
            var answerIdPart = queryResult.object.value;
            var answerEntity = {
                id: answerIdPart.substring(answerIdPart.lastIndexOf('Q'), answerIdPart.length),
                label: queryResult.objectLabel.value
            };
            conversationHistory.addAnswerEntity(answerEntity, questionId);
            callback(data);
        }
    }
};
