"use strict";

var m_messages = [];

var conversationHistory = {
    messages: function() {
        return m_messages;
    },

    addQuestion: function(question) {
        m_messages.push({question:question});
        return m_messages.length - 1;
    },

    addInterpretation: function(wikidataEntity, wikidataProperty, interpretationString, id) {
        m_messages[id].namedEntity = wikidataEntity;
        m_messages[id].property = wikidataProperty;
        m_messages[id].interpretation = interpretationString;
    },

    addAnswer: function(answer, id) {
        m_messages[id].answer = answer;
    },

    // AnswerEntity is object with keys 'id' and 'label'
    addAnswerEntity: function(answerEntity, id) {
        m_messages[id].answerEntity = answerEntity;
    },

    isEmpty: function() {
        return m_messages.length === 0;
    },

    wasEmpty: function() {
        return m_messages.length == 1;
    }
};

module.exports = conversationHistory;
