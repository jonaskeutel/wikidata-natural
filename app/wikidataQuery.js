var bayes = require('bayes');
var classifier = bayes();
var natural = require('natural');
natural.PorterStemmer.attach();
var trainingData = require('./trainingData.json');
var mayorIntent = require('./femaleMayorIntent').Intent(trainingData, classifier);
var birthdateIntent = require('./birthdateIntent').Intent(trainingData, classifier);
var leadingIntent = require('./leadingIntent').Intent(trainingData, classifier);
// var populationIntent = require('./populationIntent');
// var dateOfDeathIntent = require('./dateOfDeathIntent');
// var inceptionIntent = require('./inceptionIntent');
// var filmIntent = require('./filmIntent');
var intentArray = [leadingIntent, mayorIntent, birthdateIntent]; // populationIntent, dateOfDeathIntent, inceptionIntent, filmIntent
var intentNameToPositionMapping = {};

for (var i = 0; i < intentArray.length; i++) {
  intentNameToPositionMapping[intentArray[i].getName()] = i;
}

var QUESTION_NOT_UNDERSTOOD = {
    interpretation: 'I didn\'t understand the question. Please try asking the question in a different way. Maybe, this type of question isn\'t supported yet. In that case, feel free to contact the development team (TODO: Link einfügen)',
    speechOutput: 'I am sorry, but I don\'t know...'
}

exports.mapAndAnswerQuestion = function(question, callback) {
    console.log("mapAndAnswerQuestion: " + question);
    question = question.toLowerCase().replace(/[^a-z0-9 äöüß]/g, '');
    intentPosition = intentNameToPositionMapping[this.map(question)];
    intentArray[intentPosition].answer(question, function(err, result) {
        callback(result);
    });
}

exports.map = function(question) {
    return classifier.categorize(question.tokenizeAndStem().join(' '));
}
