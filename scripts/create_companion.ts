const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

//Create characters to DB

async function main() {
  try {

    await db.companion.createMany({
      data: [
        { 
        userId:'', //not needed (user id who created bot)
        userName:'', //not needed (user name of creator)
        instructions:'', //not needed (not needed with steamship backend)
        seed:'', //first introduction message text
        name: 'Nametest1', //Name for the bot
        description: 'desctest1', //Bot description
        apiUrl:'url', //api url to call steamship package
        src:'https://res.cloudinary.com/ddlwoj8gd/image/upload/v1692613365/n7n1eg1ymgm6xmhuwlnw.png', //image url, can be cloudinary or any service
        categoryId:'nsfw' //Category to add, category must exist!
      }
      ],
    });
  } catch (error) {
    console.error('Error creating companion:', error);
  } finally {
    await db.$disconnect();
  }
}

main();
