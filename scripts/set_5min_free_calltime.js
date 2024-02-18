async function updateCallTime5min() {
  const { PrismaClient } = require('@prisma/client');

  const prisma = new PrismaClient();

      try {
        // Fetch all UserBalance records with callTime equal to 0
        const userBalances = await prisma.userBalance.findMany({
          where: {
            callTime: 0
          }
        });
        // Update each UserBalance record's callTime to 300 seconds
        for (const userBalance of userBalances) {
          await prisma.userBalance.update({
            where: { id: userBalance.id },
            data: { callTime: 300 }
          });
          console.log(`Updated userBalance for user with ID: ${userBalance.userId}, set callTime to 300 seconds.`);
        }
        console.log('Call times updated successfully');
      } catch (error) {
        console.error('Error updating call times:', error);
      } finally {
        await prisma.$disconnect();
      }
}

updateCallTime5min();