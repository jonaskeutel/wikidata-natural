exports.Intent = function(data, classifier){
  var intent = require('./Intent').Intent(data['femaleMayor'], classifier, 'femaleMayor');
	var parse = function(question) {
		var number = findAmount(question);
		var country = findCountry(question);
		return {
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
		else if (intent.s2n.convert(numberString))
			amount = intent.s2n.convert(numberString);
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
	};

	var doQuery = function(data, callback) {
	    intent.client.get( intent.queryBuilder.femaleMayors(data.id, data.amount), function(queryData, response) {
	        var jsonResponse = JSON.parse(intent.decoder.write(queryData));
	        if (jsonResponse.results.bindings.length == 0) {
	            data.speechOutput = "Sorry, I didn't find an answer on Wikidata. Maybe its data is incomplete. " +
	                            "You would do me a big favour if you could look it up and add it to Wikidata."
	            callback(null, data);
	            return;
	        }

	        var resultArray = jsonResponse.results.bindings;
	        data.result = resultArray;
	        console.log("Result: ", resultArray);
	        if (data.amount == 1) {
	        	speechOutput = "The biggest city in " + data.searchText + " that is run by a female is " + resultArray[0].cityLabel.value;
	        } else {
	        	speechOutput = "The " + data.amount + " biggest cities in " + data.label + " that are run by a female are ";
		        for (var i = 0; i < resultArray.length - 1; i++) {
		            speechOutput += resultArray[i].cityLabel.value + ", ";
		        };
		        speechOutput += "and " + resultArray[resultArray.length - 1].cityLabel.value + ".";
	        }

	        data.speechOutput = speechOutput;
	        callback(null, data);
	    });
	};

  var getInterpretation = function(data, callback) {
    console.log("Female mayor intent; getInterpretation()");
    var interpretation;
    if (data.amount == 1)
			interpretation = 'What is the biggest city in ' + data.searchText + ' that has a female mayor?';
		else
			interpretation = 'What are the ' + data.amount + ' biggest cities in ' + data.searchText + ' that have a female mayor?';

    data.interpretation = interpretation;
    callback(null, data);
  }

  intent.parse = parse;
  intent.doQuery = doQuery;
  intent.getInterpretation = getInterpretation;

  return intent;
}
