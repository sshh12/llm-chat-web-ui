const { PrismaClient } = require("@prisma/client");
const OpenAI = require("openai");
const { ulid } = require("ulid");

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const getChatTitle = async (messages) => {
  const llmResult = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: "Summarize the following into a very short title",
      },
      {
        role: "user",
        content: JSON.stringify(messages).substring(0, 5000),
      },
    ],
  });
  return llmResult.choices[0].message.content;
};

exports.handler = async (event, context) => {
  const {
    apiKey,
    id,
    messages,
    chatSettings,
    doDelete,
    public: isPublic,
  } = JSON.parse(event.body);
  if (!apiKey) return { statusCode: 400, body: "No API key provided" };
  const user = await prisma.user.findFirst({
    where: { apiKey: apiKey },
  });
  let chat;
  let chatMessages = messages;
  if (id === null) {
    chat = await prisma.chat.create({
      data: {
        id: ulid(),
        name: "",
        userId: user.id,
        chatSettings: chatSettings,
      },
    });
    await prisma.message.createMany({
      data: messages.map((message) => ({
        role: message.role,
        text: message.text,
        chatId: chat.id,
      })),
    });
  } else {
    chat = await prisma.chat.findFirst({
      where: { id },
      include: { user: true, messages: true },
    });
    if (chat.user.apiKey !== apiKey) {
      return { statusCode: 403, body: "Not authorized" };
    }
    if (doDelete) {
      await prisma.message.deleteMany({
        where: { chatId: id },
      });
      await prisma.chat.delete({
        where: { id },
      });
    } else {
      const newData = {};
      if (chatSettings) {
        newData.chatSettings = chatSettings;
      }
      if (isPublic) {
        newData.public = isPublic;
      }
      if (newData) {
        await prisma.chat.update({
          where: { id },
          data: newData,
        });
      }
      if (messages) {
        await prisma.message.deleteMany({
          where: { chatId: id },
        });
        await prisma.message.createMany({
          data: messages.map((message) => ({
            role: message.role,
            text: message.text,
            chatId: chat.id,
          })),
        });
        if (messages.length === 2) {
          const newName = await getChatTitle(messages);
          await prisma.chat.update({
            where: { id },
            data: { name: newName },
          });
          chat.name = newName;
        }
      }
    }
  }
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        id: chat.id,
        name: chat.name,
        messages: chatMessages,
        chatSettings: chat.chatSettings,
        createdAt: chat.createdAt,
        public: chat.public,
      },
      (_key, value) => (typeof value === "bigint" ? value.toString() : value)
    ),
  };
};
