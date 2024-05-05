
async function migrateCategoryToTag() {
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();
  // Define the mapping of category IDs to Tag names
  const categoriesToTags = {
    '5bc8e092-540a-4da2-8341-b4831935b569': 'Non-Binary',
    '66739936-b87e-408b-a2c5-7e8e67e321c3': 'Men',
    '8b98b20a-76cd-44f8-ba79-f47437c3cb88': 'Women',
  };
  // Fetch all companions
  try {
    const companions = await db.companion.findMany();
    for (const companion of companions) {
      const tagName = categoriesToTags[companion.categoryId];
        if (tagName) {
          // Check if the tag already exists, if not create it
          let tag = await db.tag.findUnique({
            where: { name: tagName },
          });
          if (!tag) {
            tag = await db.tag.create({
              data: { name: tagName },
            });
          }
          // Correctly link the companion to the new tag using `connect`
          await db.companion.update({
            where: {
              id: companion.id,
            },
            data: {
              tags: {
                connect: {
                  id: tag.id,
                },
              },
            },
          });
          console.log(`Companion ${companion.id} linked to tag ${tagName}`);
        }
  
    }
    console.log('Migration complete');  
  } catch (error) {
      console.error('Error migrating tags:', error);
  } finally {
      await db.$disconnect();
  }
}
migrateCategoryToTag()