"use strict";

var spacyClient = require('./spacyClient');

var wikidataIdLookup = require('./../wikidataIdLookup');
var Client = require('node-rest-client').Client;
var client = new Client();
var queryBuilder = require('./../sparqlConstants');
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');

var entityResolver = require('./entityResolver');
var propertyResolver = require('./propertyResolver');
var conversationHistory = require('./../conversationHistory');
var answerFormatter = require('./answerFormatter');

exports.answer = function(question, callback, fallback) {
    var questionId = conversationHistory.addQuestion(question);
    var property = null;
    var namedEntity = null;
    var errorMessages = "";

    var questionNormalized = normalizeInterpunctuation(question);

    spacyClient.getSpacyTaggedWords(questionNormalized, function(spacyTaggedWords) {
        entityResolver.findNamedEntity(spacyTaggedWords, questionId, onEntityFound);
        propertyResolver.findPropertyId(spacyTaggedWords, questionId, onPropertyFound);
    });

    function onEntityFound(err, foundEntity) {
        if (err) {
            errorMessages += err + ' ';
        }
        namedEntity = foundEntity;
        if (bothResultsArrived()) {
            buildQuery();
        }
    }

    function onPropertyFound(err, foundProperty) {
        if (err) {
            errorMessages += err + ' ';
        }
        property = foundProperty;
        if (bothResultsArrived()) {
            buildQuery();
        }
    }

    function bothResultsArrived() {
        return (property !== null && namedEntity !== null);
    }

    function buildQuery() {
        if (errorMessages !== "") {
            callback({answer: errorMessages});
            return;
        }
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
            data.answer = answerFormatter.formatAnswer(property, namedEntity, queryResult);
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

function normalizeInterpunctuation(question) {
    return question.replace(/’|´|`/g, '\'');
}
