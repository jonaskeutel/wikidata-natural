"use strict";

var WikidataSearch = require('wikidata-search').WikidataSearch;
var wikidataSearch = new WikidataSearch();

var Client = require('node-rest-client').Client;
var client = new Client();
var dom = require('xmldom').DOMParser;
var xpath = require('xpath');

exports.getWikidataId = function(data, callback) {
    var results = {};

    var checkFunction = function() {
        if (results.hasOwnProperty('webpageId') &&
            results.hasOwnProperty('webpageLabel') &&
            results.hasOwnProperty('apiId') &&
            results.hasOwnProperty('apiLabel')) {
            // both queries are complete
            if (results.apiId === null && results.webpageId === null) {
                callback('Sorry, didn’t find a Wikidata item matching ' + data.searchText + '!', null);
                return;
            }
            if (results.apiId === null) {
                data.id = results.webpageId;
                data.label = results.webpageLabel;
                callback(null, data);
                return;
            }
            if (results.webpageId === null) {
                data.id = results.apiId;
                data.label = results.apiLabel;
                callback(null, data);
                return;
            }
            if (idToNumber(results.apiId) < idToNumber(results.webpageId)) {
                data.id = results.apiId;
                data.label = results.apiLabel;
                callback(null, data);
                return;
            } else {
                data.id = results.webpageId;
                data.label = results.webpageLabel;
                callback(null, data);
                return;
            }
        }
    };

    data.searchText = data.searchText.replace("?","");
    getWikidataIdViaApi(data.searchText, results, checkFunction);
    getWikidataIdViaWebpage(data.searchText, results, checkFunction);
};

function getWikidataIdViaApi(searchText, results, callback) {
    wikidataSearch.set('search', searchText);
    wikidataSearch.search(function(searchResult, error) {
        if (searchResult.results.length === 0) {
            results.apiId = null;
            results.apiLabel = null;
        } else {
            results.apiLabel = searchResult.results[0].label;
            results.apiId = searchResult.results[0].id;
            console.log("ID lookup via API returned", results.apiId, "-", results.apiLabel);
        }
        callback();
    });
}

function getWikidataIdViaWebpage(searchText, results, callback) {
    var url = 'https://www.wikidata.org/w/index.php?search=' + searchText.replace(new RegExp(' ', 'g'), '+');
    client.get(url, function(htmlData, response) {
        var doc = new dom().parseFromString(htmlData.toString());
        var idDom = xpath.select("//span[@class='wb-itemlink-id'][1]/child::text()", doc);
        var labelDom = xpath.select("//span[@class='wb-itemlink-label'][1]/child::text()", doc);
        if (idDom.length === 0) {
            results.webpageId = null;
            results.webpageLabel = null;
            callback();
            return;
        }
        results.webpageId = idDom[0].nodeValue.substring(1, idDom[0].nodeValue.length-1);
        results.webpageLabel = labelDom[0].nodeValue;
        console.log("ID lookup via DOM returned", results.webpageId, "-", results.webpageLabel);
        callback();
    });
}

function idToNumber(idString) {
    return parseInt(idString.substr(1));
}
