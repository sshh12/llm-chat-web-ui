from pydantic import BaseModel
import modal

image_base = (
    modal.Image.debian_slim()
    .pip_install("openai~=1.3.7", "prisma==0.10.0")
    .apt_install("curl")
    .run_commands(
        "curl https://raw.githubusercontent.com/sshh12/llm-chat-web-ui/main/prisma/schema.prisma?42 > /root/schema.prisma",
        "prisma generate --schema /root/schema.prisma",
    )
)
stub = modal.Stub("llm-chat-web-ui")


class Message(BaseModel):
    role: str
    content: str
