import torch
import pandas as pd
from transformers import BertForQuestionAnswering
from transformers import BertTokenizer

# Model
model = BertForQuestionAnswering.from_pretrained('bert-large-uncased-whole-word-masking-finetuned-squad')
# Tokenizer
tokenizer = BertTokenizer.from_pretrained('bert-large-uncased-whole-word-masking-finetuned-squad')

# Example
# update Data and how to retrieve to get this paragraph
question = "How much is application fee?"
paragraph = '''Application fee costs 80 USD or 80,000 KRW. You could pay for it
by 1) Credit Card or Domestic Transfer / 2) International Bank Transfer.'''

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
   	#If it's a subword token
		if word[0:2] == '##':
			corrected_answer += word[2:]
		else:
			corrected_answer += ' ' + word
	return corrected_answer

answer = getAnswer(question, paragraph, model, tokenizer)
print(answer)
