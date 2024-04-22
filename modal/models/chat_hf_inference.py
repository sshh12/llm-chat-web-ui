from typing import List, Dict
import subprocess
import json
import time
import modal
import os

from models.chat_model import ChatModel, Message, ChatModelDescription

MODEL_ID = "meta-llama/Meta-Llama-3-70B-Instruct"
MODEL_REVISION = "81ca4500337d94476bda61d84f0c93af67e4495f"
LAUNCH_FLAGS = [
    "--model-id",
    MODEL_ID,
    "--port",
    "8000",
    "--revision",
    MODEL_REVISION,
]


def download_model():
    subprocess.run(
        [
            "text-generation-server",
            "download-weights",
            MODEL_ID,
            "--revision",
            MODEL_REVISION,
        ],
    )


tgi_image = (
    modal.Image.from_registry("ghcr.io/huggingface/text-generation-inference:1.4")
    .dockerfile_commands("ENTRYPOINT []")
    .run_function(
        download_model,
        secrets=[modal.Secret.from_name("llm-chat-secret")],
        timeout=3600,
    )
    .pip_install("text-generation")
)


class LLAMA3Model:
    stub_config = dict(
        secrets=[modal.Secret.from_name("llm-chat-secret")],
        gpu=modal.gpu.H100(count=2),
        allow_concurrent_inputs=15,
        container_idle_timeout=60 * 5,
        timeout=60 * 60,
        image=tgi_image,
    )

    @modal.enter()
    def start_server(self):
        import socket
        import time

        from text_generation import AsyncClient

        self.launcher = subprocess.Popen(
            ["text-generation-launcher"] + LAUNCH_FLAGS,
            env={
                **os.environ,
            },
        )
        self.client = AsyncClient("http://127.0.0.1:8000", timeout=60)

        # Poll until webserver at 127.0.0.1:8000 accepts connections before running inputs.
        def webserver_ready():
            try:
                socket.create_connection(("127.0.0.1", 8000), timeout=1).close()
                return True
            except (socket.timeout, ConnectionRefusedError):
                # Check if launcher webserving process has exited.
                # If so, a connection can never be made.
                retcode = self.launcher.poll()
                if retcode is not None:
                    raise RuntimeError(
                        f"launcher exited unexpectedly with code {retcode}"
                    )
                return False

        while not webserver_ready():
            time.sleep(1.0)

        print("Webserver ready!")

    @modal.exit()
    def terminate_server(self):
        self.launcher.terminate()

    @modal.method()
    async def generate_stream(self, chat: List[Dict]):
        prompt = "<|begin_of_text|>"
        for m in chat:
            prompt += f"<|start_header_id|>{m['role']}<|end_header_id|>\n\n{m['content'].strip()}<|eot_id|>"
        prompt += "<|start_header_id|>assistant<|end_header_id|>\n\n"

        async for response in self.client.generate_stream(
            prompt, max_new_tokens=1024, stop_sequences=["<|eot_id|>"]
        ):
            if not response.token.special and response.token.text != "<|eot_id|>":
                yield response.token.text


class HFInferenceModel(ChatModel):
    def __init__(self, cfg: Dict):
        self.model = cfg["model"]
        self.system_prompt = cfg["systemPrompt"]

    def generate(self, chat: List[Message]):
        Model = modal.Cls.lookup("llm-chat-web-ui", "HuggingFaceLLAMA3Model")
        yield json.dumps({"alert": f"Running {self.model}"}) + "\n"
        chat_dicts = [{"role": "system", "content": self.system_prompt}] + [
            {"role": m.role, "content": m.content} for m in chat
        ]
        for text in Model().generate_stream.remote_gen(chat_dicts):
            yield json.dumps({"append:content": text}) + "\n"
            time.sleep(0.01)

    @classmethod
    def get_models(cls) -> List[ChatModelDescription]:
        return [
            ChatModelDescription(cls=cls, cfg={"model": m}, key=f"HuggingFace:{m}")
            for m in ["meta-llama/Meta-Llama-3-70B-Instruct"]
        ]
