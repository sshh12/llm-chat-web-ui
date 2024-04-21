from abc import ABC, abstractmethod
from typing import List, Dict
from pydantic import BaseModel


class Message(BaseModel):
    role: str
    content: str


class ChatModel(ABC):
    def __init__(self, cfg: Dict):
        pass

    @abstractmethod
    def generate(self, chat: List[Message]):
        pass
