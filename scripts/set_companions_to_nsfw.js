

async function setCompanionsToNSFW() {
    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient();

    const companions = await db.companion.findMany();

    for (const companion of companions) {
        await db.companion.update({
            where: {
                public: true,
                id: companion.id,
            },
            data: {
                nsfw: true,
            },
        });
        console.log(`Companion ${companion.id} updated to NSFW`);
    }

    console.log('Updating companions to NSFW complete');

    await db.$disconnect();
}

setCompanionsToNSFW()
    .catch((error) => {
        console.error('Error updating companions to NSFW:', error);
    });