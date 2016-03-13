var express = require('express');
var router = express.Router();
var wikidataQuery = require('./../app/wikidataQuery.js');
var PLACEHOLDER_QUESTIONS = [
	'Who is leading China?',
	'What are the five biggest cities in Germany that have a female mayor?',
	'When was Jimmy Wales born?'
];

router.get('/', function(req, res, next) {
	var positionInArray = parseInt(Math.random() * PLACEHOLDER_QUESTIONS.length);
	res.render('index',
		{
			question: PLACEHOLDER_QUESTIONS[positionInArray],
			answer: undefined
		});

});

router.post('/', function(req, res, next) {
	var question = req.body.question;
	var positionInArray = parseInt(Math.random() * PLACEHOLDER_QUESTIONS.length);
	if (!question) {
		res.render('index',
			{
				question: PLACEHOLDER_QUESTIONS[positionInArray],
				answer: undefined
			});
	} else {
		wikidataQuery.mapAndAnswerQuestion(question, function(result) {
			res.render('index',
				{
					question: question,
					answer: result.speechOutput,
					interpretation: result.interpretation
				});
		});
	}
});

module.exports = router;
