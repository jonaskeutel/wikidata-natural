exports.parse = function(question) {
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
}