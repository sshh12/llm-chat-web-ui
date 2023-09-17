const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// async function getChallenge() {
//   // await prisma.alchemyChallenge.deleteMany({});
//   const date = new Date().toISOString().slice(0, 10);
//   let challenge = await prisma.alchemyChallenge.findFirst({
//     where: { date: date },
//     include: { element: true },
//   });
//   if (!challenge) {
//     let elements = await prisma.alchemyElement.findMany({
//       include: {
//         recipes: true,
//         challenges: true,
//       },
//     });
//     elements = elements.filter(
//       (element) =>
//         element.recipes.length >= 10 && element.challenges.length === 0
//     );
//     const randomIndex = Math.floor(Math.random() * elements.length);
//     const randomElement = elements[randomIndex];
//     challenge = await prisma.alchemyChallenge.create({
//       data: { date: date, elementId: randomElement.id },
//     });
//   }
//   return challenge;
// }

exports.handler = async (event, context) => {
  // const { userId, allElements } = event.queryStringParameters;
  // if (!userId) {
  //   return {
  //     statusCode: 200,
  //     body: JSON.stringify({}),
  //   };
  // }
  // const [
  //   totalElements,
  //   totalRecipes,
  //   recentElements,
  //   userCreatedElements,
  //   challenge,
  //   credits,
  // ] = await Promise.all([
  //   prisma.AlchemyElement.count(),
  //   prisma.AlchemyRecipe.count(),
  //   allElements
  //     ? await prisma.AlchemyElement.findMany({})
  //     : prisma.AlchemyElement.findMany({
  //         orderBy: {
  //           createdAt: "desc",
  //         },
  //         take: 10,
  //       }),
  //   prisma.AlchemyElement.findMany({ where: { createdUserId: userId } }),
  //   getChallenge(),
  //   prisma.AlchemyCredits.upsert({
  //     where: { userId: userId },
  //     update: {},
  //     create: { userId: userId, credits: 25, email: "" },
  //   }),
  // ]);
  // const stats = {
  //   totalElements: totalElements,
  //   totalRecipes: totalRecipes,
  //   recentElementNames: recentElements.map((e) => e.name),
  //   userCreatedElements: userCreatedElements.map((e) => e.name),
  //   challengeElementName: challenge.element.name,
  //   credits: credits.credits,
  // };
  return {
    statusCode: 200,
    body: JSON.stringify(stats),
  };
};
