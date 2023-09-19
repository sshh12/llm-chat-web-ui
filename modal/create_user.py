import asyncio
import argparse
import random
from prisma import Prisma


def make_api_key():
    chars = "ABCDEFGHJKMNPQRSTUVWXY23456789"

    return "".join(random.choices(chars, k=16))


async def main(name):
    prisma = Prisma()
    await prisma.connect()

    user = await prisma.user.create(
        data={"name": name, "apiKey": make_api_key()},
    )
    print(user)

    await prisma.disconnect()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--name", type=str)
    args = parser.parse_args()
    asyncio.run(main(args.name))
