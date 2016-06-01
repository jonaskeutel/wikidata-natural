from flask import Flask, request
import spacy
import json
import sys
from spacy.en import English

print("loading language model...", flush=True, end=" ")
parseEnglish = English()
print("done.", flush=True)

PROPAGATE_EXCEPTIONS = True

app = Flask(__name__, static_folder='frontendStatic')

@app.route('/', methods=['POST'])
def annotateQuestion():
    question = request.get_json()['question']
    result = json.dumps(addChildDependencies(parse(question)))
    print(result)
    return result

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
            'depChildren': [],
		}
		serializedTokens[token.idx] = serializedToken
	return toArray(serializedTokens)

def toArray(tokenDict):
	tokenArray = []
	keys = sorted(tokenDict.keys())
	# print(keys, file=sys.stderr, flush=True)
	for key in keys:
		token = tokenDict[key]
		# print(token, file=sys.stderr, flush=True)
		depParentIndex = keys.index(token['depParent'])
		token['depParent'] = depParentIndex
		tokenArray.append(token)
	return tokenArray

def addChildDependencies(jsonArray):
    index = 0;
    for entry in jsonArray:
        if (entry['depParent'] != index):
            jsonArray[entry['depParent']]['depChildren'].append({'depType': entry['depType'], 'pos': index, 'tag': entry['tag'], 'orth': entry['orth']})
        index += 1
    return jsonArray

if __name__ == "__main__":
	app.run(debug=True, port=7000)
