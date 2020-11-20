import torch
import pandas as pd
from transformers import BertForQuestionAnswering
from transformers import BertTokenizer
import json

def matchParaAnswer(keyword):
	topic = ['contact','application timeline','application process','application fee','selection process',
			 'required document', 'kaist']
	with open('topKeywords.json') as f:
		topKeywords = json.load(f)
	value = 0
	index = -1
	for i in range(len(topKeywords)):
		if keyword in topKeywords[i]:
			value = max(topKeywords[i][keyword],value)
			index = i
	# print out topic 
	print(topic[index])
	return index

def getAnswer(question, paragraph, model, tokenizer):
	encoding = tokenizer.encode_plus(text=question,text_pair=paragraph)
	inputs = encoding['input_ids']  #Token embeddings
	sentence_embedding = encoding['token_type_ids']  #Segment embeddings
	tokens = tokenizer.convert_ids_to_tokens(inputs) #input tokens

	start_scores, end_scores = model(input_ids=torch.tensor([inputs]), token_type_ids=torch.tensor([sentence_embedding]))
	start_index = torch.argmax(start_scores)
	end_index = torch.argmax(end_scores)
	answer = ' '.join(tokens[start_index:end_index+1])
	corrected_answer = ''

	for word in answer.split():
		if word[0:2] == '##':
			corrected_answer += word[2:]
		else:
			corrected_answer += ' ' + word
	corrected_answer = corrected_answer.replace(" , ", ",")
	corrected_answer = corrected_answer.replace(" . ", ".")
	corrected_answer = corrected_answer.replace(" @ ", "@")
	corrected_answer = corrected_answer.replace(" - ", "-")
	return corrected_answer

def Answer(question, keyword):
	# find the paragraph contain the answer
	keyword = keyword.lower()
	indexPara = matchParaAnswer(keyword)
	if indexPara == -1:
		print("Cannot find the answer! Please contact us")
	else:
		# load data
		data = pd.read_csv("data.csv")
		# retrieve the paragraph contains answer
		paragraph = data.iloc[indexPara]['DETAIL']
		print("--------------FULL INFORMATION-----------------")
		print(paragraph)
		# paragraph[:100] used when we do not have a great computer
		answer = getAnswer(question, paragraph[:100], model, tokenizer)
		# answer = getAnswer(question, paragraph model, tokenizer)
		print("------------------ANSWER------------------")
		print(answer)

if __name__ == "__main__":
	# Model
	model = BertForQuestionAnswering.from_pretrained('bert-large-uncased-whole-word-masking-finetuned-squad')
	# Tokenizer
	tokenizer = BertTokenizer.from_pretrained('bert-large-uncased-whole-word-masking-finetuned-squad')

	# inp = input()
	# question = json.loads(inp)["text"]

	# Example, pass user question here
	question = "How much is application fee?"
	keyword = "contact"

	# Give the result to user 
	# need to update to show them 
	Answer(question,keyword)
	

	