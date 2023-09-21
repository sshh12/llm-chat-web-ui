from typing import List
import json
import time
import modal

from modal_base import image_base, stub, Message


@stub.cls(
    image=image_base,
    secret=modal.Secret.from_name("llm-chat-secret"),
)
class OpenAIAPIModel:
    def __init__(self, model: str, temperature: float, system_prompt: str):
        self.model = model
        self.temperature = temperature
        self.system_prompt = system_prompt

    @modal.method()
    def generate(self, chat: List[Message]):
        import openai

        args = dict(
            model=self.model,
            messages=[dict(role="system", content=self.system_prompt)]
            + [dict(role=m.role, content=m.content) for m in chat],
            temperature=self.temperature,
            stream=True,
        )
        print(args)

        resp = openai.ChatCompletion.create(**args)
        for chunk in resp:
            chunk_data = chunk["choices"][0]["delta"]
            yield json.dumps({"content": chunk_data.get("content", "")}) + "\n"
            time.sleep(0.01)
