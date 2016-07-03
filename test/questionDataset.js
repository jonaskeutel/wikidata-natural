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
            var questions = [];
            var expected = [];
            var got = [];
			data.trim().split('\n').forEach(function(line) {
				var line_split = line.split(';');
				var queryType = line_split[1].trim();
				if (queryType == 'getPropertyValue') {
					var question = line_split[0].trim();
                    var position = questions.push(question) - 1;
					var expectedInterpretation = line_split[3].trim() + ' of ' + line_split[2].trim() + '?';
					var expectedAnswer = line_split[4].trim();
                    expected[position] = {interpretation: expectedInterpretation, answer: expectedAnswer};
					questionsAsked += 1;

					console.log('EXPECTED interpretation:', expectedInterpretation);
					console.log(' and answer:', expectedAnswer);

		        	app.answer(question, function(answer) {
                        got[position] = {};
                        if (answer.interpretation) {
                            got[position].interpretation = answer.interpretation;
                        }
                        if (answer.result) {
                            got[position].answer = answer.result.label;
                        }
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
                            console.log();
                            console.log();
                            console.log();
                            for (var i = 0; i < questions.length; i++) {
                                console.log('------------  ', i ,'  ------------');
                                console.log('\t', questions[i]);
                                console.log('\texpected\t\t\t\tgot');
                                console.log(expected[i].interpretation, '\t\t', got[i].interpretation);
                                console.log(expected[i].answer, '\t\t', got[i].answer);
                                console.log();
                                console.log();
                            }
			            	assert(correctAnswers > 0);
			            	done();
			            }
			        });
			    }
			});
		});

    });

});
