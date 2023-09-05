const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function seedCategories() {
  try {
    await db.category.createMany({
      data: [
        { id:'nsfw', name: 'NSFW'},
        { id:'other', name:'other'}

      ],
    });
  } catch (error) {
    console.error('Error seeding default categories:', error);
  } finally {
    await db.$disconnect();
  }
}

seedCategories();
