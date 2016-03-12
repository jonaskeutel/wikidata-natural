var bayes = require('bayes');
var classifier = bayes();
var natural = require('natural');
natural.PorterStemmer.attach();
var trainingData = require('./trainingData.json');
//var mayorIntent = require('./femaleMayorIntentNew');
//var birthdateIntent = require('./birthdateIntentNew');
var leadingIntent = require('./leadingIntentNew').a(trainingData, classifier);
// var populationIntent = require('./populationIntent');
// var dateOfDeathIntent = require('./dateOfDeathIntent');
// var inceptionIntent = require('./inceptionIntent');
// var filmIntent = require('./filmIntent');
var intentArray = [leadingIntent]; //mayorIntent, birthdateIntent, , populationIntent, dateOfDeathIntent, inceptionIntent, filmIntent
var intentNameToPositionMapping = {};

for (var i = 0; i < intentArray.length; i++) {
  intentNameToPositionMapping[intentArray[i].getName()] = i;
}

var QUESTION_NOT_UNDERSTOOD = {
    interpretation: 'I didn\'t understand the question. Please try asking the question in a different way. Maybe, this type of question isn\'t supported yet. In that case, feel free to contact the development team (TODO: Link einfügen)',
    speechOutput: 'I am sorry, but I don\'t know...'
}

exports.mapAndAnswerQuestion = function(question, callback) {
    question = question.toLowerCase().replace(/[^a-z0-9 ]/g, '');

    intentPosition = intentNameToPositionMapping[this.map(question)];
    intentArray[intentPosition].answer(question, function(err, result) {
        callback(result);
    });
}

exports.map = function(question) {
    return classifier.categorize(question.tokenizeAndStem().join(' '));
}
