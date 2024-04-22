from typing import Dict, List
import wolframalpha
import requests
import os

TOOLS = {}


def as_tool(name: str, desc: str, schema: Dict):
    def wrap(func):
        def wrapper(**kwargs):
            return func(**kwargs)

        TOOLS[name] = (wrapper, name, desc, schema)
        return func

    return wrap


@as_tool(
    "search",
    "useful for when you need to find up to date information about general things, names, usernames, places, etc. the input should be a search term",
    {
        "type": "object",
        "properties": {
            "query": {"type": "string"},
        },
        "required": ["query"],
    },
)
def search(query: str, k: int = 10):
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


@as_tool(
    "query_wolframalpha",
    "useful for facts, math, complex equations, and other things that wolfram alpha can answer",
    {
        "type": "object",
        "properties": {
            "query": {"type": "string"},
        },
        "required": ["query"],
    },
)
def query_wolframalpha(query: str):

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


@as_tool(
    "generate_image",
    "Generates an image given a prompt like 'an oil painting of a beach, award winning', render the result in markdown",
    {
        "type": "object",
        "properties": {
            "prompt": {
                "type": "string",
                "description": "The prompt to use to generate the image, e.g. 'a cartoon of ..., in the style ..., 4k'",
            },
        },
        "required": ["prompt"],
    },
)
def generate_image(prompt: str):
    from models.chat_dalle import generate_image

    return generate_image(prompt)


def get_openai_tools() -> List:
    return [
        {
            "name": name,
            "description": desc,
            "parameters": schema,
        }
        for _, (_, name, desc, schema) in TOOLS.items()
    ]


def call_tool(name: str, args: Dict) -> str:
    print(f"Running function {name} with {args}")
    output = str(TOOLS[name][0](**args))
    print("->", output)
    return output
