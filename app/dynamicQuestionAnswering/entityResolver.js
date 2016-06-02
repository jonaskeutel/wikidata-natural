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
    if (conversationHistory.wasEmpty()) {
        callback("Could not find named entity in question or conversation history.");
        return;
    }
    var namedEntity = conversationHistory.messages()[questionId - 1].answerEntity;
    console.log("Didn't find namedEntity in question; using instead: ", namedEntity);
    callback(null, namedEntity);
}

function extractNamedEntityString(taggedWords) {
    console.log(taggedWords);
    var namedEntityString = "";
    for (var i = 0; i < taggedWords.length; i++) {
        if (taggedWords[i].entType !== '') {
            namedEntityString += taggedWords[i].orth + " ";
        }
    }
    return namedEntityString.trim();
}
