"use strict";

var wikidataIdLookup = require('./../wikidataIdLookup');
var conversationHistory = require('./../conversationHistory.js');


exports.findNamedEntity = function(taggedWords, questionId, callback) {
    var namedEntityString = extractNamedEntityString(taggedWords);

    if (namedEntityString === "") {
        returnHistoryEntityInstead(callback, questionId);
        return;
    }
    console.log("Extracted Named Entity:", namedEntityString.trim());

    wikidataIdLookup.getWikidataId({searchText: namedEntityString.trim()}, function(err, data) {
        if (err) {
            returnHistoryEntityInstead(callback, questionId);
            return;
        }
        callback(null, {id: data.id, label: data.label});
    });
};


function returnHistoryEntityInstead(callback, questionId) {
    if (conversationHistory.isEmpty()) {
        callback("Could not find named entity.");
        return;
    }
    var namedEntity = conversationHistory.messages()[questionId - 1].answerEntity;
    console.log("Didn't find namedEntity in question; using instead: ", namedEntity);
    callback(null, namedEntity);
}


function extractNamedEntityString(taggedWords) {
    var tags = ["NNP", "NN"];
    // birthdate of Barack Obama --> NN IN NN NN --> namedEntity = birthdate Barack Obama --> check for IN
    var prepositionMightBeInEntity = false;

    var namedEntityString = "";

    // at first, try to find NNP or NNPS ("Proper Noun"); if this wasn't successful, also try "NN" or "NNS" ("Noun")
    for (var i in tags) {
        for (var j in taggedWords) {
            var taggedWord = taggedWords[j];
            var word = taggedWord[0];
            var tag = taggedWord[1];
            if (tag.startsWith(tags[i])) {
                if (prepositionMightBeInEntity) {
                    namedEntityString = "";
                    prepositionMightBeInEntity = false;
                }
                namedEntityString += word + " ";
            }
            if (namedEntityString !== "" && tag == 'IN') {
                prepositionMightBeInEntity = true;
            }
        }
        if (namedEntityString !== "") {
            break;
        }
    }
    return namedEntityString;
}
