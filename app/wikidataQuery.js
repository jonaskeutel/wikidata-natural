var bayes = require('bayes');
var classifier = bayes();
var mayorIntent = require('./femaleMayorIntent');
var birthdateIntent = require('./birthdateIntent');
var leadingIntent = require('./leadingIntent');
var intentArray = [mayorIntent, birthdateIntent, leadingIntent];

var QUESTION_NOT_UNDERSTOOD = {
    interpretation: 'I didn\'t understand the question. Please try asking the question in a different way. Maybe, this type of question isn\'t supported yet. In that case, feel free to contact the development team (TODO: Link einfügen)',
    speechOutput: 'I am sorry, but I don\'t know...'
}

exports.parseAndAnswerQuestion = function(question, callback) {
    question = question.toLowerCase().replace(/[^a-z0-9 ]/g, '');
        
    for (var i = 0; i < intentArray.length; i++) {
        var trainingData = intentArray[i].getTrainingData();
        for (var j = 0; j < trainingData.length; j++) {
            classifier.learn(trainingData[i], i);
        };
    };

    intentArray[classifier.categorize(question)].answer(question, function(err, result) {
        callback(result);
    });
    // var intent;
    // if (question.indexOf('city') > -1 || question.indexOf('cities') > -1) {
    //     intent = mayorIntent;
    // } else if (question.indexOf('born') > -1 || question.indexOf('birthday') > -1 || question.indexOf('birthdate') > -1 ) {
    //     intent = birthdateIntent;
    // } else if (question.indexOf('leading') > -1 || question.indexOf('president of') > -1 || question.indexOf('leader of') > -1 ) {
    //     intent = leadingIntent;
    // } else {
    //     callback(QUESTION_NOT_UNDERSTOOD);
    // }


    // intent.answer(question, function(err, result) {
    //     callback(result);
    // });
}