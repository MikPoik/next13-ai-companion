// filename: scripts/updateCompanionMessageCount.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateCompanionMessageCount() {
  try {
    // Get all companions with their message counts
    const companions = await prisma.companion.findMany({
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });

    console.log(`Found ${companions.length} companions to update.`);

    // Update each companion's messageCount
    for (const companion of companions) {
      await prisma.companion.update({
        where: { id: companion.id },
        data: { messageCount: companion._count.messages }
      });

      console.log(`Updated companion ${companion.id} with message count: ${companion._count.messages}`);
    }

    console.log('All companions updated successfully.');
  } catch (error) {
    console.error('Error updating companion message counts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCompanionMessageCount();