var mayorIntent = require('./app/femaleMayorIntent');
var birthdateIntent = require('./app/birthdateIntent');
var leadingIntent = require('./app/leadingIntent');
var populationIntent = require('./app/populationIntent');
var dateOfDeathIntent = require('./app/dateOfDeathIntent');
var inceptionIntent = require('./app/inceptionIntent');
var filmIntent = require('./app/filmIntent');

exports.handler = function (event, context) {
    try {
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.8384313e-ff45-4ee3-aca5-ef42c1f09739") {
             context.fail("Invalid Application ID");
        }
        console.log("Request received");
        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }
        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            console.log("IntentRequest received");
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);
    getWelcomeResponse(callback);
}

function onIntent(intentRequest, session, callback) {
    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;
    console.log("On Intent " + intentName);

    switch (intentName) {
        case "WhoIsLeadingIntent":
            whoIsLeading(intent, session, callback);
            break;
        case "BirthdateIntent":
            getBirthdate(intent, session, callback);
            break;
        case "BiggestCitiesWithFemaleMayorIntent":
            biggestCitiesWithFemaleMayor(intent, session, callback);  
            break;
        case "HelpIntent":
            getWelcomeResponse(callback);
            break;
        case "PopulationIntent":
        case "DateOfDeathIntent":
        case "InceptionIntent":
        case "FilmIntent":
            intentNotYetImplemented(callback);
            break;
        default:
            questionNotUnderstood(callback);
    }
}

function getWelcomeResponse(callback) {
    var sessionAttributes = {};
    var cardTitle = "Welcome to Wikidata";
    var speechOutput = "Welcome to Wikidata. How can I help you? You can ask me for example when a certain person was born.";
    var repromptText = "You can ask me for example when a certain person was born."; //TODO: Better help?
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function questionNotUnderstood(callback) {
    var sessionAttributes = {};
    var cardTitle = "Welcome to Wikidata";
    var speechOutput = "I am sorry, but I didn't understand the question. Could you repeat it again, please?";
    var repromptText = "If it's possible, try to ask the question in a different way.";
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function intentNotYetImplemented(callback) {
    var sessionAttributes = {};
    var cardTitle = "Sorry, we are still learning";
    var speechOutput = "This type of question needs to be answered, but it\'s still under development. Please try again later.";
    var repromptText = "If you think, this question is very important, you can write an e-mail to the development team and we will take care of it.";
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getBirthdate(intent, session, callback) {
    var sessionAttributes = session.attributes;
    var cardTitle = "Leader:";
    var name = intent.slots.Name ? intent.slots.Name.value : false;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
     
    if (!name) {
        callback({},
                buildSpeechletResponse("", "I didn't get the name. Could you please try again?", "Please try it again", false));
        return;
    }   
    var interpretation = 'When was ' + name + ' born?';
    var parameter = {
        interpretation: interpretation,
        searchText: name
    }

    birthdateIntent.answerFromParameter(parameter, function(err, result) {
        callback(sessionAttributes,
            buildSpeechletResponse(cardTitle, result.speechOutput, repromptText, shouldEndSession));
    })

}

function whoIsLeading(intent, session, callback) {
    var cardTitle = "Leader:";
    var name = intent.slots.Name ? intent.slots.Name.value : false;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;

    if (!name) {
        callback({},
                buildSpeechletResponse("", "I didn't get the country. Could you please try again?", "Please try it again", false));
        return;
    }  

    var interpretation = "Who is leading " + name + "?";

    var parameter = {
        interpretation: interpretation,
        searchText: name
    }

    leadingIntent.answerFromParameter(parameter, function(err, result) {
        callback(sessionAttributes,
            buildSpeechletResponse(cardTitle, result.speechOutput, repromptText, shouldEndSession));
    })
}

function biggestCitiesWithFemaleMayor(intent, session, callback) {
    var cardTitle = "Female mayors:";
    var countrySlot = intent.slots.Country;
    var numberSlot = intent.slots.Number;
    var number =  numberSlot.value ? numberSlot.value : 1;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;

    // TODO: Make world the fallback
    if (!countrySlot) {
        callback({},
                buildSpeechletResponse("", "I didn't get the country. Could you please try again?", "Please try it again", false));
        return;
    }
    var country = countrySlot.value;
    
    var interpretation;
    if (number == 1)
        interpretation = 'What is the biggest city in ' + country + ' that has a female mayor?';
    else
        interpretation = 'What are the ' + number + ' biggest cities in ' + country + ' that have a female mayor?';

    var parameter = {
        interpretation: interpretation,
        amount: number,
        searchText: country
    };

    console.log("About to ask the mayorIntent");
    mayorIntent.answerFromParameter(parameter, function(err, result) {
        console.log("result");
        callback(sessionAttributes,
            buildSpeechletResponse(cardTitle, result.speechOutput, repromptText, shouldEndSession));
    })
}

// --------------- Custom helpers -----------------------
function cleanVariable(val, callback) {
    console.log(val);
    val = val.replace(/ /g,'').replace(/\./g,'').replace('the','');
    console.log("Inside clean variable: ", val);
    callback(val);
}

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}