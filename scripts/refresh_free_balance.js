

async function refreshFreeBalance() {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
        console.log('Starting balance refresh...'); // Added logging
        const updatedUsers = await prisma.userBalance.updateMany({
            where: {
                tokenLimit: 10000
            },
            data: {
                tokenCount: 0
            }
        });
        console.log(`Updated ${updatedUsers.count} users`);
    } catch (error) {
        console.error('Error updating user balances:', error);
    } finally {
        await prisma.$disconnect();
    }
}


refreshFreeBalance();