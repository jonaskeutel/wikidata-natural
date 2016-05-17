"use strict";

var assert = require('assert');
var mapModule = require('./../app/wikidataQuery');

describe('mapTest', function() {
    it('should map every given sentence to the exact one intent it blongs to', function() {
        mapModule.trainClassifier();
        assert(mapModule.map('What is the biggest city in Italy with a female mayor?') === 0, 'mayorIntent');
        assert(mapModule.map('When was Lionel Messi born?') == 1, 'birthdateIntent');
        assert(mapModule.map('Who is leading China?') == 2, 'leadingIntent');
        assert(mapModule.map('What is the population of India?') == 3, 'populationIntent');
        assert(mapModule.map('When died Stalin?') == 4, 'dateOfDeathIntent');
        assert(mapModule.map('When was SAP founded?') == 5, 'inceptionIntent');
        // the two film questions are so similar that they should be mapped to one question and the question itself distinguishes between them
        assert(mapModule.map('Who played in Inception?') == 6, 'filmIntent');
        assert(mapModule.map('In which films did Johnny Depp play?') == 6, 'filmIntent');
    });
});
