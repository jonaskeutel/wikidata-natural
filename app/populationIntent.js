exports.getTrainingData = function() {
	return [
		'how many people live in chile',
		'how many inhabitants does berlin have',
		'what is the population of china',
		'what population does potsdam have',
		'how many men and women live in brandenburg'
	]
}

exports.answer = function(question, callback) {
	var parameter = parse(question);
	this.answerFromParameter(parameter, callback);
}

exports.answerFromParameter = function(parameter, callback) {
    callback(null, {
    	interpretation: 'What is the population of ...?',
    	result: {},
    	speechOutput: 'This type of question needs to be answered, but it\'s still under development.'
    });
}

function parse(question) {
	return {};
}