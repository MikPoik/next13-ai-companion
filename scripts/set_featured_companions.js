async function setFeaturedCompanions() {
    const { PrismaClient } = require('@prisma/client');
    const prismadb = new PrismaClient();

    // Step 1: Set all companions' featured column to false
    await prismadb.companion.updateMany({
        data: {
            featured: false
        }
    });
    // Step 2: List of companion names to be featured
    const featuredCompanions = ["de46919d-1325-4e91-8c70-507af16029fc","id2-2342-324"];
    // Step 3: Iterate and update featured column to true for each given name
    await Promise.all(featuredCompanions.map(async (name) => {
        await prismadb.companion.updateMany({
            where: {
                id: name
            },
            data: {
                featured: true
            }
        });
    }));
    // Step 4: Log the completion
    console.log('Updated featured companions');
    // Ensure proper disconnection from the database
    await prismadb.$disconnect();
}
// Execute the function
setFeaturedCompanions().catch((error) => {
    console.error("Error updating featured companions:", error);
    process.exit(1);
});