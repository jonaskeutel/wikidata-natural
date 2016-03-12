(exports.a = function(data, classifier){
  var intent = require('./Intent').a(data['leading'], classifier);

  var parse = function(question) {
  	var searchText;
  	if (question.indexOf('leading') > -1 ) {
  		searchText = question.substring(question.indexOf('leading') + 8, question.length);
  	} else if (question.indexOf('of') > -1 ) {
  		searchText = question.substring(question.indexOf('of') + 3, question.length);
  	}
  	if (searchText.indexOf('the') == 0)
  			searchText = searchText.substring(3, searchText.length);
  	searchText = searchText.charAt(0).toUpperCase() + searchText.slice(1);
  	var interpretation = 'Who is leading ' + searchText + '?';
  	return {
  		interpretation: interpretation,
  		searchText: searchText
  	};
  };

  var doQuery = function(data, callback) {
    console.log('in doQuery');
      intent.client.get( intent.queryBuilder.whoIsLeading(data.id), function(queryData, response) {
          var jsonResponse = JSON.parse(intent.decoder.write(queryData));
          if (jsonResponse.results.bindings.length == 0) {
              data.speechOutput = "Sorry, I didn't find an answer on Wikidata. Maybe its data is incomplete. " +
                              "You would do me a big favour if you could look it up and add it to Wikidata."
              callback(null, data);
              return;
          }
          data.result = jsonResponse.results.bindings[0].leaderLabel.value;
          data.speechOutput = data.result + " is leading " + data.searchText + ".";
          callback(null, data);
      });
  };

  intent.parse = parse;
  intent.doQuery = doQuery;
  console.log('parse and doQuery added');

  return intent;
})
