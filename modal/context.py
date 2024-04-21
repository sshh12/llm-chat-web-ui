from prisma import Prisma, models


async def fetch_user(prisma: Prisma, api_key: str) -> models.User:
    user = await prisma.user.find_first(
        where={"apiKey": api_key}, include={"chats": True}
    )
    return user


class Context:
    def __init__(self, prisma: Prisma, api_key: str):
        self.api_key = api_key
        self.prisma = prisma

    async def __aenter__(self):
        self.user = await fetch_user(self.prisma, self.api_key)
        return self

    async def __aexit__(self, exc_type, exc, tb):
        if exc:
            raise exc
