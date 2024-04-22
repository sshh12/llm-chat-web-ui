from typing import Dict
from pydantic import BaseModel
import modal

from modal_base import image_base, stub
from models.chat_hf_inference import LLAMA3Model


class BackendArgs(BaseModel):
    func: str
    api_key: str
    args: Dict


@stub.cls(
    secrets=[modal.Secret.from_name("llm-chat-secret")],
    image=image_base,
    mounts=[
        modal.Mount.from_local_python_packages(
            "context", "methods_web", "models", "fs_tools", "tools"
        )
    ],
    container_idle_timeout=500,
    allow_concurrent_inputs=10,
    cpu=0.25,
)
class LLMChatApp:
    @modal.enter()
    async def open_connection(self):
        from prisma import Prisma

        self.prisma = Prisma()
        await self.prisma.connect()

    @modal.web_endpoint(method="POST", label="llm-chat-stream-backend")
    async def stream_backend(self, args: BackendArgs):
        import context
        import methods_web

        async with context.Context(self.prisma, args.api_key) as ctx:
            return await methods_web.METHODS[args.func](ctx, **args.args)

    @modal.exit()
    async def close_connection(self):
        await self.prisma.disconnect()


@stub.cls(**LLAMA3Model.stub_config)
class HuggingFaceLLAMA3Model(LLAMA3Model):
    pass
