from typing import Dict
from prisma import models
from fastapi import Response
from fastapi.responses import StreamingResponse
import json

import context

METHODS = {}


def method_web():
    def wrap(func):
        async def wrapper(ctx: context.Context, **kwargs):
            if not ctx.user:
                return {"error": "Not logged in"}
            return await func(ctx, **kwargs)

        METHODS[func.__name__] = wrapper

    return wrap


"""
id: _str
    name: _str
    messages: Optional[List['models.Message']] = None
    public: _bool
    chatSettings: Optional['fields.Json'] = None
"""


def _chat_to_dict(chat: models.Chat) -> dict:
    val = {
        "id": str(chat.id),
        "name": chat.name,
        "public": chat.public,
        "chatSettings": chat.chatSettings,
        "messages": None,
        "createdAt": int(chat.createdAt.timestamp() * 1000),
    }
    if chat.messages:
        val["messages"] = [
            {"role": message.role, "text": message.text} for message in chat.messages
        ]
    return val


def _user_to_dict(user: models.User) -> dict:
    return {
        "id": str(user.id),
        "name": user.name,
        "chatSettings": user.chatSettings,
        "chats": [_chat_to_dict(chat) for chat in user.chats],
    }


@method_web()
async def get_user(ctx: context.Context) -> Dict:
    resp = {**_user_to_dict(ctx.user)}
    return Response(content=json.dumps(resp), media_type="application/json")


@method_web()
async def get_chat(ctx: context.Context, id: str) -> Dict:
    chat = await ctx.prisma.chat.find_first(
        where={"id": id}, include={"messages": True, "user": True}
    )
    guest = ctx.user.id != chat.user.id
    if guest and not chat.public:
        return {"error": "Chat is private"}
    resp = {**_chat_to_dict(chat), "isGuest": guest}
    return Response(content=json.dumps(resp), media_type="application/json")
