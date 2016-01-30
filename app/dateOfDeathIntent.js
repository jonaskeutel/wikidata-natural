exports.getTrainingData = function() {
	return [
		'when died Michael Jackson',
		'what is the date of death of Lenin',
		'when did Jesus die',
		'when did Snape passed away'
	]
}

exports.answer = function(question, callback) {
	var parameter = parse(question);
	this.answerFromParameter(parameter, callback);
}

exports.answerFromParameter = function(parameter, callback) {
    return {
    	interpretation: 'What is the date of death of ...?',
    	result: {},
    	speechOutput: 'This type of question needs to be answered, but it\'s still under development.'
    }
}

function parse(question) {
	return {};
}