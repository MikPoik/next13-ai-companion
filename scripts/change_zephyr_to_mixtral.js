async function updatePublicModel() {
  const { PrismaClient } = require('@prisma/client');

  const prisma = new PrismaClient();

  try {
    // Fetch all public Companion records with model "llama-hermes-13b"
    const companions = await prisma.companion.findMany({
      where: {
        isPublic: true,
        model: "zephyr-chat"
      }
    });

    // Update each companion's model to "zephyr-chat"
    for (const companion of companions) {
      await prisma.companion.update({
        where: { id: companion.id },
        data: { model: "NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO" }
      });

      console.log(`Updated ${companion.name}'s model to mixtral`);
    }

    console.log('Model updated successfully');
  } catch (error) {
    console.error('Error updating model:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePublicModel();