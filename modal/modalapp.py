from typing import List
import json
import time

from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import modal


image_openai = modal.Image.debian_slim().pip_install(
    "openai~=0.27",
)
stub = modal.Stub("llm-chat-web-ui")


class Message(BaseModel):
    role: str
    content: str


@stub.cls(
    image=image_openai,
    secrets=[
        modal.Secret.from_name("openai-secret"),
    ],
)
class OpenAIAPIModel:
    @modal.method()
    def generate(self, chat: List[str]):
        import openai

        args = dict(
            model="gpt-3.5-turbo",
            messages=[dict(role=m.role, content=m.content) for m in chat],
            temperature=0.0,
            stream=True,
        )
        print(args)

        resp = openai.ChatCompletion.create(**args)
        for chunk in resp:
            chunk_data = chunk["choices"][0]["delta"]
            yield json.dumps({"content": chunk_data.get("content", "")}) + "\n"
            time.sleep(0.01)


class GenerateArgs(BaseModel):
    chat: List[Message]


@stub.function()
@modal.web_endpoint(method="POST")
def generate(args: GenerateArgs):
    model = OpenAIAPIModel()
    return StreamingResponse(
        model.generate.remote_gen(args.chat), media_type="text/event-stream"
    )
