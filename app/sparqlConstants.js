var querystring = require("querystring");

var GENERIC_SINGLE_STATEMENT = "SELECT ?object ?objectLabel WHERE { " +
            "  wd:[ITEM_ID] wdt:[PROPERTY_ID] ?object . " +
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language 'en' . } " +
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
