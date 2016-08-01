"use strict";

var DynamicQuestionAnswerer = require('./dynamicQuestionAnswering/DynamicQuestionAnswerer');
var staticIntentAnswerer = require('./staticIntentAnswering/staticIntentAnswerer');

exports.answer = function(question, callback) {
    // try to extract all the information through NLP, dynamically build the query and answer question
    // if unsuccessful, see if question can be mapped to "complicated" intent and be answered there

    function fallback() {
    	staticIntentAnswerer.answer(question, callback);
    }

    new DynamicQuestionAnswerer(question, callback, fallback).run();
};
