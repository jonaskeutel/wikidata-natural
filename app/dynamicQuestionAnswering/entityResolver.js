"use strict";

var wikidataIdLookup = require('./../wikidataIdLookup');
var conversationHistory = require('./../conversationHistory.js');


exports.findNamedEntity = function(taggedWords, questionId, namedEntityDetected, entityFound) {
    var namedEntityString = extractNamedEntityString(taggedWords, namedEntityDetected);

    if (namedEntityString === "") {
        returnHistoryEntityInstead(entityFound, namedEntityDetected, questionId, taggedWords);
        return;
    }
    console.log("Extracted Named Entity:", namedEntityString.trim());

    wikidataIdLookup.getWikidataId({searchText: namedEntityString.trim()}, function(err, data) {
        if (err) {
            returnHistoryEntityInstead(entityFound, questionId, namedEntityDetected, taggedWords);
            return;
        }
        entityFound(null, {id: data.id, label: data.label});
    });
};


function returnHistoryEntityInstead(entityFound, namedEntityDetected, questionId, taggedWords) {
    if (conversationHistory.wasEmpty()) {
        entityFound("Could not find named entity in question or conversation history.");
        return;
    }

    var gender = detectGender(taggedWords, namedEntityDetected);

    for (var i = questionId - 1; i > questionId - 4 && i >= 0; i--) {
        var answerEntity = conversationHistory.messages()[i].answerEntity;
        var namedEntity = conversationHistory.messages()[i].namedEntity;
        if (gender == answerEntity.gender) {
            console.log("Didn't find namedEntity in question; using instead: ", answerEntity);
            entityFound(null, answerEntity);
            return;
        }
        if (gender == namedEntity.gender) {
            console.log("Didn't find namedEntity in question; using instead: ", namedEntity);
            entityFound(null, namedEntity);
            return;
        }
    }

    console.log("Didn't find namedEntity in question; using instead: ", conversationHistory.messages()[questionId - 1].answerEntity);
    entityFound(null, conversationHistory.messages()[questionId - 1].answerEntity);

}

function extractNamedEntityString(taggedWords, namedEntityDetected) {
    var found = false;
    var namedEntityString = "";
    for (var i = 0; i < taggedWords.length; i++) {
        if (taggedWords[i].entType !== '') {
            namedEntityString += taggedWords[i].orth + " ";
            if (!found) {
                namedEntityDetected(taggedWords, i);
            }
        }
    }
    return namedEntityString.trim();
}

function detectGender(taggedWords, namedEntityDetected) {
    console.log("no named entity found, looking instead for words like 'he', 'she', 'it', ...");
    for (var i = 0; i < taggedWords.length; i++) {
        console.log(taggedWords[i].orth);
        switch (taggedWords[i].orth) {
            case 'he':
            case 'him':
            case 'his':
                namedEntityDetected(taggedWords, i);
                console.log(i);
                return 'male';
            case 'she':
            case 'her':
                namedEntityDetected(taggedWords, i);
                console.log(i);
                return 'female';
            case 'it':
            case 'its':
                namedEntityDetected(taggedWords, i);
                console.log(i);
                return undefined;
            default:
                break;
        }
    }
}
