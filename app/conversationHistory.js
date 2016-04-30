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
	}
}

module.exports = conversationHistory
