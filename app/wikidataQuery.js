var mayorParser = require('./femaleMayorIntent');
var birthdateParser = require('./birthdateIntent');
var leadingParser = require('./leadingIntent');

var QUESTION_NOT_UNDERSTOOD = {
    interpretation: 'I didn\'t understand the question. Please try asking the question in a different way. Maybe, this type of question isn\'t supported yet. In that case, feel free to contact the development team (TODO: Link einfügen)',
    speechOutput: 'I am sorry, but I don\'t know...'
}

exports.parseAndAnswerQuestion = function(question, callback) {
    question = question.toLowerCase().replace(/[^a-z0-9 ]/g, '');

    var intent;
    if (question.indexOf('city') > -1 || question.indexOf('cities') > -1) {
        intent = mayorParser;
    } else if (question.indexOf('born') > -1 || question.indexOf('birthday') > -1 || question.indexOf('birthdate') > -1 ) {
        intent = birthdateParser;
    } else if (question.indexOf('leading') > -1 || question.indexOf('president of') > -1 || question.indexOf('leader of') > -1 ) {
        intent = leadingParser;
    } else {
        callback(QUESTION_NOT_UNDERSTOOD);
    }

    intent.answer(question, function(err, result) {
        callback(result);
    });
}