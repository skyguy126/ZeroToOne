import openai
from pinecone import Pinecone, ServerlessSpec
import pandas as pd
import json
import sys

# fetch apikeys and secrets.
apiKeys = None
with open('../apikeys.json', 'r') as f:
    apiKeys = json.loads(f.read())

# load the stable diffusion dataset from hugging face
# splits = {'train': 'data/train.parquet', 'test': 'data/eval.parquet'}
# df = pd.read_parquet("hf://datasets/Gustavosta/Stable-Diffusion-Prompts/" + splits["train"])

# print(df)

# setup openai for embeddings
client = openai.OpenAI(api_key=apiKeys['openai'])

# setup pinecone for db loading
pc = Pinecone(api_key=apiKeys['pinecone'])

# create a new pinecone index
index_name = "stable-diffusion-prompts"
'''
if index_name not in pc.list_indexes():
    pc.create_index(
        name=index_name,
        dimension=1536, # 'text-embedding-ada-002' gives 1536-dimensional vectors
        spec=ServerlessSpec(
            cloud="aws",
            region="us-east-1"
        ) 
    )
'''

# connect to the index
index = pc.Index(index_name)


# Function to get embeddings for a prompt
def get_embedding(prompt):
    response = client.embeddings.create(
        input=prompt,
        model="text-embedding-ada-002"
    )

    return response.data[0].embedding

'''
# Store embeddings in Pinecone
for i, row in df.iterrows():
    if i < 1000:
        continue
    elif i == 3000:
        break

    # completed 1070

    print(i)

    prompt = row['Prompt']
    vector = get_embedding(prompt)

    index.upsert([(str(i), vector, {'prompt': prompt})])
'''

# Query Pinecone for similar prompts given a new idea
def query_pinecone(idea, top_k=5):
    idea_vector = get_embedding(idea)
    result = index.query(vector=idea_vector, top_k=top_k, include_metadata=True)
    return [match['metadata']['prompt'] for match in result['matches']]

# test code here
new_business_idea = "flower shop with exotic asian clays"


print(query_pinecone(new_business_idea))
print("Done!")
