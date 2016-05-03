var WikidataSearch = require('wikidata-search').WikidataSearch;
var wikidataSearch = new WikidataSearch();

var Client = require('node-rest-client').Client;
var client = new Client();
var dom = require('xmldom').DOMParser
var xpath = require('xpath')

exports.getWikidataId = function(data, callback) {
    wikidataSearch.set('search', data.searchText);
    wikidataSearch.search(function(result, error) {
        if (result.results.length == 0) {
            callback('Sorry, I didn\'t find an item on Wikidata matching ' + data.searchText + '.');
        } else {
            data.id = result.results[0].id;
            data.label = result.results[0].label;
            console.log("wikidataIdLookup found: " + data.id + " (" + data.label + ")");
            callback(null, data);
        }
    });
}

exports.getWikidataIdRanked = function(data, callback) {
    var url = 'https://www.wikidata.org/w/index.php?search=' + data.searchText.replace(new RegExp(' ', 'g'), '+');
    client.get(url, function(htmlData, response) {
        var doc = new dom().parseFromString(htmlData.toString());
        var idDom = xpath.select("//span[@class='wb-itemlink-id'][1]/child::text()", doc)
        var labelDom = xpath.select("//span[@class='wb-itemlink-label'][1]/child::text()", doc)
        if(idDom.length == 0) {
            callback('Sorry, I didn\'t find an item on Wikidata matching ' + data.searchText + '.');
        }
        data.id = idDom[0].nodeValue.substring(1, idDom[0].nodeValue.length-1);
        data.label = labelDom[0].nodeValue;
        callback(null, data);
    });
}
