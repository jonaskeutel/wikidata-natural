"use strict";

var assert = require('assert');
var app = require('./../app/wikidataQuery');

describe('discourseAnalysis', function() {
    this.timeout(15000);

    it('remembers answer from last question', function(done) {
        app.answer('Who is the president of China?', function(answ) {
            app.answer('Where was he born?', function(answer) {
                assert.equal(answer.result.label, 'Beijing');
                done();
            });
        });
    });

    it('remembers namedEntity from last question', function(done) {
        app.answer('Who is the president of China?', function(answ) {
            app.answer('What is its capital?', function(answer) {
                assert.equal(answer.result.label, 'Beijing');
                done();
            });
        });
    });

    it('distinguish gender for last question', function(done) {
        app.answer('Who is the president of Germany?', function(answ) {
            app.answer('Where was he born?', function(answer) {
                assert.equal(answer.result.label, 'Rostock');
                app.answer('What is its capital?', function(answer) {
                    assert.equal(answer.result.label, 'Berlin');
                    app.answer('What is his capital?', function(answer) {
                        assert.equal(answer.answer, "Sorry, I didn't find an answer on Wikidata. Maybe its data is incomplete. " +
                                        "You would do me a big favor if you could look it up and add it to Wikidata.");
                        done();
                    });
                });
            });
        });
    });

    it('remembers property from last question', function(done) {
        app.answer('Who is the president of China?', function(answ) {
            app.answer('And from Germany?', function(answer) {
                assert.equal(answer.result.label, 'Joachim Gauck');
                done();
            });
        });
    });

});
