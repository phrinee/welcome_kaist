import nltk, json
posts = nltk.corpus.nps_chat.xml_posts()[:1000]


def dialogue_act_features(post):
    features = {}
    for word in nltk.word_tokenize(post):
        features['contains({})'.format(word.lower())] = True
    return features

featuresets = [(dialogue_act_features(post.text), post.get('class')) for post in posts]
size = int(len(featuresets) * 0.1)
train_set, test_set = featuresets[size:], featuresets[:size]
classifier = nltk.NaiveBayesClassifier.train(train_set)

inp = input()
question = json.loads(inp)['message']

print(classifier.classify(dialogue_act_features(question)))