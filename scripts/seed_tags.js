// filename: scripts/seed_tags.ts


async function removeAllTagsFromCompanions() {
    const { PrismaClient } = require('@prisma/client');

    const db = new PrismaClient();
    try {
        // Fetch all companions to ensure we only attempt to update those with tags
        const companionsWithTags = await db.companion.findMany({
            where: {
                tags: {
                    some: {}, // This condition finds companions with one or more tags
                },
            },
            select: {
                id: true, // We only need the id for the update operation
            },
        });
        // Generate an array of promises, each updating a companion to disconnect all tags
        const updatePromises = companionsWithTags.map(companion => 
            db.companion.update({
                where: { id: companion.id },
                data: { tags: { set: [] } }, // Disconnects all tags from the companion
            })
        );
        // Execute all update operations concurrently
        await Promise.all(updatePromises);
        console.log('All tags have been removed from companions.');
    } catch (error) {
        console.error('Failed to remove tags from companions:', error);
    } finally {
        await db.$disconnect();
    }
}
// Call the function to remove all tags from companions
removeAllTagsFromCompanions();

async function seedTags() {
    const { PrismaClient } = require('@prisma/client');

    const db = new PrismaClient();
    try {
        await db.tag.createMany({
            data: [
                { name: 'Non-Binary' },
                { name: 'Men' },
                { name: 'Women' },
                // Add more predefined tags here
            ],
            // This option skips records with conflicting unique constraints. Available in Prisma 2.26.0+
            skipDuplicates: true,
        });
        console.log('Tags have been successfully seeded');
    } catch (error) {
        console.error('Error seeding tags:', error);
    } finally {
        await db.$disconnect();
    }
}
removeAllTagsFromCompanions();
//seedTags();