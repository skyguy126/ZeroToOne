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
# TODO: change this path when invoking from node
with open('./apikeys.json', 'r') as f:
    apiKeys = json.loads(f.read())

url = "https://api.perplexity.ai/chat/completions"
header_auth = "Bearer " + apiKeys['perplexity']
headers = {
    "Authorization": header_auth,
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

        data = {"model": self.model_name, "messages": api_messages, "temperature": 0.01}

        # print("\n\n\n")
        # print(json.dumps(data))
        # print("\n\n\n")

        # Make the API call
        response = requests.post(url, headers=headers, data=json.dumps(data))

        # Check if the request was successful
        if response.status_code == 200:
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            message = AIMessage(content=content)
            
            # print("\n\n\n")
            # print("content", content)
            # print("\n\n\n")
            # print("response", response)
            # print("\n\n\n")
            # print("result", result)
            # print("\n\n\n")
            # print("message", message)
            # print("\n\n\n")
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


model = CustomChatModelAdvanced(model_name="llama-3.1-sonar-small-128k-chat")

from llama_index.core.llms import ChatMessage
from llama_index.llms.langchain import LangChainLLM

llm = LangChainLLM(llm=model)

from pydantic import BaseModel, Field

class VC(BaseModel):
    """Data model for a song."""

    name: str
    reason: str
    location: str

class VCQuery(BaseModel):
    vcs: List[VC]

if __name__ == "__main__":

    import argparse

    parser = argparse.ArgumentParser(description="Generate VCs.")

    # Add the arguments
    parser.add_argument("idea", type=str, help="idea")
    parser.add_argument("location", type=str, help="location")

    args = parser.parse_args()

    prompt = "Generate a list of VCs in " + args.location + " to fund a " + args.idea + " business. Take note of the location " + args.location + " and give reasoning as to why each VC would be a good fit. If some data is unavailable, set the field to an empty string."

    sllm = llm.as_structured_llm(output_cls=VCQuery)
    input_msg = ChatMessage.from_str(prompt)
    output = sllm.chat([input_msg])

    # get actual object
    output_obj = output.raw

    print()
    print(str(output))
