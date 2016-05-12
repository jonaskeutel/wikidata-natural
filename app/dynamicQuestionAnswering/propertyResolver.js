var request = require('sync-request');
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
var stringSimilarity = require('string-similarity');
var propertiesWithSynonyms = require('./../../public/propertiesWithSynonyms.json');


exports.findPropertyId = function(taggedWords, property, callback) {
  var propertyString = findPropertyAsVerb(taggedWords);
  if (propertyString == "") {
    propertyString = findPropertyAsDescription(taggedWords);
  }

  console.log("We found as the property you are looking for: ", propertyString);

  if (propertyString != "") {
    propertyId = lookupPropertyIdViaApi(propertyString);
    if( propertyId) {
      property.id = propertyId;
      property.label = propertyString;
      callback();
      return;
    }
  }
  property.id = null;
  property.label = null;
  callback();
  return;
}

function findPropertyAsVerb(taggedWords) {
  var propertyString = "";
  for (i in taggedWords) {
      var taggedWord = taggedWords[i];
      var word = taggedWord[0];
      var tag = taggedWord[1];
      if (tag.startsWith('V')) {
        propertyString += word + " ";
      }
  }

  propertyString = propertyString.toLowerCase().replace(/is|are|was|were|been/g, '');
  return propertyString.trim();
}


function findPropertyAsDescription(taggedWords) {
  // everything between DT (determiner: the, some, ...) and IN (preposition: of, by, in, ...)
  var propertyString = "";
  start = false;

  for (i in taggedWords) {
      var taggedWord = taggedWords[i];
      var word = taggedWord[0];
      var tag = taggedWord[1];
      if (start) {
        if (tag == 'IN') {
          break;
        }
        propertyString += word + " ";
      }

      if (tag == 'DT') {
        start = true;
      }
  }
  return propertyString.trim();
}

// returns propertyId that fits best, if there is no good fit: returns false
function lookupPropertyIdInJsonFile(property) {
  var SIMILARITY_THRESHOLD = 0.6;
  // var possibleIds = []; // --> maybe we should return an array of possible ids so that we can decide later which fits best regarding the discourse

  var propertyId = false;
  var maxRating = 0;
  for (var i = 0; i < propertiesWithSynonyms.length; i++) {
    var allPossibleNames = propertiesWithSynonyms[i].aliases;
    allPossibleNames.push(propertiesWithSynonyms[i].label);
    var bestMatch = stringSimilarity.findBestMatch(propertyString, allPossibleNames);
    var bestRating = bestMatch.bestMatch.rating; // --> problem: 'cash' is more similar to 'cast' than 'cast member'...
    if (bestRating > SIMILARITY_THRESHOLD) {
      // possibleIds.push({'id': propertiesWithSynonyms[i].id, 'rating': bestRating > 0.6})
      if (bestRating > maxRating) {
        maxRating = bestRating;
        propertyId = propertiesWithSynonyms[i].id;
      }
    }
    if (bestRating == 1) {
      return propertyId;
    }
  }
  return propertyId;
}

// returns propertyId that fits best, if there is no good fit: returns false
function lookupPropertyIdViaApi(property) {
  var propertyId = false;
  var url = "https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&type=property&format=json&search=" + property;
  var queryData = JSON.parse(decoder.write(request("GET", url).getBody()));
  console.log(queryData.searchinfo.search);
  if(queryData.search[0]) {
    propertyId = queryData.search[0].id;
  }
  return propertyId;
}
