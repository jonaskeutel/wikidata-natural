var wikidataIdLookup = require('./../wikidataIdLookup');

exports.findNamedEntity = function(taggedWords, namedEntity, callback) {
  var namedEntityString = "";
  var tags = ["NNP", "NN"];
  var prepositionMightBeInEntity = false; // birthdate of Barack Obama --> NN IN NN NN --> namedEntity = birthdate Barack Obama --> check for IN

  // at first, try to find NNP or NNPS ("Proper Noun"); if this wasn't successful, also try "NN" or "NNS" ("Noun")
  for (i in tags) {
    for (j in taggedWords) {
        var taggedWord = taggedWords[j];
        var word = taggedWord[0];
        var tag = taggedWord[1];
        if (tag.startsWith(tags[i])) {
          if (prepositionMightBeInEntity) {
            namedEntityString = "";
            prepositionMightBeInEntity = false;
          }
          namedEntityString += word + " ";
        }
        if (namedEntityString != "" && tag == 'IN') {
          prepositionMightBeInEntity = true;
        }
    }
    if (namedEntityString != "") {
      wikidataIdLookup.getWikidataId({searchText: namedEntityString.trim()}, function(err, data) {
        if (err) {
          namedEntity.id = null;
          namedEntity.label = null;
        } else {
          namedEntity.id = data.id;
          namedEntity.label = data.label;
        }
        callback();
      })
      return;
    }
  }

  wikidataIdLookup.getWikidataId({searchText: namedEntityString.trim()}, function(err, data) {
    if (err) {
      property.id = null;
      property.label = null;
    } else {
      property.id = data.id;
      property.label = data.label;
    }
    callback();
  })
  return;
};
