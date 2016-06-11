"use strict";

var wikidataIdLookup = require('./../wikidataIdLookup');
var conversationHistory = require('./../conversationHistory.js');


exports.findNamedEntity = function(taggedWords, questionId, namedEntityDetected, entityFound) {
    var namedEntity = extractNamedEntity(taggedWords, namedEntityDetected);

    if (namedEntity.string === "") {
        returnHistoryEntityInstead(entityFound, namedEntityDetected, questionId, taggedWords);
        return;
    }
    console.log("Extracted Named Entity:", namedEntity.string.trim());

    wikidataIdLookup.getWikidataId({searchText: namedEntity.string.trim()}, function(err, data) {
        if (err) {
            returnHistoryEntityInstead(entityFound, questionId, namedEntityDetected, taggedWords);
            return;
        }
        entityFound(null, {id: data.id, label: data.label, gender: namedEntity.gender, type: namedEntity.type});
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
        if (answerEntity.id && (gender === answerEntity.gender || (gender !== null && answerEntity.gender === "?"))) {
            entityFound(null, answerEntity);
            return;
        }
        if (namedEntity.id && (gender === namedEntity.gender || (gender !== null && namedEntity.gender === "?"))) {
            entityFound(null, namedEntity);
            return;
        }
    }

    console.log("Didn't find namedEntity in question; using instead: ", conversationHistory.messages()[questionId - 1].answerEntity);
    entityFound(null, conversationHistory.messages()[questionId - 1].answerEntity);

}

function extractNamedEntity(taggedWords, namedEntityDetected) {
    var positions = [];
    var type;
    var gender;
    var namedEntityString = "";
    for (var i = 0; i < taggedWords.length; i++) {
        if (taggedWords[i].entType !== '') {
            namedEntityString += taggedWords[i].orth + " ";
            positions.push(i);
            type = taggedWords[i].entType;
        }
    }
    namedEntityDetected(taggedWords, positions);
    if (type === "PERSON") {
        gender = "?";
    } else {
        gender = 'neuter';
    }
    return {
        string: namedEntityString.trim(),
        gender: gender,
        type: type
    };
}

function detectGender(taggedWords, namedEntityDetected) {
    for (var i = 0; i < taggedWords.length; i++) {
        switch (taggedWords[i].orth) {
            case 'he':
            case 'him':
            case 'his':
                namedEntityDetected(taggedWords, [i]);
                return 'male';
            case 'she':
            case 'her':
            case 'hers':
                namedEntityDetected(taggedWords, [i]);
                return 'female';
            case 'it':
            case 'its':
                namedEntityDetected(taggedWords, [i]);
                return 'neuter';
            default:
                break;
        }
    }
    // no entity at all...
    namedEntityDetected(taggedWords, null)
}
