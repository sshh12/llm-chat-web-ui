from typing import List, Dict
import json
import time

from models.chat_model import ChatModel, Message


class OpenAIModel(ChatModel):
    def __init__(self, cfg: Dict):
        self.model = "gpt-4"  # cfg["model"]
        self.temperature = cfg["temperature"]
        self.system_prompt = cfg["systemPrompt"]

    def generate(self, chat: List[Message]):
        from openai import OpenAI

        client = OpenAI()

        args = dict(
            model=self.model,
            messages=[dict(role="system", content=self.system_prompt)]
            + [dict(role=m.role, content=m.content) for m in chat],
            temperature=self.temperature,
            stream=True,
        )

        resp = client.chat.completions.create(**args)
        for chunk in resp:
            chunk_data = chunk.choices[0].delta
            yield json.dumps({"append:content": chunk_data.content}) + "\n"
            time.sleep(0.01)
