const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  const { apiKey, chatSettings } = JSON.parse(event.body);
  if (!apiKey) return { statusCode: 400, body: "No API key provided" };
  const user = await prisma.user.findFirst({
    where: { apiKey: apiKey },
  });
  if (chatSettings) {
    await prisma.user.update({
      where: { id: user.id },
      data: { chatSettings: chatSettings },
    });
  }
  return {
    statusCode: 200,
    body: JSON.stringify(
      { name: user.name, chatSettings: user.chatSettings },
      (_key, value) => (typeof value === "bigint" ? value.toString() : value)
    ),
  };
};
