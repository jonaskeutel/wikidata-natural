"use strict";

var querystring = require("querystring");

var GENERIC_SINGLE_STATEMENT = "SELECT ?object ?objectLabel ?gender ?genderLabel WHERE { " +
            "  wd:[ITEM_ID] p:[PROPERTY_ID] ?statement . " +
            "  ?statement ps:[PROPERTY_ID] ?object . " +
            "  FILTER NOT EXISTS { ?statement pq:P582 ?x } " +
            "  OPTIONAL {?object  wdt:P21 ?gender . } " +
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language 'en' . } " +
            "}";

var SPARQL_ENDPOINT = "https://query.wikidata.org/bigdata/namespace/wdq/sparql?format=json&";

var ALL_PREFIXES = "PREFIX wikibase: <http://wikiba.se/ontology#>" +
            "PREFIX wd: <http://www.wikidata.org/entity/>  " +
            "PREFIX wdt: <http://www.wikidata.org/prop/direct/> " +
            "PREFIX p: <http://www.wikidata.org/prop/> " +
            "PREFIX q: <http://www.wikidata.org/prop/qualifier/> " +
            "PREFIX v: <http://www.wikidata.org/prop/statement/> " +
            "PREFIX pq: <http://www.wikidata.org/prop/qualifier/> " +
            "PREFIX ps: <http://www.wikidata.org/prop/statement/> ";

exports.genercicSingleStatement = function(itemId, propertyId) {
    var singleStatementQuery = GENERIC_SINGLE_STATEMENT.split("[ITEM_ID]").join(itemId).split("[PROPERTY_ID]").join(propertyId);
    return SPARQL_ENDPOINT + querystring.stringify({query: ALL_PREFIXES + singleStatementQuery});
};
