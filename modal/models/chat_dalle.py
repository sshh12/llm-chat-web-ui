from typing import List, Dict
from openai import OpenAI
from functools import cache
from PIL import Image
import requests
import json

from models.chat_model import ChatModel, Message, ChatModelDescription
from fs_tools import upload_image


@cache
def get_model_names():
    client = OpenAI()
    return [
        model.id for model in client.models.list() if model.id.startswith("dall-e-")
    ]


class OpenAIDalle(ChatModel):
    def __init__(self, cfg: Dict):
        self.model = cfg["model"]
        self.client = OpenAI()

    def generate(self, chat: List[Message]):
        prompt = chat[-1].content.replace("\n", "")

        yield json.dumps({"alert": "Generating image..."}) + "\n"

        response = self.client.images.generate(
            model=self.model,
            prompt=prompt,
            size="1024x1024",
            quality="hd",
            n=1,
        )

        raw_image_url = response.data[0].url
        image_url = upload_image(
            Image.open(requests.get(raw_image_url, stream=True).raw)
        )

        resp = f"![{prompt}]({image_url})"

        yield json.dumps({"content": resp}) + "\n"

    @classmethod
    def get_models(cls) -> List[ChatModelDescription]:
        return [
            ChatModelDescription(cls=cls, cfg={"model": m}, key=f"Dalle:{m}")
            for m in get_model_names()
        ]
