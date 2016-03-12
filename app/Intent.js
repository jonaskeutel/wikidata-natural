(exports.a = function(data, classifier, name){
	var Client = require('node-rest-client').Client;
	var client = new Client();
	var StringDecoder = require('string_decoder').StringDecoder;
	var decoder = new StringDecoder('utf8');
	var queryBuilder = require('./queryBuilder');
	var wikidataIdLookup = require('./wikidataIdLookup');
	var async = require('async');
	var name = name;

	var answer = function(question, callback) {
		var parameter = this.parse(question);
		this.answerFromParameter(parameter, callback);
	}

	var answerFromParameter = function(parameter, callback) {
	    this.async.waterfall([
	        this.async.apply(this.wikidataIdLookup.getWikidataId, parameter),
	        this.doQuery,
	    ], function (err, result) {
	        callback(null, result);
	    });
	}

	var doQuery = function(data, callback) {
		throw new Error("Not yet implemented!");
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

	var object = {
		client: client,
		decoder: decoder,
		queryBuilder: queryBuilder,
		wikidataIdLookup: wikidataIdLookup,
		async: async,
		answer: answer,
		answerFromParameter: answerFromParameter,
		trainClassifier: trainClassifier,
		getName: getName,
		doQuery: doQuery
	}

	object.trainClassifier(data, classifier)

	return object;
})
