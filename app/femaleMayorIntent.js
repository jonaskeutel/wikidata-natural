var Client = require('node-rest-client').Client;
var client = new Client();
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
var queryBuilder = require('./queryBuilder');
var wikidataIdLookup = require('./wikidataIdLookup');
var async = require('async');
var string_to_number = require('string-to-number');
var s2n = new string_to_number();

exports.answer = function(question, callback) {
	console.log("Trying to answer femaleMayorIntent");
	var parameter = parse(question);
	console.log("Parameters are: ", parameter);
	this.answerFromParameter(parameter, callback);
}

exports.answerFromParameter = function(parameter, callback) {
	async.waterfall([
        async.apply(wikidataIdLookup.getWikidataId, parameter),
        doBiggestCityWithFemaleMayorQuery,
    ], function (err, result) {
        callback(null, result);
    });
}

exports.getTrainingData = function() {
	return [
		'what is the biggest city in spain with a female mayor', 
		'what are the 3 biggest cities in the usa that have a female mayor', 
		'what are the three biggest cities in the netherlands that are run by a female'
	]
}
function parse(question) {
	var number = findAmount(question);
	var country = findCountry(question);
	var interpretation;
	if (number == 1)
		interpretation = 'What is the biggest city in ' + country + ' that has a female mayor?';
	else
		interpretation = 'What are the ' + number + ' biggest cities in ' + country + ' that have a female mayor?';
	return {
		interpretation: interpretation,
		amount: number,
		searchText: country
	};
}

function findAmount(question) {
	if (question.indexOf("is the") > -1 || question.indexOf('\'s the') > -1 || question.indexOf('the biggest city') > -1 )
		return 1
	var beforeNumberString = question.indexOf('biggest cities') > -1 ? question.indexOf('the') + 4 : question.indexOf('biggest') + 8
	var afterNumberString = question.indexOf('biggest cities') > -1 ? question.indexOf('biggest') - 1 : question.indexOf('cities') - 1;
	var numberString = question.substring(beforeNumberString, afterNumberString);
	var amount;
	if (!isNaN(parseInt(numberString)))
		amount = parseInt(numberString);
	else if (s2n.convert(numberString))
		amount = s2n.convert(numberString);
	else
		amount = 3; //default

	return amount;
}

function findCountry(question) {
	var start = question.indexOf('in ') + 3;
	var end = question.indexOf(' ', start);
	end = end == -1 ? question.length : end;
	var country = question.substring(start, end);
	return country.charAt(0).toUpperCase() + country.slice(1);
}

function doBiggestCityWithFemaleMayorQuery(data, callback) {
    client.get( queryBuilder.femaleMayors(data.id, data.amount), function(queryData, response) {
        var jsonResponse = JSON.parse(decoder.write(queryData));
        if (jsonResponse.results.bindings.length == 0) {
            data.speechOutput = "Sorry, I didn't find an answer on Wikidata. Maybe its data is incomplete. " +
                            "You would do me a big favour if you could look it up and add it to Wikidata."
            callback(null, data);
            return;
        }

        var resultArray = jsonResponse.results.bindings;
        data.result = resultArray;
        console.log("Result: ", resultArray);
        if (data.amount == 1) {
        	speechOutput = "The biggest city in " + data.searchText + " that is run by a female is " + resultArray[0].cityLabel.value;
        } else {
        	speechOutput = "The " + data.amount + " biggest cities in " + data.searchText + " that are run by a female are ";
	        for (var i = 0; i < resultArray.length - 1; i++) {
	            speechOutput += resultArray[i].cityLabel.value + ", ";
	        };
	        speechOutput += "and " + resultArray[resultArray.length - 1].cityLabel.value;	
        }
        
        data.speechOutput = speechOutput;
        callback(null, data);
    });
}