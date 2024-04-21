from typing import List, Dict
from openai import OpenAI
from functools import cache
import json
import time

from models.chat_model import ChatModel, Message, ChatModelDescription


@cache
def get_model_names():
    client = OpenAI()
    return [model.id for model in client.models.list() if model.id.startswith("gpt-")]


def summarize_chat(messages: List[Dict]) -> str:
    client = OpenAI()
    args = dict(
        model="gpt-4-turbo",
        temperature=0.1,
        messages=[
            dict(
                role="system",
                content="Summarize the following chat into a very short title. Do not use quotes.",
            ),
            dict(role="user", content=json.dumps(messages)[:5000]),
        ],
    )
    resp = client.chat.completions.create(**args)
    return resp.choices[0].message.content


class OpenAIModel(ChatModel):
    def __init__(self, cfg: Dict):
        self.model = cfg["model"]
        self.temperature = cfg["temperature"]
        self.system_prompt = cfg["systemPrompt"]
        self.client = OpenAI()

    def generate(self, chat: List[Message]):
        args = dict(
            model=self.model,
            messages=[dict(role="system", content=self.system_prompt)]
            + [dict(role=m.role, content=m.content) for m in chat],
            temperature=self.temperature,
            stream=True,
        )
        resp = self.client.chat.completions.create(**args)
        for chunk in resp:
            chunk_data = chunk.choices[0].delta
            yield json.dumps({"append:content": chunk_data.content}) + "\n"
            time.sleep(0.01)

    @classmethod
    def get_models(cls) -> List[ChatModelDescription]:
        return [
            ChatModelDescription(cls=cls, cfg={"model": m}, key=f"OpenAI:{m}")
            for m in get_model_names()
        ]
