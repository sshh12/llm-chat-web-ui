from typing import List
import queue
import threading
import modal

from modal_base import stub, Message

LLAMA_MODEL_SIZE: str = "13b"

image = (
    modal.Image.from_registry(
        "nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04",
        add_python="3.11",
    )
    .run_commands(
        "apt-get update",
        "apt-get install -y curl git",
        "curl -sSf https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | bash",
        "apt-get install -y git-lfs",
        "pip3 install --pre --force-reinstall mlc-ai-nightly-cu121 mlc-chat-nightly-cu121 -f https://mlc.ai/wheels",
    )
    .run_commands(
        "mkdir -p dist/prebuilt",
        "git clone https://github.com/mlc-ai/binary-mlc-llm-libs.git dist/prebuilt/lib",
        f"cd dist/prebuilt && git clone https://huggingface.co/mlc-ai/mlc-chat-Llama-2-{LLAMA_MODEL_SIZE}-chat-hf-q4f16_1",
    )
)


@stub.cls(gpu=modal.gpu.A10G(), container_idle_timeout=60, image=image)
class MLCModel:
    def __enter__(self):
        from mlc_chat import ChatModule

        self.cm = ChatModule(
            model=f"/dist/prebuilt/mlc-chat-Llama-2-{LLAMA_MODEL_SIZE}-chat-hf-q4f16_1",
            lib_path=f"/dist/prebuilt/lib/Llama-2-{LLAMA_MODEL_SIZE}-chat-hf-q4f16_1-cuda.so",
        )

    @modal.method()
    def generate(self, chat: List[Message]):
        from mlc_chat.callback import DeltaCallback

        class QueueCallback(DeltaCallback):
            """Stream the output of the chat module to client."""

            def __init__(self, callback_interval: float):
                super().__init__()
                self.queue: queue.Queue = queue.Queue()
                self.stopped = False
                self.callback_interval = callback_interval

            def delta_callback(self, delta_message: str):
                self.stopped = False
                self.queue.put(delta_message)

            def stopped_callback(self):
                self.stopped = True

        queue_callback = QueueCallback(callback_interval=1)

        def _generate():
            self.cm.generate(
                prompt=chat[-1],
                progress_callback=queue_callback,
            )

        background_thread = threading.Thread(target=_generate)
        background_thread.start()

        while not queue_callback.stopped:
            yield {"content": queue_callback.queue.get()}
