
async function updateInstanceHandles() {
  const { PrismaClient } = require('@prisma/client');



  const prisma = new PrismaClient();

  try {
    // Fetch all Companion records
    const companions = await prisma.companion.findMany();

    // Update the instanceHandle for each Companion
    for (const companion of companions) {
      // Remove "user_" from the userId
      console.log(companion.name)

      // Update the record in the database
      await prisma.companion.update({
        where: { id: companion.id },
        data: {
          voiceId: 'none',
          //workspaceName: updatedInstanceHandle //use only if instanceHandle update is not enough, users will lose chat history
        },
      });
    }

    console.log('Voices disabled successfully.');
  } catch (error) {
    console.error('Error updating instanceHandles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateInstanceHandles();