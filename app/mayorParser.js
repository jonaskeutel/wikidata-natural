var string_to_number = require('string-to-number');
var s2n = new string_to_number();

exports.parse = function(question) {
	var number = findAmount(question);
	var country = findCountry(question);
	var interpretation;
	if (number == 1)
		interpretation = 'What is the biggest city in ' + country + ' that has a female mayor?';
	else
		interpretation = 'What are the ' + number + ' biggest cities in ' + country + ' that have a female mayor?';
	return {
		interpretation: interpretation,
		amount: number,
		searchText: country
	};
}

function findAmount(question) {
	if (question.indexOf("is the") > -1 || question.indexOf('\'s the') > -1 || question.indexOf('the biggest city') > -1 )
		return 1
	var beforeNumberString = question.indexOf('biggest cities') > -1 ? question.indexOf('the') + 4 : question.indexOf('biggest') + 8
	var afterNumberString = question.indexOf('biggest cities') > -1 ? question.indexOf('biggest') - 1 : question.indexOf('cities') - 1;
	var numberString = question.substring(beforeNumberString, afterNumberString);
	var amount;
	if (!isNaN(parseInt(numberString)))
		amount = parseInt(numberString);
	else if (s2n.convert(numberString))
		amount = s2n.convert(numberString);
	else
		amount = 3; //default

	return amount;
}

function findCountry(question) {
	var start = question.indexOf('in ') + 3;
	var end = question.indexOf(' ', start);
	end = end == -1 ? question.length : end;
	var country = question.substring(start, end);
	return country.charAt(0).toUpperCase() + country.slice(1);
}