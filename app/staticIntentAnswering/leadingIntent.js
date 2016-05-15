"use strict";

exports.Intent = function(data, classifier) {
    var intent = require('./Intent').Intent(data['leading'], classifier, 'leading');

    var parse = function(question) {
        var searchText;
        if (question.indexOf('leading') > -1 ) {
            searchText = question.substring(question.indexOf('leading') + 8, question.length);
        } else if (question.indexOf('of') > -1 ) {
            searchText = question.substring(question.indexOf('of') + 3, question.length);
        }
        if (searchText.indexOf('the') === 0) {
            searchText = searchText.substring(3, searchText.length);
        }
        searchText = searchText.charAt(0).toUpperCase() + searchText.slice(1);
        return {
            searchText: searchText
        };
    };

    var doQuery = function(data, callback) {
        intent.req = intent.client.get( intent.queryBuilder.whoIsLeading(data.id), function(queryData, response) {
            var jsonResponse = JSON.parse(intent.decoder.write(queryData));
            if (jsonResponse.results.bindings.length === 0) {
                data.answer = "Sorry, I didn't find an answer on Wikidata. Maybe its data is incomplete. " +
                                "You would do me a big favor if you could look it up and add it to Wikidata.";
                callback(null, data);
                return;
            }
            data.result = jsonResponse.results.bindings[0].leaderLabel.value;
            data.answer = data.result + " is leading " + data.label + ".";
            callback(null, data);
        });
        intent.req.on('error', function (err) {
            console.log('request error', err);
        });
    };

    var getInterpretation = function(data, callback) {
        data.interpretation = "Who is leading " + data.label + "?";
        callback(null, data);
    };

    intent.parse = parse;
    intent.doQuery = doQuery;
    intent.getInterpretation = getInterpretation;

    return intent;
};
