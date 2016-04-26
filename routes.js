var router = require('express').Router();

var wikidataQuery = require('./app/wikidataQuery.js');

var PLACEHOLDER_QUESTIONS = [
	'Who is leading China?',
	'What are the five biggest cities in Germany that have a female mayor?',
	'When was Jimmy Wales born?'
];

router.get('/', function(req, res, next) {
	var positionInArray = parseInt(Math.random() * PLACEHOLDER_QUESTIONS.length);
	res.render('index',
		{
			placeholder: PLACEHOLDER_QUESTIONS[positionInArray]
		}
	);
});

router.post('/ajax/', function(req, res, next) {
	var question = req.body.question;
	if (!question) {
		return
	}
	try {
		wikidataQuery.mapAndAnswerQuestion(question, function(result) {
			res.send(JSON.stringify({
				interpretation: result.interpretation,
				answer: result.speechOutput
			}));
		});
	} catch (e) {
		res.send(JSON.stringify({answer: e.stack.replace('\n','     \n')}));
	}
});


router.post('/', function(req, res, next) {
	var question = req.body.question;
	var positionInArray = parseInt(Math.random() * PLACEHOLDER_QUESTIONS.length);
	if (!question) {
		res.render('index',
			{
				placeholder: PLACEHOLDER_QUESTIONS[positionInArray]
			});
	} else {
		wikidataQuery.mapAndAnswerQuestion(question, function(result) {
			res.render('index',
				{
					conversation: [
						{
							question: "Dummy history question?",
							interpretation: "That was interpreted differently",
							answer: "Dummy history answer"
						},
						{
							question: question,
							interpretation: result.interpretation,
							answer: result.speechOutput
						}
					],
					placeholder: question
				});
		});
	}
});

module.exports = router;
