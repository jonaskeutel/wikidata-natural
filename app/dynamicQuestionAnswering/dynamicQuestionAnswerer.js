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
        entityResolver.findNamedEntity(spacyTaggedWords, questionId, onEntityDetected, onEntityFound);
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

    function onEntityDetected(taggedWords, position) {
        propertyResolver.findPropertyId(taggedWords, questionId, position, onPropertyFound);
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
            var data = {
                property: property,
                namedEntity: namedEntity,
                result: {},
                interpretation: property.label + " of " + namedEntity.label + "?"
            };

            conversationHistory.addInterpretation(data.interpretation, questionId);

            var jsonResponse = JSON.parse(decoder.write(queryData));

            if (jsonResponse.results.bindings.length === 0) {
                data.answer = "Sorry, I didn't find an answer on Wikidata. Maybe its data is incomplete. " +
                                "You would do me a big favor if you could look it up and add it to Wikidata.";
                callback(data);
                return;
            }

            var queryResult = jsonResponse.results.bindings;
            if (namedEntity.specifierType === 'DATE') {
                var answerFound = false;
                var nearestYearIndex;
                var parsedYear = (new Date(namedEntity.specifier)).getFullYear();
                if(parsedYear < queryResult[0]['year'].value){
                    data.answer = answerFormatter.formatAnswer(property, namedEntity, [queryResult[0]]);
                } else if(parsedYear > queryResult[queryResult.length - 1]['year'].value) {
                    data.answer = answerFormatter.formatAnswer(property, namedEntity, [queryResult[queryResult.length - 1]]);
                }
                else{
                    for(var i = 0; i < queryResult.length; i++){
                        if(parsedYear == queryResult[i]['year'].value){
                            data.answer = answerFormatter.formatAnswer(property, namedEntity, [queryResult[i]]);
                            answerFound = true;
                            break;
                        } else {
                            if(parsedYear > queryResult[i]['year'].value) {
                                nearestYearIndex = i;
                            } else {
                                break;
                            }
                        }
                    }
                    if(!answerFound){
                        data.answer = answerFormatter.formatAnswer(property, namedEntity, [queryResult[nearestYearIndex]]);
                    }
                }
            } else {
                data.answer = answerFormatter.formatAnswer(property, namedEntity, queryResult);
            }
            conversationHistory.addAnswer(data.answer, questionId);
            var answerIdPart = queryResult[queryResult.length - 1].object.value; // if there are multiple answers, just take the last for the moment...
            var id = answerIdPart.lastIndexOf('Q') !== -1 ? answerIdPart.substring(answerIdPart.lastIndexOf('Q'), answerIdPart.length) : null;
            var answerEntity = {
                id: id,
                label: queryResult[queryResult.length - 1].objectLabel.value,
                multipleAnswers: queryResult.length > 1 ? true : false
            };

            if (queryResult.genderLabel) {
                answerEntity.gender = queryResult.genderLabel.value;
            } else if (id) {
                answerEntity.gender = 'neutr';
            } else {
                answerEntity.gender = null;
            }
            console.log(answerEntity);
            data.result = answerEntity;
            conversationHistory.addAnswerEntity(answerEntity, questionId);

            console.log(data);
            callback(data);
        }
    }
};

function normalizeInterpunctuation(question) {
    return question.replace(/’|´|`/g, '\'');
}
