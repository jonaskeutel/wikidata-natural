"use strict";

var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');

exports.filter = function(queryResultRaw, specifier, specifierType) {
    var queryResults = JSON.parse(decoder.write(queryResultRaw)).results.bindings;

    if (specifierType === 'DATE') {
        var answerFound = false;
        var nearestYearIndex;
        var parsedYear = (new Date(specifier)).getFullYear();
        if (parsedYear < queryResults[0]['year'].value) {
            return [queryResults[0]];
        }
        if (parsedYear > queryResults[queryResults.length - 1]['year'].value) {
            return [queryResults[queryResults.length - 1]];
        }
        for (var i = 0; i < queryResults.length; i++) {
            if (parsedYear == queryResults[i]['year'].value) {
                return [queryResults[i]];
            }
            if (parsedYear > queryResults[i]['year'].value) {
                nearestYearIndex = i;
            }
        }
        return [queryResults[nearestYearIndex]];
    }
    return queryResults;
};
