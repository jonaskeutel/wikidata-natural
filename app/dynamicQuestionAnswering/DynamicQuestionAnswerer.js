"use strict";

var Client = require('node-rest-client').Client;
var httpClient = new Client();

var queryBuilder = require('./../sparqlConstants');
var QuestionParser = require('./QuestionParser');
var conversationHistory = require('./../conversationHistory');
var resultSelector = require('./resultSelector');
var answerFormatter = require('./answerFormatter');

var self;

class DynamicQuestionAnswerer {
    constructor(question, callback, fallback) {
        self = this;
        self.question = question;
        self.callback = callback;
        self.fallback = fallback;
        self.questionId = conversationHistory.addQuestion(question);
    }

    run() {
        new QuestionParser(self.questionId, self.question, self.onQuestionParsed).run();
    }

    onQuestionParsed(err, wikidataProperty, wikidataEntity, specifier) {
        if (err) {
            self.callback({answer: err});
            return;
        }
        self.wikidataEntity = wikidataEntity;
        self.wikidataProperty = wikidataProperty;
        self.specifier = {value: wikidataEntity.specifier, type: wikidataEntity.specifierType};
        self.interpretationString = wikidataProperty.label + ' of ' + wikidataEntity.label + '?';
        conversationHistory.addInterpretation(wikidataEntity, wikidataProperty, self.interpretationString, self.questionId);

        var query = queryBuilder.genercicSingleStatement(wikidataEntity.id, wikidataProperty.id);

        httpClient.get(query, self.onQueryResult).on('error', self.onQueryError);
    }

    onQueryError(err) {
        self.callback({answer: err});
    }

    onQueryResult(queryResultRaw) {
        var data = {
            interpretation: self.interpretationString,
            answer: null,
            result: null
        };

        var results = resultSelector.filter(queryResultRaw, self.wikidataProperty, self.specifier);

        if (results.length === 0) {
            data.answer = "Sorry, I didn't find an answer on Wikidata. Maybe its data is incomplete. " +
                            "You would do me a big favor if you could look it up and add it to Wikidata.";
            self.callback(data);
            return;
        }

        data.answer = answerFormatter.formatAnswer(self.wikidataProperty, self.wikidataEntity, results);
        data.answerEntity = self.extractAnswerEntity(results);

        conversationHistory.addAnswer(data.answer, self.questionId);
        conversationHistory.addAnswerEntity(data.answerEntity, self.questionId);

        console.log(data);
        self.callback(data);
    }

    extractAnswerEntity(queryResult) {
        // if there are multiple answers, just take the last for the moment...
        var answerIdPart = queryResult[queryResult.length - 1].object.value;
        var id = answerIdPart.lastIndexOf('Q') !== -1 ? answerIdPart.substring(answerIdPart.lastIndexOf('Q'), answerIdPart.length) : null;
        var answerEntity = {
            id: id,
            label: queryResult[queryResult.length - 1].objectLabel.value,
            multipleAnswers: queryResult.length > 1 ? true : false
        };
        if (queryResult[0].genderLabel) {
            answerEntity.possibleGenders = [queryResult[0].genderLabel.value];
        } else if (id) {
            answerEntity.possibleGenders = ['neuter'];
        } else {
            answerEntity.possibleGenders = null;
        }
        console.log('answerEntity:', answerEntity);
        return answerEntity;
    }
}

module.exports = DynamicQuestionAnswerer;
