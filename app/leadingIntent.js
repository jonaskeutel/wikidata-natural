var Client = require('node-rest-client').Client;
var client = new Client();
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
var queryBuilder = require('./queryBuilder');
var wikidataIdLookup = require('./wikidataIdLookup');
var async = require('async');

exports.answer = function(question, callback) {
	var parameter = parse(question);
	this.answerFromParameter(parameter, callback);
}

exports.answerFromParameter = function(parameter, callback) {
    async.waterfall([
        async.apply(wikidataIdLookup.getWikidataId, parameter),
        doWhoIsLeadingQuery,
    ], function (err, result) {
        callback(null, result);
    });
}

exports.getTrainingData = function() {
    return [
        'who is leading china',
        'who is leading germany',
        'who is leading the usa',
        'who is the leader of berlin',
        'who is the leader of prague'
    ]
}

function parse(question) {
	var searchText;
	if (question.indexOf('leading') > -1 ) {
		searchText = question.substring(question.indexOf('leading') + 8, question.length);
	} else if (question.indexOf('of') > -1 ) {
		searchText = question.substring(question.indexOf('of') + 3, question.length);
	}
	if (searchText.indexOf('the') == 0)
			searchText = searchText.substring(3, searchText.length);
	searchText = searchText.charAt(0).toUpperCase() + searchText.slice(1);
	var interpretation = 'Who is leading ' + searchText + '?';
	return {
		interpretation: interpretation,
		searchText: searchText
	};
}

function doWhoIsLeadingQuery(data, callback) {
    client.get( queryBuilder.whoIsLeading(data.id), function(queryData, response) {
        var jsonResponse = JSON.parse(decoder.write(queryData));
        if (jsonResponse.results.bindings.length == 0) {
            data.speechOutput = "Sorry, I didn't find an answer on Wikidata. Maybe its data is incomplete. " +
                            "You would do me a big favour if you could look it up and add it to Wikidata."
            callback(null, data);
            return;
        }
        data.result = jsonResponse.results.bindings[0].leaderLabel.value;
        data.speechOutput = data.result + " is leading " + data.searchText + ".";
        callback(null, data);
    });
}
