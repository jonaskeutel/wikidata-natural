exports.Intent = function(data, classifier){
  var intent = require('./Intent').Intent(data['birthdate'], classifier, 'birthdate');

  var parse = function(question) {
		var searchText;
		if (question.indexOf('of') > -1 ) {
			searchText = question.substring(question.indexOf('of') + 3, question.length);
		} else if (question.indexOf('born') > -1 ) {
			var start = question.indexOf('is') > -1 ? question.indexOf('is') + 3 : question.indexOf('was') + 4
			searchText = question.substring(start, question.indexOf('born') - 1 );
		}
	    searchTerms = searchText.split(' ');
	    for (var i = 0; i < searchTerms.length; i++) {
	        searchTerms[i] = searchTerms[i].charAt(0).toUpperCase() + searchTerms[i].slice(1);
	    };
	    searchText = searchTerms.join(' ');
		return {
			searchText: searchText
		};
	};

	var doQuery = function(data, callback) {
	    intent.client.get( intent.queryBuilder.dateOfBirth(data.id), function(queryData, response) {
	        var jsonResponse = JSON.parse(intent.decoder.write(queryData));
	        if (jsonResponse.results.bindings.length == 0) {
	            data.speechOutput = "Sorry, I didn't find an answer on Wikidata. Maybe its data is incomplete. " +
	                            "You would do me a big favor if you could look it up and add it to Wikidata."
	            callback(null, data);
	            return;
	        }

	        var resultDate = jsonResponse.results.bindings[0].date.value;
	        resultDate = resultDate.substring(0, resultDate.search('T'));
	        data.speechOutput = data.label + " was born on " + resultDate + ".";
	        callback(null, data);
	    });
	};

  var getInterpretation = function(data, callback) {
    console.log("Birthdate intent; getInterpretation()");
    data.interpretation = "When was " + data.label + " born?";
    callback(null, data);
  }

  intent.parse = parse;
  intent.doQuery = doQuery;
  intent.getInterpretation = getInterpretation;

  return intent;
}
