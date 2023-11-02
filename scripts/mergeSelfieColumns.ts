async function mergeSelfieDBcolumns() {
    const { PrismaClient } = require('@prisma/client');

    const prisma = new PrismaClient();
    try {
        // get current companions
        const companions = await prisma.companion.findMany();

        // loop and update companions 
        // add content of "selfiePost" to "selfiePre" column if "selfiePre" does not contain "selfiePost"
        for (let companion of companions) {
            console.log("checking companion: " + companion.name)
            if (!companion.selfiePre.includes(companion.selfiePost)) {
                await prisma.companion.update({
                    where: { id: companion.id },
                    data: { selfiePre: `${companion.selfiePre}, ${companion.selfiePost}` },
                });
                console.log(`Updated companion ${companion.id} with selfiePre ${companion.selfiePre} and selfiePost ${companion.selfiePost}`);
            }
        }
        console.log('InstanceHandles updated successfully');
    } catch (error) {
        console.error('Error updating instanceHandles:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Call the function
mergeSelfieDBcolumns()