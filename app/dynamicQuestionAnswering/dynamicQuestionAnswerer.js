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

    var property = {};
    var namedEntity = {};

    var checkFunction = function() {
        if (Object.keys(property).length === 0 || Object.keys(namedEntity).length === 0) {
            return;
        }
        // both queries are complete
        /* TODO: Check if we have proper ids, otherwise look up ids from previous question
         * (maybe look for keywords in question first (he/she/it...)) */

        var conversation = conversationHistory.messages();
        if (conversation.length > 1) {
            if (!property.id) {
                property = conversation[questionId - 1].property;
            }
            if (!namedEntity.id) {
                namedEntity = conversation[questionId - 1].answerEntity;
                console.log("Didn't find namedEntity in question; using instead: ", namedEntity);
            }
        }

        conversationHistory.addProperty(property, questionId);
        conversationHistory.addNamedEntity(namedEntity, questionId);

        client.get( queryBuilder.genercicSingleStatement(namedEntity.id, property.id), function(queryData, response) {
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
            data.result = jsonResponse.results.bindings[0].objectLabel.value;
            data.answer = property.label + " of " + namedEntity.label + " is " + data.result + ".";
            conversationHistory.addAnswer(data.answer, questionId);
            var answerIdPart = jsonResponse.results.bindings[0].object.value;
            conversationHistory.addAnswerEntity({id: answerIdPart.substring(answerIdPart.lastIndexOf('Q'),
                                                 answerIdPart.length),
                                                 label: jsonResponse.results.bindings[0].objectLabel.value},
                                                 questionId);
            callback(data);
        }).on('error', function (err) {
            console.log('something went wrong on the request', err.request.options);
            fallback();
        });
    };

    entityResolver.findNamedEntity(taggedWords, namedEntity, checkFunction);
    propertyResolver.findPropertyId(taggedWords, property, checkFunction);
};
