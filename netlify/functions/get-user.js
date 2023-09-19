const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  const { apiKey } = event.queryStringParameters;
  if (!apiKey) return { statusCode: 400, body: "No API key provided" };
  const user = await prisma.user.findFirst({
    where: { apiKey: apiKey },
    include: { chats: true },
  });
  return {
    statusCode: 200,
    body: JSON.stringify(
      { name: user.name, chats: user.chats },
      (_key, value) => (typeof value === "bigint" ? value.toString() : value)
    ),
  };
};
