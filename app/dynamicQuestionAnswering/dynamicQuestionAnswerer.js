"use strict";

var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
var Client = require('node-rest-client').Client;
var httpClient = new Client();

var queryBuilder = require('./../sparqlConstants');
var QuestionParser = require('./QuestionParser');
var conversationHistory = require('./../conversationHistory');
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

    onQuestionParsed(err, wikidataProperty, wikidataEntity) {
        if (err) {
            self.callback({answer: err});
            return;
        }
        self.wikidataEntity = wikidataEntity;
        self.wikidataProperty = wikidataProperty;
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

        var queryResult = JSON.parse(decoder.write(queryResultRaw)).results.bindings;

        if (queryResult.length === 0) {
            data.answer = "Sorry, I didn't find an answer on Wikidata. Maybe its data is incomplete. " +
                            "You would do me a big favor if you could look it up and add it to Wikidata.";
            self.callback(data);
            return;
        }

        /* TODO port handling of determiner to select answers by year. possibly inside of the answerFormatter though? */

        var answerString = answerFormatter.formatAnswer(self.wikidataProperty, self.wikidataEntity, queryResult);
        var answerEntity = self.extractAnswerEntity(queryResult);

        conversationHistory.addAnswer(answerString, self.questionId);
        conversationHistory.addAnswerEntity(answerEntity, self.questionId);

        data.answer = answerString;
        data.result = answerEntity;
        console.log(data);
        self.callback(data);
    }

    extractAnswerEntity(queryResult) {
        /* TODO move this function to separate module, possibly together with determiners */

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


/*

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

*/
