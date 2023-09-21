from typing import List
import modal

from modal_base import stub, Message

MODEL_DIR = "/root/model"


def download_model_to_folder():
    from huggingface_hub import snapshot_download
    import os

    os.makedirs(MODEL_DIR, exist_ok=True)

    snapshot_download(
        "meta-llama/Llama-2-13b-chat-hf",
        local_dir=MODEL_DIR,
        token=os.environ["HUGGING_FACE_HUB_TOKEN"],
    )


image = (
    modal.Image.from_registry("nvcr.io/nvidia/pytorch:22.12-py3")
    .pip_install("torch==2.0.1", index_url="https://download.pytorch.org/whl/cu118")
    # Pinned to 08/15/2023
    .pip_install(
        "vllm @ git+https://github.com/vllm-project/vllm.git@805de738f618f8b47ab0d450423d23db1e636fa2",
        "typing-extensions==4.5.0",  # >=4.6 causes typing issues
    )
    # Use the barebones hf-transfer package for maximum download speeds. No progress bar, but expect 700MB/s.
    .pip_install("hf-transfer~=0.1")
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
    .run_function(
        download_model_to_folder,
        secret=modal.Secret.from_name("llm-chat-secret"),
        timeout=60 * 20,
    )
)


@stub.cls(
    gpu=modal.gpu.A100(),
    container_idle_timeout=60,
    image=image,
    secret=modal.Secret.from_name("llm-chat-secret"),
)
class VLLMHFModel:
    def __init__(self, temperature: float):
        self.temperature = temperature

    def __enter__(self):
        from vllm import LLM

        # Load the model. Tip: MPT models may require `trust_remote_code=true`.
        self.llm = LLM(MODEL_DIR)
        self.template = """<s>[INST] <<SYS>>
{system}
<</SYS>>

{user} [/INST] """

    @modal.method()
    def generate(self, chat: List[Message]):
        from vllm import SamplingParams

        question = chat[-1].content
        prompts = [self.template.format(system="", user=question)]
        sampling_params = SamplingParams(
            temperature=max(self.temperature, 0.01),
            top_p=1,
            max_tokens=1000,
            presence_penalty=1.15,
        )
        result = self.llm.generate(prompts, sampling_params)
        for output in result:
            yield {"content": output.outputs[0].text}
