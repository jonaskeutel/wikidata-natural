var router = require('express').Router();
var wikidataQuery = require('./app/wikidataQuery.js');
var conversationHistory = require('./app/conversationHistory.js');

router.get('/', function(req, res, next) {renderIndex(res)});

router.post('/', function(req, res, next) {
	var question = req.body.question;
	if (question) {
		wikidataQuery.answer(question, function(){renderIndex(res)});
	} else {
		renderIndex(res)
	}
});

router.post('/ajax/', function(req, res, next) {
	var question = req.body.question;
	if (!question) {
		return
	}
	try {
		wikidataQuery.answer(question, function(result) {
			res.send(JSON.stringify({
				interpretation: result.interpretation,
				answer: result.answer
			}));
		});
	} catch (e) {
		res.send(JSON.stringify({answer: e.stack.replace('\n','     \n')}));
	}
});

function renderIndex(res) {
	res.render('index',
				{
					conversation: conversationHistory.messages(),
					placeholder: getPlaceholderQuestion()
				});
}

function getPlaceholderQuestion() {
	var questions = [
		'Who is leading China?',
		'What are the five biggest cities in Germany that have a female mayor?',
		'When was Jimmy Wales born?'
	]
	var index = Math.floor(Math.random() * questions.length);
	return questions[index];
}

module.exports = router;
