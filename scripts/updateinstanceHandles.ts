
async function updateInstanceHandles() {
  const { PrismaClient } = require('@prisma/client');
  const { v4: uuidv4 } = require('uuid');


  const prisma = new PrismaClient();

  try {
    // Fetch all Companion records
    const companions = await prisma.companion.findMany();

    // Update the instanceHandle for each Companion
    for (const companion of companions) {
      // Remove "user_" from the userId
      console.log(companion.name)
      const userIdWithoutPrefix = companion.userId.replace('user_', '').toLowerCase();

      // Generate a random UUID and remove "-" characters
      const randomUuid = uuidv4().replace(/-/g, '').toLowerCase();

      // Update the instanceHandle by appending the modified userId and UUID
      const updatedInstanceHandle = `${userIdWithoutPrefix}-${randomUuid}`;

      // Update the record in the database
      await prisma.companion.update({
        where: { id: companion.id },
        data: {
          instanceHandle: updatedInstanceHandle,
          //workspaceName: updatedInstanceHandle //use only if instanceHandle update is not enough, users will lose chat history
        },
      });
    }

    console.log('InstanceHandles updated successfully');
  } catch (error) {
    console.error('Error updating instanceHandles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateInstanceHandles();