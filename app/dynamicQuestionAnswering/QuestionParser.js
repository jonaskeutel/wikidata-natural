'use strict';

var spacyClient = require('./spacyClient');
var entityResolver = require('./entityResolver');
var propertyResolver = require('./propertyResolver');

var self;

class QuestionParser {
	constructor(questionId, question, onQuestionParsed) {
		self = this;
		self.questionId = questionId;
		self.question = question;
		self.onQuestionParsed = onQuestionParsed;
		self.errors = null;
		self.wikidataProperty = null;
		self.wikidataEntity = null;
	}

	run() {
        self.normalizeApostrophes();
        spacyClient.getTaggedWords(self.question, function(taggedWords) {
            self.taggedWords = taggedWords;
            entityResolver.findWikidataEntity(self.taggedWords, self.questionId, self.onNamedEntityDetected, self.onWikidataEntityFound);
        });
	}

    normalizeApostrophes() {
        self.question = self.question.replace(/’|´|`/g, '\'');
        self.question = self.question.replace(/\bwhat\'s\b/g, 'what is');
        self.question = self.question.replace(/\bWhat\'s\b/g, 'What is');
        self.question = self.question.replace(/\bwho\'s\b/g, 'who is');
        self.question = self.question.replace(/\bWho\'s\b/g, 'Who is');
        self.question = self.question.replace(/\bwhat\'re\b/g, 'what are');
        self.question = self.question.replace(/\bWhat\'re\b/g, 'What are');
        self.question = self.question.replace(/\bWho\'re\b/g, 'Who are');
        self.question = self.question.replace(/\bwho\'re\b/g, 'who are');
        self.question = self.question.replace(/\bwhats\b/g, 'what is');
        self.question = self.question.replace(/\bWhats\b/g, 'What is');
        self.question = self.question.replace(/\bwhos\b/g, 'who is');
        self.question = self.question.replace(/\bWhos\b/g, 'Who is');
    }

	onNamedEntityDetected(taggedWords, namedEntityPosition) {
        propertyResolver.findWikidataProperty(self.taggedWords, self.questionId, namedEntityPosition, self.onWikidataPropertyFound);
	}

	onWikidataEntityFound(err, wikidataEntity) {
		if (err) {
            self.registerError(err);
        }
        self.wikidataEntity = wikidataEntity;
        self.callbackIfReady();
	}

	onWikidataPropertyFound(err, wikidataProperty) {
		if (err) {
            self.registerError(err);
        }
        self.wikidataProperty = wikidataProperty;
        self.callbackIfReady();
	}

	registerError(err) {
		if (self.errors === null) {
			self.errors = '';
		}
		self.errors += err + ' ';
	}

	callbackIfReady() {
        if (self.wikidataProperty !== null && self.wikidataEntity !== null) {
            self.onQuestionParsed(self.errors, self.wikidataProperty, self.wikidataEntity);
        }
	}
}

module.exports = QuestionParser;
