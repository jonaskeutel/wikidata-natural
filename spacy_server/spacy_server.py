from flask import Flask, request
import spacy
import json
from spacy.en import English

print("loading language model...", flush=True, end=" ")
parseEnglish = English()
print("done.", flush=True)

app = Flask(__name__, static_folder='frontendStatic')

@app.route('/', methods=['POST'])
def annotateQuestion():
	question = request.get_json()['question']
	return json.dumps(parse(question))

def parse(question):
	#https://spacy.io/docs#token
	serializedTokens = {}
	for token in parseEnglish(question):
		serializedToken = {
			'orth': token.orth_,
			'lemma': token.lemma_,
			'pos': token.pos_,
			'tag': token.tag_,
			'entType': token.ent_type_,
			'depType': token.dep_,
			'depParent': token.head.idx,
		}
		serializedTokens[str(token.idx)] = serializedToken
	return serializedTokens

if __name__ == "__main__":
	app.run(debug=True, port=7000)
