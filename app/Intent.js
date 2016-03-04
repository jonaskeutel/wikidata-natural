(function(data, classifier){
	var Client = require('node-rest-client').Client;
	var client = new Client();
	var StringDecoder = require('string_decoder').StringDecoder;
	var decoder = new StringDecoder('utf8');
	var queryBuilder = require('./queryBuilder');
	var wikidataIdLookup = require('./wikidataIdLookup');
	var async = require('async');

	var answer = function(question, callback) {
		var parameter = parse(question);
		this.answerFromParameter(parameter, callback);
	}

	var answerFromParameter = function(parameter, callback) {
	    this.async.waterfall([
	        this.async.apply(this.wikidataIdLookup.getWikidataId, parameter),
	        doQuery,
	    ], function (err, result) {
	        callback(null, result);
	    });
	}

	var doQuery = function(data, callback) {
		throw new Error("Not yet implemented!");
	}

	var object = {
		client: client,
		decoder: decoder,
		queryBuilder: queryBuilder,
		wikidataIdLookup: wikidataIdLookup,
		async: async,
		answer: function(){},
		trainClassifier: function(data){}
	}

	object.trainClassifier(data, classifier)

	return object;
})