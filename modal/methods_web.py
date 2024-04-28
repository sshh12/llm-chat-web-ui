from typing import Dict, List
from prisma import models
from fastapi import Response
from fastapi.responses import StreamingResponse
from ulid import ULID
import datetime
import json

from models.chat_model import Message
from models.chat_openai import OpenAIModel, OpenAIToolsModel, summarize_chat
from models.chat_dalle import OpenAIDalle
from models.chat_hf_inference import HFInferenceModel
import base64
import tts_tools
import context

METHODS = {}


def method_web(require_login: bool = True):
    def wrap(func):
        async def wrapper(ctx: context.Context, **kwargs):
            assert not require_login or ctx.user
            return await func(ctx, **kwargs)

        METHODS[func.__name__] = wrapper
        return func

    return wrap


MODELS = [
    *OpenAIModel.get_models(),
    *OpenAIDalle.get_models(),
    *OpenAIToolsModel.get_models(),
    *HFInferenceModel.get_models(),
]
BEST_MODEL_KEY = "OpenAI+Tools:gpt-4-turbo"


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
            {"role": message.role, "content": message.text} for message in chat.messages
        ]
    return val


def _user_to_dict(user: models.User) -> dict:
    return {
        "id": str(user.id),
        "name": user.name,
        "chatSettings": user.chatSettings,
        "chats": [_chat_to_dict(chat) for chat in user.chats],
        "models": [{"key": m.key} for m in MODELS],
    }


@method_web()
async def get_user(ctx: context.Context) -> Dict:
    resp = {**_user_to_dict(ctx.user)}
    return Response(content=json.dumps(resp), media_type="application/json")


@method_web(require_login=False)
async def get_chat(ctx: context.Context, id: str) -> Dict:
    chat = await ctx.prisma.chat.find_first(
        where={"id": id}, include={"messages": True, "user": True}
    )
    guest = ctx.user is None or ctx.user.id != chat.user.id
    assert (guest and chat.public) or ctx.user.id == chat.user.id
    resp = {**_chat_to_dict(chat), "isGuest": guest}
    return Response(content=json.dumps(resp), media_type="application/json")


@method_web()
async def stream_chat(
    ctx: context.Context, id: str, messages: List[Dict], settings: Dict
) -> Dict:
    if id:
        chat = await ctx.prisma.chat.find_first(
            where={"id": id}, include={"messages": True, "user": True}
        )
        assert chat and ctx.user.id == chat.user.id
    msgs = [Message(**m) for m in messages]

    settings.setdefault("modelKey", BEST_MODEL_KEY)
    settings["systemPrompt"] = (
        settings["systemPrompt"]
        .replace(
            "{{ datetime }}", datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        .replace("{{ name }}", ctx.user.name)
    )
    model = [m for m in MODELS if m.key == settings["modelKey"]][0]
    settings.update(model.cfg)
    model = model.cls(settings)
    return StreamingResponse(model.generate(msgs), media_type="text/event-stream")


@method_web()
async def stream_chat_audio(
    ctx: context.Context, messages: List[Dict], settings: Dict
) -> Dict:
    msgs = [Message(**m) for m in messages]

    settings["systemPrompt"] = (
        f"You are a helpful voice assistant for {ctx.user.name}. Speak naturally and do not use markdown as your words will be encoded as audio. Speak briefly as if this was a real life conversation."
    )
    settings.setdefault("modelKey", BEST_MODEL_KEY)
    model = [m for m in MODELS if m.key == settings["modelKey"]][0]
    settings.update(model.cfg)
    model = model.cls(settings)

    meta = {"content": "", "alert": "", "state": "starting"}

    def generate_reply():
        for chunk in model.generate(msgs):
            meta["state"] = "model-decoding"
            chunk_data = json.loads(chunk.strip())
            append_content = chunk_data.get("append:content", "")
            meta["content"] += append_content
            yield append_content
            alert = chunk_data.get("alert")
            if alert:
                meta["alert"] = alert
        meta["state"] = "model-complete"

    def stream_with_meta():
        audio_stream = tts_tools.stream_audio(
            generate_reply(),
            voice="7iELKknajFrchQm92EYX",
            model="eleven_multilingual_v2",
        )
        for chunk in audio_stream:
            yield json.dumps({"audio": base64.b64encode(chunk).decode(), **meta}) + "\n"

    return StreamingResponse(stream_with_meta(), media_type="text/event-stream")


@method_web()
async def update_chat_messages(
    ctx: context.Context, id: str, messages: List[Dict], settings: Dict
) -> Dict:
    if not id:
        new_id = str(ULID())
        name = summarize_chat(messages)
        chat = await ctx.prisma.chat.create(
            {
                "user": {"connect": {"id": ctx.user.id}},
                "chatSettings": json.dumps(settings),
                "id": new_id,
                "name": name,
            }
        )
        await ctx.prisma.message.create_many(
            [
                {"chatId": chat.id, "role": m["role"], "text": m["content"]}
                for m in messages
            ]
        )
        return await get_chat(ctx, new_id)
    else:
        chat = await ctx.prisma.chat.find_first(
            where={"id": id}, include={"user": True}
        )
        assert chat.user.id == ctx.user.id
        await ctx.prisma.message.delete_many(where={"chatId": id})
        await ctx.prisma.message.create_many(
            [{"chatId": id, "role": m["role"], "text": m["content"]} for m in messages]
        )
        return await get_chat(ctx, id)


@method_web()
async def update_chat_settings(ctx: context.Context, id: str, settings: Dict) -> Dict:
    if not id:
        Response(content=json.dumps({}), media_type="application/json")
    else:
        chat = await ctx.prisma.chat.find_first(
            where={"id": id}, include={"user": True}
        )
        assert chat.user.id == ctx.user.id
        await ctx.prisma.chat.update(
            where={"id": id}, data={"chatSettings": json.dumps(settings)}
        )
        return await get_chat(ctx, id)


@method_web()
async def update_user_settings(ctx: context.Context, settings: Dict) -> Dict:
    await ctx.prisma.user.update(
        where={"id": ctx.user.id}, data={"chatSettings": json.dumps(settings)}
    )
    resp = {**_user_to_dict(ctx.user), "chatSettings": settings}
    return Response(content=json.dumps(resp), media_type="application/json")


@method_web()
async def update_chat_public(ctx: context.Context, id: str, public: bool) -> Dict:
    chat = await ctx.prisma.chat.find_first(where={"id": id}, include={"user": True})
    assert chat.user.id == ctx.user.id
    await ctx.prisma.chat.update(where={"id": id}, data={"public": public})
    return await get_chat(ctx, id)


@method_web()
async def delete_chat(ctx: context.Context, id: str) -> Dict:
    chat = await ctx.prisma.chat.find_first(where={"id": id}, include={"user": True})
    assert chat.user.id == ctx.user.id
    await ctx.prisma.message.delete_many(where={"chatId": id})
    await ctx.prisma.chat.delete(where={"id": id})
    return Response(content=json.dumps({}), media_type="application/json")
