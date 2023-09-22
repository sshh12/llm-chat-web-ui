from typing import List
import json
import time
import modal

from modal_base import image_base, stub, Message
from image_generation import StableDiffusionModel


@stub.cls(
    image=image_base,
    secret=modal.Secret.from_name("llm-chat-secret"),
)
class StableDiffusionChatModel:
    @modal.method()
    def generate(self, chat: List[Message]):
        prompt = chat[-1].content

        model = StableDiffusionModel()

        yield json.dumps({"alert": "Generating image..."}) + "\n"

        urls = model.inference.remote(prompt)
        resp = "\n\n".join(f"![{prompt}]({url})" for url in urls)

        yield json.dumps({"content": resp}) + "\n"
