//Create characters to DB

async function createCompanion() {
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();

  try {

    await db.companion.createMany({
      data: [
        {
          
          userId: '', //(user id who created bot) Should be Clerk userId
          userName: '', //user name of creator
          personality: '', //personality
          behaviour: '', //personality
          seed: '', //first introduction message text
          name: 'Nametest2', //Name for the bot
          description: 'desctest2', //Bot description
          selfiePre: '', //image prompt
          selfiePost: '', //image prompt
          instanceHandle:'',//steamship instanceHandle
          packageName:'',//steamship package name
          workspaceName:'',//steamship workspace name
          model:'',//llm model
          src: 'https://res.cloudinary.com/ddlwoj8gd/image/upload/*.png', //image url, can be cloudinary or any service url
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
