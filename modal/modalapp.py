from typing import List
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import modal

from modal_base import image_base, stub, Message
from chat_openai import OpenAIAPIModel
from chat_vllm_hf import VLLMHFModel


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
    elif model_namespace == "vllmhf":
        model = VLLMHFModel(temperature=args.temperature)
    else:
        raise RuntimeError()

    return StreamingResponse(
        model.generate.remote_gen(args.chat), media_type="text/event-stream"
    )
