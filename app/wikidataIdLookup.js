var WikidataSearch = require('wikidata-search').WikidataSearch;
var wikidataSearch = new WikidataSearch();

exports.getWikidataId = function(data, callback) {
    wikidataSearch.set('search', data.searchText);
    wikidataSearch.search(function(result, error) {
        if (result.results.length == 0) {
            callback('Sorry, I didn\'t find an item on Wikidata matching ' + data.searchText + '.');
        } else {
            data.id = result.results[0].id;
            callback(null, data);
        }
    });
}