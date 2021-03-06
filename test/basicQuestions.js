"use strict";

var assert = require('assert');
var app = require('./../app/wikidataQuery');

describe('basicQuestions', function() {
    this.timeout(15000);

    it('returns correct answer for where born question', function(done) {

        app.answer('Where was Angela Merkel born?', function(answer) {
            assert.equal(answer.interpretation, 'place of birth of Angela Merkel?');
            assert.equal(answer.result.label, 'Barmbek-Nord');
            done();
        });
    });

    it('returns correct answer for merkel question', function(done) {

        app.answer('Where was Merkel born?', function(answer) {
            assert.equal(answer.interpretation, 'place of birth of Angela Merkel?');
            assert.equal(answer.result.label, 'Barmbek-Nord');
            done();
        });
    });

    it('returns correct answer for when born question', function(done) {

        app.answer('When was Angela Merkel born?', function(answer) {
            assert.equal(answer.interpretation, 'date of birth of Angela Merkel?');
            assert.equal(answer.result.label, '1954-07-17T00:00:00Z');
            done();
        });
    });

    it('returns correct answer for when died question', function(done) {

        app.answer('When died Albert Einstein?', function(answer) {
            assert.equal(answer.interpretation, 'date of death of Albert Einstein?');
            assert.equal(answer.result.label, '1955-04-18T00:00:00Z');
            done();
        });
    });

    it('returns correct answer for when did die question', function(done) {

        app.answer('When did Albert Einstein die?', function(answer) {
            assert.equal(answer.interpretation, 'date of death of Albert Einstein?');
            assert.equal(answer.result.label, '1955-04-18T00:00:00Z');
            done();
        });
    });

    it('returns correct answer for where died question', function(done) {

        app.answer('Where died Albert Einstein?', function(answer) {
            assert.equal(answer.interpretation, 'place of death of Albert Einstein?');
            assert.equal(answer.result.label, 'Princeton');
            done();
        });
    });


    it('returns correct answer for who founded question', function(done) {

        app.answer('Who founded Siemens?', function(answer) {
            assert.equal(answer.interpretation, 'founder of Siemens?');
            assert.equal(answer.result.label, 'Ernst Werner von Siemens');
            done();
        });
    });

    it('returns correct answer for what is the population question', function(done) {
        this.skip();
        app.answer('What is the population of Germany? ', function(answer) {
            assert.equal(answer.interpretation, 'population of Germany?');
            assert(parseInt(answer.result.label) > 75000000);
            done();
        });
    });

    it('returns correct answer for what is the population question in 1970', function(done) {
        app.answer('What is the population of Germany in 1970? ', function(answer) {
            assert.equal(answer.interpretation, 'population of Germany?');
            console.log(answer.result);
            assert(answer.answer == 'The population of Germany is 78 069 000 (1970).');
            done();
        });
    });

    it('returns correct answer for what is xyz\' population question', function(done) {

        app.answer('What is Germany\'s population? ', function(answer) {
            assert.equal(answer.interpretation, 'population of Germany?');
            assert(answer.result.label > '75000000');
            done();
        });
    });


    it('returns correct answer for who is president question', function(done) {

        app.answer('Who is the president of Germany? ', function(answer) {
            assert.equal(answer.interpretation, 'head of state of Germany?');
            assert.equal(answer.result.label, 'Joachim Gauck');
            done();
        });
    });

    it('returns correct answer for who is head of government question', function(done) {

        app.answer('Who is the head of government of Germany? ', function(answer) {
            assert.equal(answer.interpretation, 'head of government of Germany?');
            assert.equal(answer.result.label, 'Angela Merkel');
            done();
        });
    });

    it('returns correct answer for head of state question', function(done) {

        app.answer('Who is the head of state of Germany? ', function(answer) {
            console.log(answer);
            assert.equal(answer.interpretation, 'head of state of Germany?');
            assert.equal(answer.result.label, 'Joachim Gauck');
            done();
        });
    });

    it('returns correct answer for who is xyz\'s head of government question', function(done) {

        app.answer('Who is Germany\'s head of government? ', function(answer) {
            assert.equal(answer.interpretation, 'head of government of Germany?');
            assert.equal(answer.result.label, 'Angela Merkel');
            done();
        });
    });

    it('returns correct answer for what is the cast question', function(done) {
        app.answer('What is the cast of Inception? ', function(answer) {
            console.log(answer);
            assert.equal(answer.interpretation, 'cast member of Inception?');
            assert.equal(answer.answer, 'The cast members of Inception are Cillian Murphy, Dileep Rao, Ellen Page, Joseph Gordon-Levitt, Ken Watanabe, Leonardo DiCaprio, Lukas Haas, Marion Cotillard, Michael Caine, Pete Postlethwaite, Tom Berenger and Tom Hardy.');
            done();
        });
    });

    it('returns correct answer for what is the cast question', function(done) {

        app.answer('What is the cast of Vaa Arugil Vaa?', function(answer) {
            console.log(answer);
            assert.equal(answer.interpretation, 'cast member of Vaa Arugil Vaa?');
            assert.equal(answer.answer, 'The cast members of Vaa Arugil Vaa are Raja and Ramya Krishnan.');
            done();
        });
    });

    it('returns correct answer for who is leading question', function(done) {
        this.skip();

        app.answer('Who is leading Germany? ', function(answer) {
            console.log(answer);
            assert.equal(answer.interpretation, 'head of state of Germany?');
            assert.equal(answer.result.label, 'The head of state of Germany is Joachim Gauck.');
            done();
        });
    });

    it('returns correct answer for in which movies question', function(done) {
        this.skip();

        app.answer('In which films did Johnny Depp play?', function(answer) {
            console.log(answer);
            done();
        });
    });

    it('returns correct answer for five biggest cities with a female mayor question', function(done) {
        this.skip();

        app.answer('What are the five biggest cities with a female mayor in Germany?', function(answer) {
            console.log(answer);
            done();
        });
    });



});
