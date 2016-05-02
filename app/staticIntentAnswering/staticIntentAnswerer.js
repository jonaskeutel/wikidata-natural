var bayes = require('bayes');
var classifier = bayes();
var natural = require('natural');
natural.PorterStemmer.attach();

var trainingData = require('./../../public/trainingData.json');
var mayorIntent = require('./femaleMayorIntent').Intent(trainingData, classifier);
var birthdateIntent = require('./birthdateIntent').Intent(trainingData, classifier);
var leadingIntent = require('./leadingIntent').Intent(trainingData, classifier);
var voldemortIntent = require('./voldemortIntent').Intent(trainingData, classifier);
var intentArray = [leadingIntent, mayorIntent, birthdateIntent, voldemortIntent];
var intentNameToPositionMapping = {};

var conversationHistory = require('./../conversationHistory.js');

exports.answer = function(question, callback) {
  var questionId = conversationHistory.addQuestion(question);
  question = question.toLowerCase().replace(/[^a-z0-9 äöüß]/g, '');
  intentPosition = intentNameToPositionMapping[map(question)];
  intentArray[intentPosition].answer(question, function(err, result) {
      conversationHistory.addInterpretation(result.interpretation, questionId);
      conversationHistory.addAnswer(result.answer, questionId);
      callback(result);
  });
}

for (var i = 0; i < intentArray.length; i++) {
  intentNameToPositionMapping[intentArray[i].getName()] = i;
}

function map(question) {
    var intentName = classifier.categorize(question.tokenizeAndStem().join(' '));
    console.log("Mapping returned: ", intentName);
    return intentName;
}
