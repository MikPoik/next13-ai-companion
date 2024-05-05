// filename: scripts/update_companion_tags.ts


async function updateCompanionTags(companionId) {
    const { PrismaClient } = require('@prisma/client');

    const db = new PrismaClient();
    try {
        const tagsToUpdate = [{ name: 'Romance' }];

        // Update companion to add Sci-Fi and Adventure tags.
        // `connectOrCreate` is used to connect the tags by "name" if they already exist,
        // or create them if they do not.
        const updatedCompanion = await db.companion.update({
            where: { id: companionId },
            data: {
                tags: {
                    connectOrCreate: tagsToUpdate.map(tag => ({
                        where: { name: tag.name },
                        create: tag,
                    })),
                },
            },
            include: {
                tags: true, // Include the updated list of tags in the response
            },
        });

        console.log('Companion updated with new tags:', updatedCompanion);
    } catch (error) {
        console.error('Error updating companion tags:', error);
    } finally {
        await db.$disconnect();
    }
}

// Replace 'your-companion-id' with the actual ID of the companion you want to update.
const companionId = 'de46919d-1325-4e91-8c70-507af16029fc';
updateCompanionTags(companionId);