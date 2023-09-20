from typing import List
import json
import time

from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import modal


image_base = (
    modal.Image.debian_slim()
    .pip_install("openai~=0.27", "prisma==0.10.0")
    .apt_install("curl")
    .run_commands(
        "curl https://raw.githubusercontent.com/sshh12/llm-chat-web-ui/main/prisma/schema.prisma?42 > /root/schema.prisma",
        "prisma generate --schema /root/schema.prisma",
    )
)
stub = modal.Stub("llm-chat-web-ui")


class Message(BaseModel):
    role: str
    content: str


@stub.cls(
    image=image_base,
    secret=modal.Secret.from_name("llm-chat-secret"),
)
class OpenAIAPIModel:
    def __init__(self, model: str, temperature: float):
        self.model = model
        self.temperature = temperature

    @modal.method()
    def generate(self, chat: List[str]):
        import openai

        args = dict(
            model=self.model,
            messages=[dict(role=m.role, content=m.content) for m in chat],
            temperature=self.temperature,
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
    apiKey: str
    model: str
    temperature: float


@stub.function(
    secret=modal.Secret.from_name("llm-chat-secret"),
    image=image_base,
)
@modal.web_endpoint(method="POST")
async def generate(args: GenerateArgs):
    from prisma import Prisma

    prisma = Prisma()
    await prisma.connect()
    user = await prisma.user.find_first(where={"apiKey": args.apiKey})
    if user is None:
        raise RuntimeError()

    model_namespace, model_name = args.model.split(":")

    if model_namespace == "openai":
        model = OpenAIAPIModel(model_name, temperature=args.temperature)
    else:
        raise RuntimeError()

    return StreamingResponse(
        model.generate.remote_gen(args.chat), media_type="text/event-stream"
    )
