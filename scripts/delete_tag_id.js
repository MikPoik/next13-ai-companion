
async function deleteCompanionTags(companionId) {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    // Assuming there's an implicit relation table for Companion and Tag, we need to disconnect the tags
    // from the specified companion. This does not delete the tag itself, just the relation.
    await prisma.companion.update({
      where: { id: companionId },
      data: {
        tags: {
          set: [],  // This removes all tags associated with the companion
        },
      },
    });
    console.log('Companion tags deleted successfully.');
  } catch (error) {
    console.error('Failed to delete companion tags:', error);
  } finally {
    await prisma.$disconnect();
  }
}
// Replace with the actual companion ID you want to remove tags from
const companionId = '5a593333-9ed8-45c5-af91-273892cdb76c';
deleteCompanionTags(companionId);