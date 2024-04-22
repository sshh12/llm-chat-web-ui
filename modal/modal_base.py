import modal

BASE_PACKAGES = [
    "openai~=1.3.7",
    "prisma==0.10.0",
    "boto3~=1.33.6",
    "Pillow~=10.1.0",
    "requests~=2.31.0",
    "python-ulid~=2.4.0",
    "wolframalpha==5.0.0",
]

image_base = (
    modal.Image.debian_slim()
    .pip_install(BASE_PACKAGES)
    .apt_install("curl")
    .run_commands(
        "curl https://raw.githubusercontent.com/sshh12/llm-chat-web-ui/main/prisma/schema.prisma?42 > /root/schema.prisma",
        "prisma generate --schema /root/schema.prisma",
    )
)
stub = modal.Stub("llm-chat-web-ui")
