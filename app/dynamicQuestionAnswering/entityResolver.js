exports.findNamedEntity = function(taggedWords) {
  var namedEntity = "";
  var tags = ["NNP", "NN"];
  var prepositionMightBeInEntity = false; // birthdate of Barack Obama --> NN NN IN NN --> namedEntity = birthdate Barack Obama --> check for IN

  // at first, try to find NNP or NNPS ("Proper Noun"); if this wasn't successful, also try "NN" or "NNS" ("Noun")
  for (i in tags) {
    for (j in taggedWords) {
        var taggedWord = taggedWords[j];
        var word = taggedWord[0];
        var tag = taggedWord[1];
        if (tag.startsWith(tags[i])) {
          if (prepositionMightBeInEntity) {
            namedEntity = "";
            prepositionMightBeInEntity = false;
          }
          namedEntity += word + " ";
        }
        if (namedEntity != "" && tag == 'IN') {
          prepositionMightBeInEntity = true;
        }
    }
    if (namedEntity != "") {
      return namedEntity.trim();
    }
  }

  return namedEntity.trim();
};
