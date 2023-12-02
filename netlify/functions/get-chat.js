const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  const { apiKey, chatId } = event.queryStringParameters;
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
  if (chat.user.apiKey !== apiKey && !chat.public)
    return { statusCode: 403, body: "Not authorized" };
  const isGuest = chat.user.apiKey !== apiKey;
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        id: chat.id,
        name: chat.name,
        messages: chat.messages,
        chatSettings: chat.chatSettings,
        createdAt: chat.createdAt,
        public: chat.public,
        isGuest: isGuest,
      },
      (_key, value) => (typeof value === "bigint" ? value.toString() : value)
    ),
  };
};
