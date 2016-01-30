exports.getTrainingData = function() {
	return [
		'in which movies did Daniel Radcliff play',
		'in which films did Emma Watson play',
		'what is the filmographie of Rupert Grint',
		'what is the cast of the movie Titanic',
		'who played in the film Lord of the rings',
		'who plays in the harry potter movies'
	]
}

exports.answer = function(question, callback) {
	var parameter = parse(question);
	this.answerFromParameter(parameter, callback);
}

exports.answerFromParameter = function(parameter, callback) {
    return {
    	interpretation: 'What is the filmographie of ...? OR: What is the cast of ...?',
    	result: {},
    	speechOutput: 'This type of question needs to be answered, but it\'s still under development.'
    }
}

function parse(question) {
	return {};
}