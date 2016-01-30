exports.getTrainingData = function() {
	return [
		'when was SAP founded',
		'what is the date of inception of Oracle',
		'how long does Google exists',
		'since when exists Facebook'
	]
}

exports.answer = function(question, callback) {
	var parameter = parse(question);
	this.answerFromParameter(parameter, callback);
}

exports.answerFromParameter = function(parameter, callback) {
    callback(null, {
    	interpretation: 'What is the date of inception of ...?',
    	result: {},
    	speechOutput: 'This type of question needs to be answered, but it\'s still under development.'
    });
}

function parse(question) {
	return {};
}