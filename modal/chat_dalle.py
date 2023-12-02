from typing import List
import json
import modal

from modal_base import image_base, stub, Message


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

        image_url = response.data[0].url

        resp = f"![{prompt}]({image_url})"

        yield json.dumps({"content": resp}) + "\n"
