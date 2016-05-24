"use strict";

var Client = require('node-rest-client').Client;
var client = new Client();

exports.getSpacyTaggedWords = function(question, callback) {
	var url = "http://localhost:7000/";
	var data = {question: question};
	var args = {data: data, headers: {"Content-Type": "application/json"}};
	client.post(url, args, onSpacyAnswer);

	function onSpacyAnswer(data, response) {
		console.log("Received tagged words from spaCy server!");
		callback(JSON.parse(data.toString('utf8')));
	}
};
