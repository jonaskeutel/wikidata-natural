var bayes = require('bayes');
var classifier = bayes();
var natural = require('natural');
natural.PorterStemmer.attach();
var trainingData = require('./../public/trainingData.json');
var mayorIntent = require('./femaleMayorIntent').Intent(trainingData, classifier);
var birthdateIntent = require('./birthdateIntent').Intent(trainingData, classifier);
var leadingIntent = require('./leadingIntent').Intent(trainingData, classifier);
var voldemortIntent = require('./voldemortIntent').Intent(trainingData, classifier);
// var populationIntent = require('./populationIntent');
// var dateOfDeathIntent = require('./dateOfDeathIntent');
// var inceptionIntent = require('./inceptionIntent');
// var filmIntent = require('./filmIntent');
var intentArray = [leadingIntent, mayorIntent, birthdateIntent, voldemortIntent]; // populationIntent, dateOfDeathIntent, inceptionIntent, filmIntent
var intentNameToPositionMapping = {};

for (var i = 0; i < intentArray.length; i++) {
  intentNameToPositionMapping[intentArray[i].getName()] = i;
}

var QUESTION_NOT_UNDERSTOOD = {
    interpretation: 'I didn\'t understand the question. Please try asking the question in a different way. Maybe, this type of question isn\'t supported yet. In that case, feel free to contact the development team (TODO: Link einfügen)',
    speechOutput: 'I am sorry, but I don\'t know...'
}

var conversationHistory = require('./conversationHistory.js');

exports.mapAndAnswerQuestion = function(question, callback) {
    console.log("mapAndAnswerQuestion: " + question);
    questionId = conversationHistory.addQuestion(question);
    question = question.toLowerCase().replace(/[^a-z0-9 äöüß]/g, '');
    intentPosition = intentNameToPositionMapping[this.map(question)];
    intentArray[intentPosition].answer(question, function(err, result) {
        conversationHistory.addInterpretation(result.interpretation, questionId);
        conversationHistory.addAnswer(result.speechOutput, questionId);
        callback(result);
    });
}

exports.map = function(question) {
    return classifier.categorize(question.tokenizeAndStem().join(' '));
}
