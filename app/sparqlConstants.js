"use strict";

var querystring = require("querystring");

var GENERIC_SINGLE_STATEMENT = "SELECT ?object ?objectLabel ?gender ?genderLabel WHERE { " +
            "  wd:[ITEM_ID] wdt:[PROPERTY_ID] ?object . " +
            "  OPTIONAL {?object  wdt:P21 ?gender . } " +
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language 'en' . } " +
            "}";

var DESCRIPTION = "  SELECT * " +
   "WHERE { " +
     "SERVICE wikibase:label { " +
       "bd:serviceParam wikibase:language \"en\" . " +
       "wd:[ITEM_ID] rdfs:label ?objectLabel . " +
       "wd:[ITEM_ID] rdfs:altLabel ?objectAlt . " +
       "wd:[ITEM_ID] schema:description ?objectDesc . " +
    "} " +
  "}";

var SPARQL_ENDPOINT = "https://query.wikidata.org/bigdata/namespace/wdq/sparql?format=json&";

var ALL_PREFIXES = "PREFIX wikibase: <http://wikiba.se/ontology#>" +
            "PREFIX wd: <http://www.wikidata.org/entity/>  " +
            "PREFIX wdt: <http://www.wikidata.org/prop/direct/> " +
            "PREFIX p: <http://www.wikidata.org/prop/> " +
            "PREFIX q: <http://www.wikidata.org/prop/qualifier/> " +
            "PREFIX v: <http://www.wikidata.org/prop/statement/> ";

exports.genercicSingleStatement = function(itemId, propertyId) {
    var singleStatementQuery = GENERIC_SINGLE_STATEMENT.replace("[ITEM_ID]", itemId).replace("[PROPERTY_ID]", propertyId);
    return SPARQL_ENDPOINT + querystring.stringify({query: ALL_PREFIXES + singleStatementQuery});
};

exports.description = function(itemId) {
    var query = DESCRIPTION.split("[ITEM_ID]").join(itemId);
    return SPARQL_ENDPOINT + querystring.stringify({query: ALL_PREFIXES + query});
}
