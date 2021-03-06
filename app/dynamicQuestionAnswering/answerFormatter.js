"use strict";

exports.formatAnswer = function(property, namedEntity, result) {
	var answer;
    if (result.length === 1) {
        answer = "The " + property.label + " of " + namedEntity.label + formatIs(result[0]) + formatResult(result[0]) + ".";
    } else {
        answer = "The " + property.label + "s of " + namedEntity.label + formatIs(result);
        for (var i = 0; i < result.length - 1; i++) {
            answer += formatResult(result[i]) + ", ";
        }
        answer = answer.slice(0, answer.length - 2);
        answer += " and " + formatResult(result[result.length - 1]) + ".";
    }
	return answer;
};

function formatIs(result) {
	if (datatypeOf(result) == 'dateTime') {
		var d = new Date(result.objectLabel.value);
		var now = new Date();
		if (d < now) {
			return " was on ";
		} else {
			return " will be on ";
		}
	}
    if (result.length > 1) {
        return " are ";
    }
    return " is ";
}

function formatResult(result) {
	var formattedAnswer;
	var formatFunction = selectFunctionForDatatype(datatypeOf(result));
	if (formatFunction) {
		formattedAnswer = formatFunction(result.objectLabel.value);
	}
	else {
		formattedAnswer = result.objectLabel.value;
	}
	if (result.year) {
		return formattedAnswer + ' (in ' + result.year.value + ')';
	}
	return formattedAnswer;
}

function datatypeOf(result) {
	if (!result.object || !result.object.datatype || result.object.datatype.indexOf('#') == -1) {
		return null;
	}
	return result.object.datatype.substring(result.object.datatype.indexOf('#') + 1);
}

function selectFunctionForDatatype(datatype) {
	var formatFunctions = {
		"decimal": formatDecimal,
		"dateTime": formatDate
	};
	return formatFunctions[datatype];
}

function formatDate(dateLiteral) {
	var d = new Date(dateLiteral);
    var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    if (isNaN(d.getTime())) {
    	return dateLiteral;
    }

    return weekdays[d.getDay()] + ", " + d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear() + timeSpanSince(d);
}

function timeSpanSince(aDate) {
	var oneDay = 24*60*60*1000;
	var oneWeek = 7 * oneDay;
	var oneMonth = 30.44 * oneDay;
	var oneYear = 365.25 * oneDay;

	var timeSpanString = " (";

	var diff = Math.abs(new Date().getTime() - aDate.getTime());
	var diffNormalized = diff;
	var unit = "";
	if (diff > oneYear * 1.3) {
		diffNormalized = Math.floor(diff / oneYear);
		unit = "year";
	} else if (diff > oneMonth * 1.3) {
		diffNormalized = Math.floor(diff / oneMonth);
		unit = "month";
	} else if (diff > oneWeek * 1.3) {
		diffNormalized = Math.floor(diff / oneWeek);
		unit = "week";
	} else if (diff > oneDay * 1.3) {
		diffNormalized = Math.floor(diff / oneDay);
		unit = "day";
	} else {
		return "";
	}
	timeSpanString += diffNormalized + " " + unit;
	if (diffNormalized > 1) {
		timeSpanString += "s";
	}
	if (new Date() > aDate) {
		timeSpanString += " ago)";
	} else {
		timeSpanString += " from now)";
	}

	return timeSpanString;
}

function formatDecimal(decimalLiteral) {
	var num = Number(decimalLiteral);
	var suffix = "";
	if (num % 1000000000 === 0) {
		num /= 1000000000;
		suffix = " billion";
	} else if (num % 1000000 === 0) {
		num /= 1000000;
		suffix = " million";
	}
	var str = num.toString();
	var leftOfDecimalPoint = str.split('.')[0];
	var rightOfDecimalPoint = str.split('.')[1];
	var formatted = "";
	for (var i = leftOfDecimalPoint.length - 1; i >= 0; i--) {
		formatted = leftOfDecimalPoint[i] + formatted;
		if ((leftOfDecimalPoint.length - i) % 3 === 0 && isNumeric(leftOfDecimalPoint[i - 1])) {
			formatted = " " + formatted;
		}
	}
	if (rightOfDecimalPoint) {
		formatted += '.';
		formatted += rightOfDecimalPoint;
	}
	formatted += suffix;

	return formatted;
}

function isNumeric(char) {
	return !isNaN(parseInt(char));
}
