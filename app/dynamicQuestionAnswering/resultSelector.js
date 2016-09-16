"use strict";

var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');

exports.filter = function(queryResultRaw, wikidataProperty, specifier) {
    var queryResults = JSON.parse(decoder.write(queryResultRaw)).results.bindings;

    if (specifier.type == 'DATE') {
        return selectByYear(queryResults, specifier.value);
    }
    if (wikidataProperty.label == 'population') {
    	return last(queryResults);
    }
    return queryResults;
};

function selectByYear(queryResults, specifiedYear) {
	var answerFound = false;
    var nearestYearIndex;
    var parsedYear = (new Date(specifiedYear)).getFullYear();
    if (parsedYear < queryResults[0]['year'].value) {
        return first(queryResults);
    }
    if (parsedYear > queryResults[queryResults.length - 1]['year'].value) {
        return last(queryResults);
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

function first(array) {
	return [array[0]];
}

function last(array) {
	return [array[array.length - 1]];
}
