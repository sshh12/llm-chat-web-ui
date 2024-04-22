from typing import List, Dict
from openai import OpenAI
from functools import cache
import json
import time

from models.chat_model import ChatModel, Message, ChatModelDescription
from tools.tools import get_openai_tools, call_tool


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


class OpenAIToolsModel(ChatModel):
    def __init__(self, cfg: Dict):
        self.model = cfg["model"]
        self.temperature = cfg["temperature"]
        self.system_prompt = cfg["systemPrompt"]
        self.client = OpenAI()

    def generate(self, chat: List[Message]):

        cur_chat = [dict(role="system", content=self.system_prompt)] + [
            dict(role=m.role, content=m.content) for m in chat
        ]

        args = dict(
            model=self.model,
            messages=cur_chat,
            temperature=self.temperature,
            stream=True,
            functions=get_openai_tools(),
        )

        is_running = True
        while is_running:
            resp = self.client.chat.completions.create(**args)

            func_call = {
                "name": None,
                "arguments": "",
            }

            for chunk in resp:
                if not chunk.choices:
                    continue

                delta = chunk.choices[0].delta
                finish_reason = chunk.choices[0].finish_reason
                if delta.function_call:
                    if delta.function_call.name:
                        func_call["name"] = delta.function_call.name
                    if delta.function_call.arguments:
                        func_call["arguments"] += delta.function_call.arguments
                if finish_reason == "function_call":
                    break
                elif finish_reason == "stop":
                    is_running = False
                    break

                if func_call["name"]:
                    yield json.dumps(
                        {"alert": f"Using tool {func_call['name']}(...)"}
                    ) + "\n"

                if delta.content:
                    yield json.dumps({"append:content": delta.content}) + "\n"

            if func_call["name"]:
                cur_chat.append(
                    {
                        "role": "assistant",
                        "content": None,
                        "function_call": {
                            "name": func_call["name"],
                            "arguments": func_call["arguments"],
                        },
                    }
                )

                func_args = json.loads(func_call["arguments"])
                try:
                    result = call_tool(func_call["name"], func_args)
                except Exception as e:
                    result = f"Error: {e}"

                cur_chat.append(
                    {
                        "role": "function",
                        "name": func_call["name"],
                        "content": str(result),
                    }
                )

    @classmethod
    def get_models(cls) -> List[ChatModelDescription]:
        return [
            ChatModelDescription(cls=cls, cfg={"model": m}, key=f"OpenAI+Tools:{m}")
            for m in get_model_names()
        ]
