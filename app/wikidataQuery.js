var WikidataSearch = require('wikidata-search').WikidataSearch;
var wikidataSearch = new WikidataSearch();
var Client = require('node-rest-client').Client;
var client = new Client();
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
var async = require('async');
var queryBuilder = require('./queryBuilder');
var mayorParser = require('./mayorParser');
var birthdateParser = require('./birthdateParser');
var leadingParser = require('./leadingParser');

var QUESTION_NOT_UNDERSTOOD = {
    interpretation: 'I didn\'t understand the question. Please try asking the question in a different way. Maybe, this type of question isn\'t supported yet. In that case, feel free to contact the development team (TODO: Link einfügen)',
    speechOutput: 'I am sorry, but I don\'t know...'
}

exports.parseAndAnswerQuestion = function(question, callback) {
    question = question.toLowerCase().replace(/[^a-z0-9 ]/g, '');

    if (question.indexOf('city') > -1 || question.indexOf('cities') > -1) {
        console.log('female mayor intent');
        this.biggestCitiesWithFemaleMayors(mayorParser.parse(question), callback);
    } else if (question.indexOf('born') > -1 || question.indexOf('birthday') > -1 || question.indexOf('birthdate') > -1 ) {
        console.log('birthdate intent');
        this.getBirthdate(birthdateParser.parse(question), callback);
    } else if (question.indexOf('leading') > -1 || question.indexOf('president of') > -1 || question.indexOf('leader of') > -1 ) {
        console.log('leading intent');
        this.whoIsLeading(leadingParser.parse(question), callback);
    } else {
        console.log('question not understood');
        callback(QUESTION_NOT_UNDERSTOOD);
    }
}

exports.whoIsLeading = function(data, callback) {
    async.waterfall([
        async.apply(getWikidataId, data),
        doWhoIsLeadingQuery,
    ], function (err, result) {
        callback(data);
    });
}

exports.biggestCitiesWithFemaleMayors = function(data, callback) {
    async.waterfall([
        async.apply(getWikidataId, data),
        doBiggestCityWithFemaleMayorQuery,
    ], function (err, result) {
        callback(data);
    });
}

exports.getBirthdate = function(data, callback) {
    async.waterfall([
        async.apply(getWikidataId, data),
        doBirtdateQuery,
    ], function (err, result) {
        if (err) {
            data.speechOutput = err;
        };
        callback(data);
    });
}


// --------------- Custom functions -----------------------
function getWikidataId(data, callback) {
    console.log("getWikidataId: ", data);
    wikidataSearch.set('search', data.searchText);
    wikidataSearch.search(function(result, error) {
        if (result.results.length == 0) {
            callback('Sorry, I didn\'t find an item on Wikidata matching ' + data.searchText + '.');
        } else {
            data.id = result.results[0].id;
            callback(null, data);
        }
    });
}

// ---------------- Queries -----------------------
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
        data.speechOutput = data.searchText + " was born on " + resultDate;
        callback(null, data);
    });
    
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
        speechOutput = "The " + data.amount + " biggest cities in " + data.searchText + " that are run by a female are ";
        for (var i = 0; i < resultArray.length - 1; i++) {
            speechOutput += resultArray[i].cityLabel.value + ", ";
        };
        speechOutput += "and " + resultArray[resultArray.length - 1].cityLabel.value;
        data.speechOutput = speechOutput;
        callback(null, data);
    });
}

// --------------------- TEST INVOKATIONS ------------------------

//this.whoIsLeading({searchText: 'China'}, function(data){
//    console.log(data);
//})

// this.biggestCitiesWithFemaleMayors({searchText: 'spain', amount: 3}, function(data){
//     console.log(data);
// })

// this.getBirthdate({searchText: 'Lydia Pintscher'}, function(data){
//     console.log(data);
// })