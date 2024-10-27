async function updatePublicModel() {
    const { PrismaClient } = require('@prisma/client');

    const prisma = new PrismaClient();

    try {
        // Fetch all public Companion records with model "mixtral dpo"
        const companions = await prisma.companion.findMany({
            where: {
                isPublic: true,
                nsfw: false,
                model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
            }
        });

        // Update each companion's model to "zephyr-chat"
        for (const companion of companions) {
            await prisma.companion.update({
                where: { id: companion.id },
                data: { model: "meta-llama/Meta-Llama-3.1-70B-Instruct" }
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