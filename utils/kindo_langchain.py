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

url = "https://llm.kindo.ai/v1/chat/completions"
headers = {
    "api-key": "0641ebd6-87f1-4d38-88f3-bb09871b9cbe-2217d4f8336c364f",
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

from pydantic import BaseModel, Field

class LogoPromptGen(BaseModel):
    prompt: str

sllm = llm.as_structured_llm(output_cls=LogoPromptGen)
input_msg = ChatMessage.from_str("Write a logo generation prompt for the Stable Diffusion model, that emphasizes simplicity, pastel colors, and the business idea.")
output = sllm.chat([input_msg])

output_obj = output.raw

print(str(output))
print(output_obj)