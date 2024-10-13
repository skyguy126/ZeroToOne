from pydantic import BaseModel
from llama_index.core.llms import ChatMessage, CustomLLM

class LogoPromptGen(BaseModel):
    prompt: str

class KindoLLM

if __name__ == "__main__":

    sllm = llm.as_structured_llm(output_cls=LogoPromptGen)
    input_msg = ChatMessage.from_str("Write a logo generation prompt for the Stable Diffusion model, that emphasizes simplicity, pastel colors, and the business idea.")
    output = sllm.chat([input_msg])

    # get actual object
    output_obj = output.raw

    print(str(output))
    print(output_obj)

    print("done")
