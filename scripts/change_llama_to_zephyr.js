    async function updatePublicModel() {
      const { PrismaClient } = require('@prisma/client');

      const prisma = new PrismaClient();

      try {
        // Fetch all public Companion records with model "llama-hermes-13b"
        const companions = await prisma.companion.findMany({
          where: {
            isPublic: true,
            model: "NousResearch/Nous-Hermes-Llama2-13b"
          }
        });

        // Update each companion's model to "zephyr-chat"
        for (const companion of companions) {
          await prisma.companion.update({
            where: { id: companion.id },
            data: { model: "zephyr-chat" }
          });

          console.log(`Updated ${companion.name}'s model to zephyr-chat`);
        }

        console.log('Model updated successfully');
      } catch (error) {
        console.error('Error updating model:', error);
      } finally {
        await prisma.$disconnect();
      }
    }

    updatePublicModel();