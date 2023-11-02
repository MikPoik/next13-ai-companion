// Import PrismaClient


async function mergeImageModelDBcolumns() {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
        const companions = await prisma.companion.findMany();

        for (let companion of companions) {
            console.log("checking: ", companion.name);
            var newImageModel = companion.imageModel;
            if (companion.imageModel.includes("realistic") || companion.imageModel.includes("anime")) {
                // identify imageModel and update it accordingly
                if (companion.imageModel === "realistic") {
                    newImageModel = "realistic-vision-v3";
                    console.log(`Updated companion ${companion.id} with image model ${companion.imageModel}`);
                } else if (companion.imageModel === "anime") {
                    newImageModel = "dark-sushi-mix-v2-25";
                    console.log(`Updated companion ${companion.id} with image model ${companion.imageModel}`);
                }
            }
            await prisma.companion.update({
                where: { id: companion.id },
                data: {
                    imageModel: newImageModel,
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

// Call the function
mergeImageModelDBcolumns()