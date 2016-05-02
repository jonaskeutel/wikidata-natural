var stringSimilarity = require('string-similarity');
var propertiesWithSynonyms = require('./../public/propertiesWithSynonyms.json');


exports.findPropertyId = function(taggedWords) {
  var property = findPropertyAsVerb(taggedWords);
  if (property == "") {
    property = findPropertyAsDescription(taggedWords);
  }
  console.log("We found as the property you are looking for: ", property);
  propertyId = lookupPropertyId(property);
  return propertyId;
}

function findPropertyAsVerb(taggedWords) {
  var property = "";
  for (i in taggedWords) {
      var taggedWord = taggedWords[i];
      var word = taggedWord[0];
      var tag = taggedWord[1];
      if (tag.startsWith('V')) {
        property += word + " ";
      }
  }

  property = property.toLowerCase().replace(/is|are|was|were|been/g, '');
  return property.trim();
}


function findPropertyAsDescription(taggedWords) {
  // everything between DT (determiner: the, some, ...) and IN (preposition: of, by, in, ...)
  var property = "";
  start = false;

  for (i in taggedWords) {
      var taggedWord = taggedWords[i];
      var word = taggedWord[0];
      var tag = taggedWord[1];
      if (start) {
        if (tag == 'IN') {
          break;
        }
        property += word + " ";
      }

      if (tag == 'DT') {
        start = true;
      }
  }
  return property.trim();
}

// returns propertyId that fits best, if there is no good fit: returns false
function lookupPropertyId(property) {
  var SIMILARITY_THRESHOLD = 0.6;
  // var possibleIds = []; // --> maybe we should return an array of possible ids so that we can decide later which fits best regarding the discourse

  var propertyId = false;
  var maxRating = 0;
  for (var i = 0; i < propertiesWithSynonyms.length; i++) {
    var allPossibleNames = propertiesWithSynonyms[i].aliases;
    allPossibleNames.push(propertiesWithSynonyms[i].label);
    var bestMatch = stringSimilarity.findBestMatch(property, allPossibleNames);
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
