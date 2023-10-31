
async function mergePersonalityDBcolumns() {
    const { PrismaClient } = require('@prisma/client');

    const prisma = new PrismaClient();
    try {
        // get current companions
        const companions = await prisma.companion.findMany();

        // loop and update companions 
        // add content of "behaviour" column to "personality" column
        for (let companion of companions) {
            await prisma.companion.update({
                where: { id: companion.id },
                data: { personality: `${companion.personality}. ${companion.behaviour}` },
            });
            console.log(`Updated companion ${companion.id} with personality ${companion.personality} and behaviour ${companion.behaviour}`);
        }
        console.log('InstanceHandles updated successfully');
    } catch (error) {
        console.error('Error updating instanceHandles:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Call the function
mergePersonalityDBcolumns()