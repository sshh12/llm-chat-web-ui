from typing import List
import modal

from modal_base import image_base, stub, Message
from image_generation import StableDiffusionModel


def search(query: str, k: int = 10):
    import requests
    import os

    headers = {
        "X-API-KEY": os.environ["SERPER_API_KEY"],
        "Content-Type": "application/json",
    }
    url = f"https://google.serper.dev/search"
    params = {"q": query, "gl": "us", "hl": "en", "k": 10}
    results = requests.get(url, params=params, headers=headers).json()

    snippets = []

    if results.get("answerBox"):
        answer_box = results.get("answerBox", {})
        if answer_box.get("answer"):
            return answer_box.get("answer")
        elif answer_box.get("snippet"):
            return answer_box.get("snippet").replace("\n", " ")
        elif answer_box.get("snippetHighlighted"):
            return ", ".join(answer_box.get("snippetHighlighted"))

    if results.get("knowledgeGraph"):
        kg = results.get("knowledgeGraph", {})
        title = kg.get("title")
        entity_type = kg.get("type")
        if entity_type:
            snippets.append(f"{title}: {entity_type}.")
        description = kg.get("description")
        if description:
            snippets.append(description)
        for attribute, value in kg.get("attributes", {}).items():
            snippets.append(f"{title} {attribute}: {value}.")

    for result in results["organic"][:k]:
        if "snippet" in result:
            snippets.append(
                f'{result["title"]}: {result["snippet"]} (link {result["link"]})'
            )
        for attribute, value in result.get("attributes", {}).items():
            snippets.append(f'{result["title"]}: {attribute} = {value}.')

    if len(snippets) == 0:
        return "No good results found"

    return "\n\n".join(snippets)


def run_wolframalpha(query: str):
    import wolframalpha
    import os

    client = wolframalpha.Client(os.environ["WOLFRAM_ALPHA_APPID"])

    res = client.query(query)

    try:
        assumption = next(res.pods).text
        answer = next(res.results).text
    except StopIteration:
        return "Wolfram Alpha wasn't able to answer it"

    if answer is None or answer == "":
        # We don't want to return the assumption alone if answer is empty
        return "No good Wolfram Alpha Result was found"
    else:
        return f"Assumption: {assumption} \nAnswer: {answer}"


def generate_image(prompt: str):
    return repr(StableDiffusionModel.inference.remote(prompt))


FUNCTIONS = [
    (
        {
            "name": "search",
            "description": "useful for when you need to find information about general things, names, usernames, places, etc. the input should be a search term",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                },
                "required": ["query"],
            },
        },
        search,
    ),
    (
        {
            "name": "wolframalpha",
            "description": "useful for facts, math, and other things that wolfram alpha can answer",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                },
                "required": ["query"],
            },
        },
        run_wolframalpha,
    ),
    (
        {
            "name": "generate_image",
            "description": "useful for facts, math, and other things that wolfram alpha can answer",
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt": {
                        "type": "string",
                        "description": "The prompt to use to generate the image, e.g. 'a cartoon of ..., in the style ..., 4k'",
                    },
                },
                "required": ["prompt"],
            },
        },
        generate_image,
    ),
]


@stub.cls(
    image=image_base.pip_install("wolframalpha==5.0.0", "requests"),
    secret=modal.Secret.from_name("llm-chat-secret"),
)
class OpenAIFunctionsAPIModel:
    def __init__(self, model: str, temperature: float, system_prompt: str):
        self.model = model
        self.temperature = temperature
        self.system_prompt = system_prompt

    @modal.method()
    def generate(self, chat: List[Message]):
        import openai
        import json

        args = dict(
            model=self.model,
            temperature=self.temperature,
            functions=[f[0] for f in FUNCTIONS],
        )
        print(args)

        cur_messages = list(
            [dict(role="system", content=self.system_prompt)]
            + [dict(role=m.role, content=m.content) for m in chat]
        )

        while True:
            resp = openai.ChatCompletion.create(messages=cur_messages, **args)
            if function_call := resp["choices"][0]["message"].get("function_call"):
                func_args = json.loads(function_call["arguments"])
                func = [
                    f[1] for f in FUNCTIONS if f[0]["name"] == function_call["name"]
                ][0]
                result = func(**func_args)
                print(function_call["name"], "->", result)
                cur_messages.append(resp["choices"][0]["message"])
                cur_messages.append(
                    dict(role="function", content=result, name=function_call["name"])
                )
                yield json.dumps({"alert": f"Using {function_call['name']}"}) + "\n"
            else:
                break

        yield json.dumps({"content": resp["choices"][0]["message"]["content"]}) + "\n"
