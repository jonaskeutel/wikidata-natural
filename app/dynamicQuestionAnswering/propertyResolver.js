"use strict";

var request = require('sync-request');
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
var stringSimilarity = require('string-similarity');
var conversationHistory = require('./../conversationHistory.js');

var propertyPartsArray = []; //global...

exports.findWikidataProperty = function(taggedWords, questionId, positions, callback) {
    console.log("Named entity is at position: " + positions)
    var propertyString = findProperty(taggedWords, positions);

    console.log("Extracted Property:", propertyString);

    var interrogatives = findInterrogatives(taggedWords);
    var context = mapInterrogatives(interrogatives, taggedWords);
    var property = lookupPropertyViaApi(propertyString, context);
    property.interrogatives = interrogatives;
    property.propertyString = propertyString;

    if (!property.id && !conversationHistory.wasEmpty()) {
        property = returnHistoryPropertyInstead(questionId);
    }
    if (!property || !property.id) {
        callback("Could not find a property in your question nor in conversation history.");
        return;
    }
    console.log("Property lookup returned", property.id, "-", property.label);
    callback(null, property);
};

function findProperty(taggedWords, positions) {
    propertyPartsArray = [];
    var rootIndex = findRootIndex(taggedWords);
    // assuming, only one children-path yields to namedEntity
    if (findPropertyString(taggedWords, rootIndex, 0, positions)) {
        var result = propertyPartsArray[propertyPartsArray.length-1] === "of" ? propertyPartsArray.slice(0, propertyPartsArray.length - 1).join(' ') : propertyPartsArray.join(' ');
        return result;
    } else {
        return "";
    }
}

function findRootIndex(taggedWords) {
    for (var i = 0; i < taggedWords.length; i++) {
        if (taggedWords[i].depType === 'ROOT') {
            return i;
        }
    }
}

function findInterrogatives(taggedWords) {
    var interrogatives = [];
    for (var i in taggedWords) {
        var taggedWord = taggedWords[i];
        var word = taggedWord.orth;
        var tag = taggedWord.tag;
        if (tag.startsWith('W')) {
            interrogatives.push(word.toLowerCase());
        }
    }
    return interrogatives;
}

function mapInterrogatives(interrogatives, taggedWords) {
    var context = [];
    if (interrogatives.indexOf('where') > -1) {
        context.push('place');
        context.push('location');
    } else if (interrogatives.indexOf('when') > -1) {
        context.push('date');
        context.push('time');
    } else if (interrogatives.indexOf('who') > -1) {
        for (var i in taggedWords) {
            var taggedWord = taggedWords[i];
            var tag = taggedWord.tag;
            if (tag.startsWith('V')) {
                context.push(taggedWord.lemma + 'er');
            }
        }
    }
    return context;
}

// returns propertyId that fits best, if there is no good fit: returns false
function lookupPropertyViaApi(propertyString, context) {
    var url = "https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&type=property&format=json&search=" + propertyString;
    var queryData = JSON.parse(decoder.write(request("GET", url).getBody()));
    if (!queryData || !queryData.search || !queryData.search[0]) {
        return {};
    }

    var properties = queryData.search;

    // look if we have perfect match
    for (var i = 0; i < properties.length; i++) {
        if (properties[i].label === propertyString) {
            return {id: properties[i].id, label: properties[i].label};
        }
    }

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


function findPropertyString(taggedWords, index, amountOfVerbsOrNouns, positionsOfNamedEntity) {
    var element = taggedWords[index];
    if (positionsOfNamedEntity.indexOf(index) !== -1 && amountOfVerbsOrNouns > 0) {
        return true;
    }

    if (element.lemma !== "be" && element.lemma !== "have") {
        propertyPartsArray.push(element.orth);
        if (element.tag.startsWith('V') || element.tag.startsWith('NN')) {
            amountOfVerbsOrNouns++;
        }
    }

    for (var i = 0; i < element.depChildren.length; i++) {
        if (findPropertyString(taggedWords, element.depChildren[i].pos, amountOfVerbsOrNouns, positionsOfNamedEntity)) {
            return true;
        }
    }

    if (element.lemma !== "be" && element.lemma !== "have") {
        propertyPartsArray = propertyPartsArray.slice(0, propertyPartsArray.length - 1);
        if (element.tag.startsWith('V') || element.tag.startsWith('NN')) {
            amountOfVerbsOrNouns--;
        }
    }
    return false;
}

function returnHistoryPropertyInstead(questionId) {
    return conversationHistory.messages()[questionId - 1].property;
}
