const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  const { apiKey } = event.queryStringParameters;
  if (!apiKey || apiKey === "null")
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          isGuest: true,
        },
        (_key, value) => (typeof value === "bigint" ? value.toString() : value)
      ),
    };
  const user = await prisma.user.findFirst({
    where: { apiKey: apiKey },
    include: { chats: true },
  });
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        name: user.name,
        chats: user.chats,
        chatSettings: user.chatSettings,
        isGuest: false,
      },
      (_key, value) => (typeof value === "bigint" ? value.toString() : value)
    ),
  };
};
