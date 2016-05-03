exports.Intent = function(data, classifier){
  var intent = require('./Intent').Intent(data['voldemort'], classifier, 'voldemort');

  var parse = function(question) {
		return {'searchText': 'Lord Voldemort'};
  };

  var doQuery = function(data, callback) {
		data.answer = 'One hears many things, my Lord. Whether the truth is among them is not clear.';
    callback(null, data);
  };

  var getInterpretation = function(data, callback) {
    data.interpretation = 'Did Lord Voldemort want to keep his return secret?';
    callback(null, data);
  }

  intent.parse = parse;
  intent.doQuery = doQuery;
  intent.getInterpretation = getInterpretation;

  return intent;
}
