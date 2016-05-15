var m_messages = []

var conversationHistory = {
    messages: function() {
        return m_messages;
    },

    addQuestion: function(question) {
        m_messages.push({question:question});
        return m_messages.length - 1;
    },

    addInterpretation: function(interpretation, id) {
        m_messages[id].interpretation = interpretation;
    },

    addAnswer: function(answer, id) {
        m_messages[id].answer = answer;
    },

    // AnswerEntity is object with keys 'id' and 'label'
    addAnswerEntity: function(answerEntity, id) {
        m_messages[id].answerEntity = answerEntity;
    },

    // namedEntity is object with keys 'id' and 'label'
    addNamedEntity: function(namedEntity, id) {
        m_messages[id].namedEntity = namedEntity;
    },

    // property is object with keys 'id' and 'label'
    addProperty: function(property, id) {
        m_messages[id].property = property;
    }
}

module.exports = conversationHistory
