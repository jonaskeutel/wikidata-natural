exports.Intent = function(data, classifier, name) {
    var Client = require('node-rest-client').Client;
    var client = new Client();
    var StringDecoder = require('string_decoder').StringDecoder;
    var decoder = new StringDecoder('utf8');
    var queryBuilder = require('./queryBuilder');
    var wikidataIdLookup = require('./../wikidataIdLookup');
    var async = require('async');
    var string_to_number = require('string-to-number');
    var s2n = new string_to_number();
    var name = name;

    var answer = function(question, callback) {
        var parameter = this.parse(question);
        this.answerFromParameter(parameter, callback);
    }

    var answerFromParameter = function(parameter, callback) {
        this.async.waterfall([
            this.async.apply(this.wikidataIdLookup.getWikidataId, parameter),
                    this.getInterpretation,
            this.doQuery,
        ], function (err, result) {
            if (err) {
                result = {answer: err};
            }
            callback(err, result);
        });
    }

    var doQuery = function(data, callback) {
        throw new Error("To be implemented by subclass.");
    }

    var trainClassifier = function(data, classifier) {
        var name = this.name;
        for (var i = 0; i < data.length; i++) {
            classifier.learn(data[i].tokenizeAndStem().join(' '), name);
        };
    }

    var getName = function() {
        return this.name;
    }

    var getInterpretation = function(parameter, callback) {
        throw new Error("To be implemented by subclass.");
    }

    var object = {
        client: client,
        decoder: decoder,
        s2n: s2n,
        queryBuilder: queryBuilder,
        wikidataIdLookup: wikidataIdLookup,
        async: async,
        answer: answer,
        answerFromParameter: answerFromParameter,
        trainClassifier: trainClassifier,
        name: name,
        getName: getName,
        doQuery: doQuery,
        getInterpretation: getInterpretation
    }

    object.trainClassifier(data, classifier)

    return object;
}
