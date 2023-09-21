//Create characters to DB

async function createCompanion() {
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();

  try {

    await db.companion.createMany({
      data: [
        {
          
          userId: '', //(user id who created bot) Should be Clerk userId
          userName: '', //not needed (user name of creator)
          personality: '', //not needed (not needed with steamship backend)
          seed: '', //first introduction message text
          name: 'Nametest2', //Name for the bot
          description: 'desctest2', //Bot description
          src: 'https://res.cloudinary.com/ddlwoj8gd/image/upload/v1692613365/n7n1eg1ymgm6xmhuwlnw.png', //image url, can be cloudinary or any service url
          categoryId: 'nsfw' //Category to add, category must exist!
        }
      ],
    });
  } catch (error) {
    console.error('Error creating companion:', error);
  } finally {
    await db.$disconnect();
  }
}

createCompanion();
