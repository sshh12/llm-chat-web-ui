const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  const { apiKey, chatId } = event.queryStringParameters;
  if (!apiKey) return { statusCode: 400, body: "No API key provided" };
  if (!chatId || chatId === "null") {
    return {
      statusCode: 200,
      body: JSON.stringify({
        id: null,
        name: null,
        messages: [],
        chatSettings: null,
      }),
    };
  }
  const chat = await prisma.chat.findFirst({
    where: { id: chatId },
    include: { messages: true, user: true },
  });
  if (chat.user.apiKey !== apiKey)
    return { statusCode: 403, body: "Not authorized" };
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        id: chat.id,
        name: chat.name,
        messages: chat.messages,
        chatSettings: chat.chatSettings,
        createdAt: chat.createdAt,
      },
      (_key, value) => (typeof value === "bigint" ? value.toString() : value)
    ),
  };
};
