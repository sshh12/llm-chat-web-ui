import modal

from modal_base import stub

CACHE_DIR = "/root/cache"


def upload_to_imgur(img_bytes) -> str:
    import requests
    import logging
    import base64
    import os

    IMGUR_CLIENT_ID = os.environ["IMGUR_CLIENT_ID"]

    resp = requests.post(
        "https://api.imgur.com/3/image",
        headers={"Authorization": f"Client-ID {IMGUR_CLIENT_ID}"},
        data={
            "image": base64.b64encode(img_bytes),
            "type": "base64",
            "name": "img",
            "title": "img",
        },
    ).json()
    logging.info("Imgur upload " + repr(resp))
    return resp["data"]["link"]


def download_models():
    from huggingface_hub import snapshot_download

    ignore = ["*.bin", "*.onnx_data", "*/diffusion_pytorch_model.safetensors"]
    snapshot_download(
        "stabilityai/stable-diffusion-xl-base-1.0",
        ignore_patterns=ignore,
        cache_dir=CACHE_DIR,
    )
    snapshot_download(
        "stabilityai/stable-diffusion-xl-refiner-1.0",
        ignore_patterns=ignore,
        cache_dir=CACHE_DIR,
    )


image = (
    modal.Image.debian_slim()
    .apt_install(
        "libglib2.0-0", "libsm6", "libxrender1", "libxext6", "ffmpeg", "libgl1"
    )
    .pip_install(
        "diffusers~=0.21",
        "invisible_watermark~=0.1",
        "transformers~=4.31",
        "accelerate~=0.21",
        "safetensors~=0.3",
    )
    .run_function(download_models)
)


@stub.cls(
    gpu=modal.gpu.A10G(),
    container_idle_timeout=60,
    image=image,
    secret=modal.Secret.from_name("llm-chat-secret"),
)
class StableDiffusionModel:
    def __enter__(self):
        import torch
        from diffusers import DiffusionPipeline

        load_options = dict(
            torch_dtype=torch.float16,
            use_safetensors=True,
            variant="fp16",
            device_map="auto",
            cache_dir=CACHE_DIR,
        )

        self.base = DiffusionPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-base-1.0", **load_options
        )
        self.refiner = DiffusionPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-refiner-1.0",
            text_encoder_2=self.base.text_encoder_2,
            vae=self.base.vae,
            **load_options,
        )

    @modal.method()
    def inference(
        self,
        prompt,
        seed=None,
        steps=30,
        high_noise_frac=0.8,
        negative_prompt="disfigured, ugly, deformed",
    ):
        import torch
        import time

        if seed is None:
            seed = int(time.time())

        generator = torch.manual_seed(seed)
        image = self.base(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_inference_steps=steps,
            denoising_end=high_noise_frac,
            output_type="latent",
            generator=generator,
        ).images
        image = self.refiner(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_inference_steps=steps,
            denoising_start=high_noise_frac,
            image=image,
            generator=generator,
        ).images[0]

        import io

        byte_stream = io.BytesIO()
        image.save(byte_stream, format="PNG")
        image_bytes = byte_stream.getvalue()
        url = upload_to_imgur(image_bytes)

        return [url]
