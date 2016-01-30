var bayes = require('bayes');
var classifier = bayes();
var mayorIntent = require('./femaleMayorIntent');
var birthdateIntent = require('./birthdateIntent');
var leadingIntent = require('./leadingIntent');
var populationIntent = require('./populationIntent');
var dateOfDeathIntent = require('./dateOfDeathIntent');
var inceptionIntent = require('./inceptionIntent');
var filmIntent = require('./filmIntent');
var intentArray = [mayorIntent, birthdateIntent, leadingIntent, populationIntent, dateOfDeathIntent, inceptionIntent, filmIntent];
var natural = require('natural');
natural.PorterStemmer.attach();

var QUESTION_NOT_UNDERSTOOD = {
    interpretation: 'I didn\'t understand the question. Please try asking the question in a different way. Maybe, this type of question isn\'t supported yet. In that case, feel free to contact the development team (TODO: Link einfügen)',
    speechOutput: 'I am sorry, but I don\'t know...'
}

exports.mapAndAnswerQuestion = function(question, callback) {
    question = question.toLowerCase().replace(/[^a-z0-9 ]/g, '');

    trainClassifier();
    intentPosition = map(question);
    intentArray[intentPosition].answer(question, function(err, result) {
        callback(result);
    });
}

exports.trainClassifier = function() {
    for (var i = 0; i < intentArray.length; i++) {
        var trainingData = intentArray[i].getTrainingData();
        for (var j = 0; j < trainingData.length; j++) {
            // classifier.learn(trainingData[j].tokenizeAndStem().join(' '), intentArray[i].name());
            classifier.learn(trainingData[j].tokenizeAndStem().join(' '), i);
        };
    };
}

exports.map = function(question) {
    return classifier.categorize(question.tokenizeAndStem().join(' '));
}