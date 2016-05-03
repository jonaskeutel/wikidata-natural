var querystring = require("querystring");

var GENERIC_SINGLE_STATEMENT = "SELECT ?object ?objectLabel WHERE { " +
            "  wd:[ITEM_ID] wdt:[PROPERTY_ID] ?object . " +
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language 'en' . } " +
            "}";

var DATE_OF_BIRTH_QUERY = "SELECT ?date WHERE { " +
            "   wd:[ITEM_ID] wdt:P569 ?date . " +
            "}";
var WHO_IS_LEADING_QUERY = "SELECT DISTINCT ?leader ?leaderLabel WHERE { " +
            "wd:[ITEM_ID] p:P6 ?statement . " +
            "?statement v:P6 ?leader . " +
            "FILTER NOT EXISTS { ?statement q:P582 ?x } " +
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language 'en' . } " +
            "}";
var BIGGEST_CITIES_WITH_FEMALE_MAYOR_QUERY = "SELECT DISTINCT ?city ?cityLabel ?mayor ?mayorLabel WHERE { " +
            "  ?city wdt:P31/wdt:P279* wd:Q515 . " +
            "  ?city wdt:P17 wd:[ITEM_ID] . " +
            "  ?city p:P6 ?statement . " +
            "  ?statement v:P6 ?mayor . " +
            "  ?mayor wdt:P21 wd:Q6581072 . " +
            "  FILTER NOT EXISTS { ?statement q:P582 ?x } " +
            "  ?city wdt:P1082 ?population . " +
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language 'en' . } " +
            " } ORDER BY DESC(?population) LIMIT [NUMBER]";

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

exports.dateOfBirth = function(itemId) {
      var dateOfBirthQuery = DATE_OF_BIRTH_QUERY.replace("[ITEM_ID]", itemId);
	return SPARQL_ENDPOINT + querystring.stringify({query: ALL_PREFIXES + dateOfBirthQuery});
};

exports.femaleMayors = function(itemId, number) {
      var mayorQuery = BIGGEST_CITIES_WITH_FEMALE_MAYOR_QUERY.replace("[ITEM_ID]", itemId).replace("[NUMBER]", number);
      return SPARQL_ENDPOINT + querystring.stringify({query: ALL_PREFIXES + mayorQuery});
};

exports.whoIsLeading = function(itemId) {
      var leadingQuery = WHO_IS_LEADING_QUERY.replace("[ITEM_ID]", itemId);
      return SPARQL_ENDPOINT + querystring.stringify({query: ALL_PREFIXES + leadingQuery});
}
