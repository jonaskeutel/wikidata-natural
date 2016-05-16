"use strict";

var assert = require('assert');
var alexa = require('./../index');

var success;

var succeedFunction = function(response){
    success = response.response.outputSpeech.text.indexOf('help') > -1;
    console.log(response.response.outputSpeech.text);
};

var failFunction = function(err){
    console.log(err);
    success = false;
};

var context = {
    succeed: succeedFunction,
    fail: failFunction
};

var mayorEvent = {
    session : {
        application: {
            applicationId : "amzn1.echo-sdk-ams.app.8384313e-ff45-4ee3-aca5-ef42c1f09739"
        }
    },
    request: {
        type: "IntentRequest",
        intent: {
            name: "BiggestCitiesWithFemaleMayorIntent",
            slots: {
                Country: {
                    value: 'germany'
                },
                Number: {
                    value: 3
                }
            }
        }
    }
};

var helpEvent = {
    session : {
        application: {
            applicationId : "amzn1.echo-sdk-ams.app.8384313e-ff45-4ee3-aca5-ef42c1f09739"
        }
    },
    request: {
        type: "IntentRequest",
        intent: {
            name: "HelpIntent"
        }
    }
};

var questionNotUnderstoodEvent = {
    session : {
        application: {
            applicationId : "amzn1.echo-sdk-ams.app.8384313e-ff45-4ee3-aca5-ef42c1f09739"
        }
    },
    request: {
        type: "IntentRequest",
        intent: {
            name: "random not existing stuff"
        }
    }
};

describe('alexaTest', function() {
    beforeEach(function(done) {
        setTimeout(function() {
            done();
        }, 1000);
    });

    it('should find the help intent', function() {
        alexa.handler(helpEvent, context);
        assert(success === true, 'HelpIntent');
    });

    it('should say that it did not understand the question', function(){
        alexa.handler(questionNotUnderstoodEvent, context);
        assert(success === false, 'QuestionNotUnderstoodIntent');
    });
});
