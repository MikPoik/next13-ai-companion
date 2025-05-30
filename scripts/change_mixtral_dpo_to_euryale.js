async function updatePublicModel() {
    const { PrismaClient } = require('@prisma/client');

    const prisma = new PrismaClient();

    try {
        // Fetch all public Companion records with model "mixtral dpo"
        const companions = await prisma.companion.findMany({
            where: {
                isPublic: true,
                model: "NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO"
            }
        });

        // Update each companion's model to "zephyr-chat"
        for (const companion of companions) {
            await prisma.companion.update({
                where: { id: companion.id },
                data: { model: "Sao10K/L3.1-70B-Euryale-v2.2" }
            });

            console.log(`Updated ${companion.name}'s model to Euryale`);
        }

        console.log('Model updated successfully');
    } catch (error) {
        console.error('Error updating model:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updatePublicModel();