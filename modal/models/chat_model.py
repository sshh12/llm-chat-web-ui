from abc import ABC, abstractmethod
from typing import List, Dict, Any
from pydantic import BaseModel


class Message(BaseModel):
    role: str
    content: str


class ChatModelDescription(BaseModel):
    cls: Any
    cfg: Dict
    key: str


class ChatModel(ABC):
    def __init__(self, cfg: Dict):
        pass

    @abstractmethod
    def generate(self, chat: List[Message]):
        pass

    @classmethod
    def get_models(cls) -> List[ChatModelDescription]:
        return []
