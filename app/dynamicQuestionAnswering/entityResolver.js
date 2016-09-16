"use strict";

var wikidataIdLookup = require('./../wikidataIdLookup');
var conversationHistory = require('./../conversationHistory.js');


exports.findWikidataEntity = function(taggedWords, questionId, onEntityDetected, onWikidataEntityFound) {
    var namedEntity = extractNamedEntity(taggedWords, onEntityDetected);

    if (namedEntity.string === "") {
        returnHistoryEntityInstead(onWikidataEntityFound, onEntityDetected, questionId, taggedWords);
        return;
    }
    console.log("Extracted Named Entity:", namedEntity.string.trim());

    wikidataIdLookup.getWikidataId({searchText: namedEntity.string.trim()}, function(err, data) {
        if (err) {
            returnHistoryEntityInstead(onWikidataEntityFound, questionId, onEntityDetected, taggedWords);
            return;
        }
        onWikidataEntityFound(null, {
            id: data.id,
            label: data.label,
            possibleGenders: namedEntity.possibleGenders,
            type: namedEntity.type,
            specifier: namedEntity.specifier,
            specifierType: namedEntity.specifierType
        });
    });
};


function returnHistoryEntityInstead(onWikidataEntityFound, onEntityDetected, questionId, taggedWords) {
    if (conversationHistory.wasEmpty()) {
        onWikidataEntityFound("Could not find an entity in your question nor in conversation history.");
        return;
    }

    var queryGender = detectGender(taggedWords, onEntityDetected);

    for (var i = questionId - 1; i > questionId - 4 && i >= 0; i--) {
        var answerEntity = conversationHistory.messages()[i].answerEntity;
        var namedEntity = conversationHistory.messages()[i].namedEntity;
        if (answerEntity && answerEntity.id && isMatchingGender(answerEntity.possibleGenders, queryGender)) {
            onWikidataEntityFound(null, answerEntity);
            return;
        }
        if (namedEntity && namedEntity.id && isMatchingGender(namedEntity.possibleGenders, queryGender)) {
            onWikidataEntityFound(null, namedEntity);
            return;
        }
    }

    onWikidataEntityFound("Could not find an entity in your question nor in conversation history.");
}

function isMatchingGender(possibleEntityGenders, queryGender) {
    var isContained = (possibleEntityGenders.indexOf(queryGender) !== -1);
    return isContained;
}

function extractNamedEntity(taggedWords, onEntityDetected) {
    var positions = [];
    var type;
    var possibleGenders;
    var namedEntityString = "";
    var entitySpecifierString = "";
    var entitySpecifierType;
    for (var i = 0; i < taggedWords.length; i++) {
        if (taggedWords[i].entType !== '' || taggedWords[i].tag.startsWith("NNP")) {
            if (taggedWords[i].entType === 'DATE') {
                entitySpecifierString += taggedWords[i].orth + " ";
                entitySpecifierType = taggedWords[i].entType;
            } else {
                namedEntityString += taggedWords[i].orth + " ";
                positions.push(i);
                type = taggedWords[i].entType;
            }
        }
    }
    var entitySpecifier;
    if(entitySpecifierType === 'DATE'){
        if(entitySpecifierString.trim().toLowerCase() == 'today'){
            entitySpecifier = new Date();
        } else{
            entitySpecifier= new Date(entitySpecifierString);
        }
    } else {
        entitySpecifier = entitySpecifierString;
    }

    onEntityDetected(taggedWords, positions);
    if (type === "PERSON") {
        possibleGenders = ['male', 'female'];
    } else {
        possibleGenders = ['neuter'];
    }
    return {
        string: namedEntityString.trim(),
        possibleGenders: possibleGenders,
        type: type,
        specifier: entitySpecifier,
        specifierType: entitySpecifierType
    };
}

function detectGender(taggedWords, onEntityDetected) {
    for (var i = 0; i < taggedWords.length; i++) {
        switch (taggedWords[i].orth) {
            case 'he':
            case 'him':
            case 'his':
                onEntityDetected(taggedWords, [i]);
                return 'male';
            case 'she':
            case 'her':
            case 'hers':
                onEntityDetected(taggedWords, [i]);
                return 'female';
            case 'it':
            case 'its':
                onEntityDetected(taggedWords, [i]);
                return 'neuter';
            default:
                break;
        }
    }
}
