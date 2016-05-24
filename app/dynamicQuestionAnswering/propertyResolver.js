"use strict";

var request = require('sync-request');
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
var stringSimilarity = require('string-similarity');
var conversationHistory = require('./../conversationHistory.js');

exports.findPropertyId = function(taggedWords, questionId, callback) {
    var propertyString = findPropertyAsVerb(taggedWords);
    if (propertyString === "") {
        propertyString = findPropertyAsDescription(taggedWords);
    }

    console.log("Extracted Property:", propertyString);

    var interrogatives = findInterrogatives(taggedWords);
    var context = mapInterrogatives(interrogatives, propertyString);
    var property = lookupPropertyViaApi(propertyString, context);
    if (!property.id && !conversationHistory.wasEmpty()) {
        property = conversationHistory.messages()[questionId - 1].property;
    }
    if (!property.id) {
        callback("Could not find Property");
    }
    console.log("Property lookup returned", property.id, "-", property.label);
    callback(null, property);
};

function findPropertyAsVerb(taggedWords) {
    var propertyString = "";
    for (var i in taggedWords) {
        var taggedWord = taggedWords[i];
        var word = taggedWord[0];
        var tag = taggedWord[1];
        if (tag.startsWith('V')) {
            propertyString += word + " ";
        }
    }

    propertyString = propertyString.toLowerCase().replace(/is|are|was|were|been/g, '');
    return propertyString.trim();
}

function findPropertyAsDescription(taggedWords) {
    // everything between DT (determiner: the, some, ...) and IN (preposition: of, by, in, ...)
    var propertyString = "";
    var start = false;

    for (var i in taggedWords) {
        var taggedWord = taggedWords[i];
        var word = taggedWord[0];
        var tag = taggedWord[1];
        if (start) {
            if (tag == 'IN') {
                break;
            }
            propertyString += word + " ";
        }

        if (tag == 'DT') {
            start = true;
        }
    }
    return propertyString.trim();
}

function findInterrogatives(taggedWords) {
    var interrogatives = [];
    for (var i in taggedWords) {
        var taggedWord = taggedWords[i];
        var word = taggedWord[0];
        var tag = taggedWord[1];
        if (tag.startsWith('W')) {
            interrogatives.push(word.toLowerCase());
        }
    }
    return interrogatives;
}

function mapInterrogatives(interrogatives, propertyString) {
    var context = [];
    if (interrogatives.indexOf('where') > -1) {
        context.push('place');
        context.push('location');
    } else if (interrogatives.indexOf('when') > -1) {
        context.push('date');
        context.push('time');
    } else if (interrogatives.indexOf('who') > -1) {
        context.push('person');
        context.push(propertyString.stem() + 'er');
    }
    return context;
}

// returns propertyId that fits best, if there is no good fit: returns false
function lookupPropertyViaApi(propertyString, context) {
    var url = "https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&type=property&format=json&search=" + propertyString;
    var queryData = JSON.parse(decoder.write(request("GET", url).getBody()));
    if (!queryData || !queryData.search[0]) {
        return {};
    }

    var properties = queryData.search;

    if (context.length === 0) {
        return {id: properties[0].id, label: properties[0].label};
    }

    for (var i = 0; i < properties.length; i++) {
        for (var j = 0; j < context.length; j++ ) {
            if (isSubstring(properties[i].label, context[j])) {
                return {id: properties[i].id, label: properties[i].label};
            }
            if (isFirstWordIn(properties[i].description, context[j])) {
                return {id: properties[i].id, label: properties[i].label};
            }
            // iterate aliases
            if (properties[i].aliases === undefined) {
                break;
            }
            var numberOfAliases = properties[i].aliases.length;
            for (var a = 0; a < numberOfAliases; a++) {
                if (isSubstring(properties[i].aliases[a], context[j])) {
                    return {id: properties[i].id, label: properties[i].label};
                }
            }
        }
    }
    return {id: properties[0].id, label: properties[0].label};
}

function isSubstring(description, context) {
    return (description.toLowerCase().indexOf(context) > -1);
}

function isFirstWordIn(description, context) {
    return (description.toLowerCase().indexOf(context) === 0);
}
