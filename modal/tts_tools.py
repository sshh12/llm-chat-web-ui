from typing import Generator
import os
import functools

from elevenlabs.client import ElevenLabs
from elevenlabs import stream


@functools.lru_cache(maxsize=1)
def get_eleven_client():
    return ElevenLabs(api_key=os.environ["ELEVEN_API_KEY"])


def stream_audio(text_stream: Generator, voice: str, model: str) -> Generator:
    client = get_eleven_client()
    audio_stream = client.generate(
        text=text_stream, voice=voice, model=model, stream=True
    )
    return audio_stream
