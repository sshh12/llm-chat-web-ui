from typing import List
import json
import modal

from modal_base import image_base, stub, Message
from modal.old.fs_tools import upload_image


@stub.cls(
    image=image_base,
    secret=modal.Secret.from_name("llm-chat-secret"),
)
class DALLEChatModel:
    def __init__(self, model: str):
        self.model = model

    @modal.method()
    def generate(self, chat: List[Message]):
        from openai import OpenAI
        from PIL import Image
        import requests

        client = OpenAI()

        prompt = chat[-1].content.replace("\n", "")

        yield json.dumps({"alert": "Generating image..."}) + "\n"

        response = client.images.generate(
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
