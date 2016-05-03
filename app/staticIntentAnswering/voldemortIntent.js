exports.Intent = function(data, classifier){
  var intent = require('./Intent').Intent(data['voldemort'], classifier, 'voldemort');

  var parse = function(question) {
		return {'searchText': 'Lord Voldemort'};
  };

  var doQuery = function(data, callback) {
		data.answer = 'Yes, Rosa and Jonas are right: He wanted to keep his return secret. His idea was to gain power and has everything under control before he reveals his return to the public.';
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
