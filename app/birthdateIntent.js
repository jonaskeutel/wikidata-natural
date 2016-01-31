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
        doBirtdateQuery,
    ], function (err, result) {
        callback(null, result);
    });
}

exports.getTrainingData = function() {
    return [
        'when was jimmy wales born',
        'what is the birthday of barack obama',
        'what is the bithdate of sido',
        'when was messi born',
        'what is the birthday of ronaldinho',
        'what is the bithdate of oliver kahn'
    ]
}

function parse(question) {
	var searchText;
	if (question.indexOf('of') > -1 ) {
		searchText = question.substring(question.indexOf('of') + 3, question.length);
	} else if (question.indexOf('born') > -1 ) {
		var start = question.indexOf('is') > -1 ? question.indexOf('is') + 3 : question.indexOf('was') + 4
		searchText = question.substring(start, question.indexOf('born') - 1 );
	}
    searchTerms = searchText.split(' ');
    for (var i = 0; i < searchTerms.length; i++) {
        searchTerms[i] = searchTerms[i].charAt(0).toUpperCase() + searchTerms[i].slice(1);
    };
    searchText = searchTerms.join(' ');
	//searchText = searchText.charAt(0).toUpperCase() + searchText.slice(1);
	var interpretation = 'When was ' + searchText + ' born?';
	return { 
		interpretation: interpretation,
		searchText: searchText
	};
}

function doBirtdateQuery(data, callback) {
    client.get( queryBuilder.dateOfBirth(data.id), function(queryData, response) {
        var jsonResponse = JSON.parse(decoder.write(queryData));
        if (jsonResponse.results.bindings.length == 0) {
            data.speechOutput = "Sorry, I didn't find an answer on Wikidata. Maybe its data is incomplete. " +
                            "You would do me a big favour if you could look it up and add it to Wikidata."
            callback(null, data);
            return;
        }

        var resultDate = jsonResponse.results.bindings[0].date.value;
        resultDate = resultDate.substring(0, resultDate.search('T'));
        data.speechOutput = data.searchText + " was born on " + resultDate + ".";
        callback(null, data);
    }); 
}