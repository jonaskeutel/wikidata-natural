"use strict";

exports.formatAnswer = function(property, namedEntity, result) {
	var answer = "The " + property.label + " of " + namedEntity.label + " is " + formatResult(result) + ".";
	return answer;
};

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatResult(result) {
	if (result.object.datatype == 'http://www.w3.org/2001/XMLSchema#dateTime') {
		return formatDate(result.objectLabel.value);
	}
	return result.objectLabel.value;
}

function formatDate(dateLiteral) {
	var d = new Date(dateLiteral);
    var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return weekdays[d.getDay()] + ", " + d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
}
