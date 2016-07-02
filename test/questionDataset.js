"use strict";

var fs = require('fs');
var assert = require('assert');
var app = require('./../app/wikidataQuery');

describe('questionDataset', function() {
    this.timeout(1500000);


    it('correctly answers some of the test questions', function(done) {

		fs.readFile(__dirname + '/wikidata-questions.txt', 'utf8', function (err, data) {
			var questionsAsked = 0;
			var questionsAnswered = 0;
			var correctInterpretations = 0;
			var correctAnswers = 0;
			data.trim().split('\n').forEach(function(line) {
				var line_split = line.split(';');
				var queryType = line_split[1].trim();
				if (queryType == 'getPropertyValue') {
					var question = line_split[0].trim();
					var expectedInterpretation = line_split[3].trim() + ' of ' + line_split[2].trim() + '?';
					var expectedAnswer = line_split[4].trim();
					questionsAsked += 1;

					console.log('EXPECTED interpretation:', expectedInterpretation);
					console.log(' and answer:', expectedAnswer);

		        	app.answer(question, function(answer) {
			            if (answer.interpretation == expectedInterpretation) {
			            	correctInterpretations += 1;
			            } else {
			            	console.log('expected interpretation', expectedInterpretation, 'got', answer.interpretation);
			            }
			            if (answer.result && answer.result.label == expectedAnswer) {
			            	correctAnswers += 1;
			            } else {
			            	if (answer.result) {
			            		var logString = 'expected ' + expectedAnswer + ' received  ' + answer.result.label;
				            	console.log(logString);
				            }
			            }
			            questionsAnswered += 1;
			            if (questionsAsked == questionsAnswered) {
			            	console.log('-------');
			            	console.log('Of', questionsAsked, 'questions,', correctInterpretations, 'understood,',
			            	            correctAnswers, 'correctly answered');
			            	console.log('-------');
			            	assert(correctAnswers > 0);
			            	done();
			            }
			        });
			    }
			});
		});

    });

});
