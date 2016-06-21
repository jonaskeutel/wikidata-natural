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

const DESCRIPTION_PHRASES = [
    "Who is NNP ?",
    "Who was NNP ?",
    "What is NNP ?",
    "What was NNP ?",
    "What does NNP mean ?",
    "What means NNP ?"
];

exports.answer = function(question, callback, fallback) {
    var questionId = conversationHistory.addQuestion(question);
    var property = null;
    var namedEntity = null;
    var errorMessages = "";

    var questionNormalized = normalizeInterpunctuation(question);

    spacyClient.getSpacyTaggedWords(questionNormalized, function(spacyTaggedWords) {
        if (isDescriptionQuestion(spacyTaggedWords)) {
            entityResolver.findNamedEntity(spacyTaggedWords, questionId, function(){}, buildDescriptionQuery)
        } else {
            entityResolver.findNamedEntity(spacyTaggedWords, questionId, onEntityDetected, onEntityFound);
        }
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

    function buildDescriptionQuery(err, foundEntity) {
        if (err) {
            errorMessages += err + ' ';
            callback({answer: errorMessages});
            return;
        }
        conversationHistory.addNamedEntity(foundEntity, questionId);

        var query = queryBuilder.description(foundEntity.id);
        doQuery(query);
    }

    function buildQuery() {
        if (errorMessages !== "") {
            callback({answer: errorMessages});
            return;
        }
        conversationHistory.addProperty(property, questionId);
        conversationHistory.addNamedEntity(namedEntity, questionId);

        var query = queryBuilder.genercicSingleStatement(namedEntity.id, property.id);

        doQuery(query)
    }

    function doQuery(query) {
        client.get(query, onQueryResult).on('error', function (err) {
            console.log('something went wrong on the request', err.request.options);
            fallback();
        });

        function onQueryResult(queryData) {
            var data = {
                property: property,
                namedEntity: namedEntity,
                result: {}
            };


            var jsonResponse = JSON.parse(decoder.write(queryData));

            if (jsonResponse.results.bindings.length === 0) {
                data.answer = "Sorry, I didn't find an answer on Wikidata. Maybe its data is incomplete. " +
                                "You would do me a big favor if you could look it up and add it to Wikidata.";
                callback(data);
                return;
            }

            var queryResult = jsonResponse.results.bindings[0];
            console.log(queryResult);
            data.interpretation = queryResult.objectDesc ? "TODO..." : property.label + " of " + namedEntity.label + "?";

            conversationHistory.addInterpretation(data.interpretation, questionId);

            data.answer = answerFormatter.formatAnswer(property, namedEntity, queryResult);
            conversationHistory.addAnswer(data.answer, questionId);

            if (!queryResult.objectDesc) {
                var answerIdPart = queryResult.object.value;
                var id = answerIdPart.lastIndexOf('Q') !== -1 ? answerIdPart.substring(answerIdPart.lastIndexOf('Q'), answerIdPart.length) : null;
                var answerEntity = {
                    id: id,
                    label: queryResult.objectLabel.value
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
            }

            console.log(data);
            callback(data);
        }
    }
};

function normalizeInterpunctuation(question) {
    return question.replace(/’|´|`/g, '\'');
}

function isDescriptionQuestion(taggedWords) {
    console.log("Compare: ");
    console.log(taggedWords);
    console.log(DESCRIPTION_PHRASES);
    for (var i = 0; i < DESCRIPTION_PHRASES.length; i++) {
        var words = DESCRIPTION_PHRASES[i].split(" ");
        console.log("Trying: " + words);
        var posInWords = 0;
        var namedEntityFound = false;
        for (var j = 0; j < taggedWords.length; j++) {
            if ((taggedWords[j].tag.startsWith("NNP")) && words[posInWords] === "NNP") {
                namedEntityFound = true;
                console.log("allright inclusive NNP");
                continue;
            } else if (words[posInWords] === "NNP") {
                if (namedEntityFound) {
                    console.log("over NNP");
                    posInWords++;
                } else {
                    break;
                }
            }
            console.log("basecase");
            console.log("Compare " + taggedWords[j].orth + " and " + words[posInWords]);
            if (taggedWords[j].orth === words[posInWords]) {
                posInWords++;
                if (posInWords === words.length) {
                    return true;
                }
                continue;
            }
            break;
        }
    }
    return false;
}
