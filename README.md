# LLM Chat

> LLM Chat is an open-source serverless alternative to ChatGPT.

## Design Goals

There are plenty of open source alternatives like [chatwithgpt.ai](https://www.chatwithgpt.ai/). The goal of this particular project was to make a version that:

- Supports plugins
- Supports open source LLMs
- Is completely pay-per-use ($0/mo if unused)
- Runs as a [progressive web app](https://web.dev/progressive-web-apps/)
- Has no automatic log out

This comes at the cost of:

- Being less secure and more buggy
- Requiring 3 cloud accounts to host (netlify, cockroachlabs, modal)

## Demo

![ezgif-5-0f5b8fee49](https://github.com/sshh12/llm-chat-web-ui/assets/6625384/466af14d-227f-49bb-9b20-7670716fb606)

## Features

- Easy to add arbitrary plugins/functions/agents
- Easy to add hugging face open source transformers
- OpenAI API streaming
- Image generation (StableDiffusion XL, DALLE)
- Automatic chat title generation
- Sharable links (when you make a chat public)

## Setup

At a high level:

- Netlify is used for cheap cloud functions and static hosting
- Cockroach labs is used for cheap persistent storage
- Modal is used for long-running functions and serverless GPU functions (**this is the only thing that is not free**)

1. Fork this repo
2. Create a postgres database on [cockroachlabs](https://www.cockroachlabs.com/) (free)
3. Create a [netlify](https://www.netlify.com/) app and connect it to your fork (free)
4. Add netlify env vars

```
DATABASE_URL (from cockroachlabs)
OPENAI_API_KEY (from openai)
```

6. Create a [modal](https://modal.com/) account
7. On modal create `llm-chat-secret`

```
# Required
DATABASE_URL (from cockroachlabs)
HUGGING_FACE_HUB_TOKEN (from huggingface)
OPENAI_API_KEY (from openai)

# Semi Optional
SERPER_API_KEY (from https://serper.dev/)
IMGUR_CLIENT_ID (from imgur, required for image generation)
WOLFRAM_ALPHA_APPID (https://developer.wolframalpha.com/)
```

8. Deploy modal `cd modal && modal deploy modalapp`
9. Create an API key `cd modal && python create_user.py --name "John Smith"`
10. Go to `<netlify site>/?key=<API key>`

## Advanced

### Add a new plugin

_Note that plugins are only supported for openai functions agents._

Just add a new function to `FUNCTIONS` in `modal/chat_openai_functions.py`.

### Add a new model

1. Duplicate `modal/chat_vllm_hf.py` and adjust to whatever model you want
2. Update `modal/modalapp.py` to check for this `model_namespace` in `generate` (then deploy modal)
3. Update `SettingsDialog.js` to include this new model name (then deploy netlify)
