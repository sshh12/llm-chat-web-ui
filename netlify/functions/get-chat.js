const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  const { apiKey, chatId } = event.queryStringParameters;
  if (!apiKey) return { statusCode: 400, body: "No API key provided" };
  if (!chatId || chatId === "null") {
    return {
      statusCode: 200,
      body: JSON.stringify({ id: null, name: null, messages: [] }),
    };
  }
  const chat = await prisma.chat.findFirst({
    where: { id: chatId },
    include: { messages: true },
  });
  return {
    statusCode: 200,
    body: JSON.stringify(
      { id: chat.id, name: chat.name, messages: chat.messages },
      (_key, value) => (typeof value === "bigint" ? value.toString() : value)
    ),
  };
};
