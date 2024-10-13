from typing import Any, AsyncIterator, Dict, Iterator, List, Optional

from langchain_core.callbacks import (
    AsyncCallbackManagerForLLMRun,
    CallbackManagerForLLMRun,
)

from langchain_core.language_models import BaseChatModel, SimpleChatModel
from langchain_core.messages import AIMessageChunk, BaseMessage, HumanMessage
from langchain_core.outputs import ChatGeneration, ChatGenerationChunk, ChatResult
from langchain_core.runnables import run_in_executor

from langchain_core.messages import (
    AIMessageChunk,
    FunctionMessageChunk,
    HumanMessageChunk,
    SystemMessageChunk,
    ToolMessageChunk,
)
from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    FunctionMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)

import requests
import json
import sys

apiKeys = None
with open('../apikeys.json', 'r') as f:
    apiKeys = json.loads(f.read())

url = "https://llm.kindo.ai/v1/chat/completions"
headers = {
    "api-key": apiKeys['kindoai'],
    "content-type": "application/json",
}

role_map = {
    "human": "user",
    "ai": "assistant",
}
class CustomChatModelAdvanced(BaseChatModel):
    model_name: str

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> ChatResult:
        api_messages = [
            {"role": role_map[m.type], "content": m.content} for m in messages
        ]

        data = {"model": self.model_name, "messages": api_messages}

        # Make the API call
        response = requests.post(url, headers=headers, data=json.dumps(data))

        # Check if the request was successful
        if response.status_code == 200:
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            message = AIMessage(content=content)
        else:
            raise ValueError(
                f"API request failed with status code {response.status_code}"
            )

        generation = ChatGeneration(message=message)
        return ChatResult(generations=[generation])

    @property
    def _llm_type(self) -> str:
        """Get the type of language model used by this chat model."""
        return "echoing-chat-model-advanced"


model = CustomChatModelAdvanced(model_name="claude-3-5-sonnet-20240620")

'''
print(
    model.invoke(
        [
            HumanMessage(content="hello!"),
            AIMessage(content="Hi there human!"),
            HumanMessage(content="Meow!"),
        ]
    )
)
'''

from llama_index.core.llms import ChatMessage
from llama_index.llms.langchain import LangChainLLM

llm = LangChainLLM(llm=model)

'''
messages = [
    ChatMessage(
        role="user", content="Hello World!"
    )
]

resp = llm.chat(messages)
print(resp)
'''

# do the actual kindo model query
from pydantic import BaseModel, Field

class LogoPromptGen(BaseModel):
    prompt: str

sllm = llm.as_structured_llm(output_cls=LogoPromptGen)

# connect to pinecone instance for RAG
import openai
from pinecone import Pinecone, ServerlessSpec

client = openai.OpenAI(api_key=apiKeys['openai'])
pc = Pinecone(api_key=apiKeys['pinecone'])

index_name = "stable-diffusion-prompts"
index = pc.Index(index_name)

def get_embedding(prompt):
    response = client.embeddings.create(
        input=prompt,
        model="text-embedding-ada-002"
    )

    return response.data[0].embedding

def query_pinecone(idea, top_k=5):
    idea_vector = get_embedding(idea)
    result = index.query(vector=idea_vector, top_k=top_k, include_metadata=True)
    return [match['metadata']['prompt'] for match in result['matches']]

def query_openai_with_llamaindex_and_custom_model(idea, top_k=5):
    # Step 1: Query Pinecone to get similar prompts
    similar_prompts = query_pinecone(idea, top_k=top_k)

    # Step 2: Create LlamaIndex document from similar prompts
    context_text = "\n".join(similar_prompts)

    # Step 3: Use your custom model with the Pinecone context as input
    input_msg = ChatMessage.from_str(
        f"Write a logo generation prompt with less than 50 words for the Stable Diffusion model, "
        f"that emphasizes {idea}. Make sure the logo is extremely simple and uses pastel colors."
        f"Here is some context on how good stable diffusion prompts are structured: {context_text}"
    )

    # print("input_msg", input_msg)

    # Call your structured LLM to generate the final prompt
    output = sllm.chat([input_msg])

    # Step 6: Extract and return the generated prompt
    output_obj = output.raw
    generated_prompt = output_obj['prompt'] if 'prompt' in output_obj else str(output)

    return generated_prompt

import argparse, os

parser = argparse.ArgumentParser(description="Generate logos.")

# Add the arguments
parser.add_argument("prompt", type=str, help="prompt")
parser.add_argument("guid", type=str, help="guid")

# Parse the arguments
args = parser.parse_args()

# Access and print the inputs
# print(f"First input: {args.prompt}")
# print(f"Second input: {args.guid}")

response = query_openai_with_llamaindex_and_custom_model(args.prompt)
raw_prompt_json = json.loads(response.split("assistant: ")[1])

print("raw_prompt_json:", json.dumps(raw_prompt_json))

# input: business idea, GUID
# output: create GUID name folder in logos in static and gen 3 images
# line style, low poly, and one more style

# negative prompt for stable diffusion
# photorealism, humans, complexity, complex

# new_idea = "AI powered phone call customer service for small farms"
# response = query_openai_with_llamaindex_and_custom_model(new_idea)

# raw_prompt_json = json.loads(response.split("assistant: ")[1])
# print("raw_prompt_json:", json.dumps(raw_prompt_json))

# create new folder to store the logos by guid
new_path = "../static/" + args.guid
if not os.path.exists(new_path):
    os.makedirs(new_path)


# call into stability ai
stability_ai_apikey = "Bearer " + apiKeys['stablediffusion']

for i, style in enumerate(['low-poly', 'line-art', 'digital-art']):
    print("Generating", i, style)

    response = requests.post(
        f"https://api.stability.ai/v2beta/stable-image/generate/core",
        headers={
            "authorization": stability_ai_apikey,
            "accept": "image/*"
        },
        files={"none": ''},
        data={
            "prompt": raw_prompt_json["prompt"],
            "output_format": "png",
            "negative_prompt": "photorealism, humans, complexity, complex",
            "style_preset": "low-poly"
        },
    )

    save_path = new_path + "/" + str(i) + ".png"

    if response.status_code == 200:
        with open(save_path, 'wb') as file:
            file.write(response.content)
    else:
        print(str(response.json()))
