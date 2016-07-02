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
    questionNormalized = replaceWhatsByWhatIs(questionNormalized);

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

            var queryResult = jsonResponse.results.bindings;
            console.log(queryResult);
            data.interpretation = queryResult[0].objectDesc ? queryResult[0].objectLabel.value : property.label + " of " + namedEntity.label + "?";

            conversationHistory.addInterpretation(data.interpretation, questionId);

            data.answer = answerFormatter.formatAnswer(property, namedEntity, queryResult);
            conversationHistory.addAnswer(data.answer, questionId);

            if (!queryResult[0].objectDesc) {
                var answerIdPart = queryResult[0].object.value;
                var id = answerIdPart.lastIndexOf('Q') !== -1 ? answerIdPart.substring(answerIdPart.lastIndexOf('Q'), answerIdPart.length) : null;
                var answerEntity = {
                    id: id,
                    label: queryResult[0].objectLabel.value
                };

                if (queryResult[0].genderLabel) {
                    answerEntity.gender = queryResult[0].genderLabel.value;
                } else if (id) {
                    answerEntity.gender = 'neutr';
                } else {
                    answerEntity.gender = null;
                }
                console.log(answerEntity);
                data.result = answerEntity;
                conversationHistory.addAnswerEntity(answerEntity, questionId);

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
                }
            } else {
                data.answer = answerFormatter.formatAnswer(property, namedEntity, queryResult);
                var answerIdPart = queryResult[queryResult.length - 1].objectLabel.value; // if there are multiple answers, just take the last for the moment...
                conversationHistory.addAnswer(data.answer, questionId);
                var id = answerIdPart.lastIndexOf('Q') !== -1 ? answerIdPart.substring(answerIdPart.lastIndexOf('Q'), answerIdPart.length) : null;
                var answerEntity = {
                    id: id,
                    label: queryResult[queryResult.length - 1].objectLabel.value,
                    multipleAnswers: queryResult.length > 1 ? true : false
                };
                if (queryResult[0].genderLabel) {
                    answerEntity.gender = queryResult[0].genderLabel.value;
                } else if (id) {
                    answerEntity.gender = 'neuter';
                } else {
                    answerEntity.gender = null;
                }
                conversationHistory.addAnswerEntity(answerEntity, questionId);
            }

            console.log(conversationHistory.messages()[conversationHistory.messages().length - 1]);
            callback(data);
        }
    }
};


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

function replaceWhatsByWhatIs(question) {
    question = question.replace(/what\'s/g, 'what is');
    question = question.replace(/What\'s/g, 'What is');
    question = question.replace(/who\'s/g, 'who is');
    question = question.replace(/Who\'s/g, 'Who is');
    question = question.replace(/what\'re/g, 'what are');
    question = question.replace(/What\'re/g, 'What are');
    question = question.replace(/Who\'re/g, 'Who are');
    question = question.replace(/who\'re/g, 'who are');
    question = question.replace(/whats/g, 'what is');
    question = question.replace(/Whats/g, 'What is');
    question = question.replace(/whos/g, 'who is');
    question = question.replace(/Whos/g, 'Who is');

    return question;
}

function normalizeInterpunctuation(question) {
    return question.replace(/’|´|`/g, '\'');
}
