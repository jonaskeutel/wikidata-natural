exports.parse = function(question) {
	var searchText;
	if (question.indexOf('of') > -1 ) {
		searchText = question.substring(question.indexOf('of') + 3, question.length);
	} else if (question.indexOf('born') > -1 ) {
		var start = question.indexOf('is') > -1 ? question.indexOf('is') + 3 : question.indexOf('was') + 4
		searchText = question.substring(start, question.indexOf('born') - 1 );
	}
	searchText = searchText.charAt(0).toUpperCase() + searchText.slice(1);
	var interpretation = 'When was ' + searchText + ' born?';
	return { 
		interpretation: interpretation,
		searchText: searchText
	};
}