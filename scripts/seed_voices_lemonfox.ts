async function seedDeepinfraVoices() {
  const { PrismaClient } = require('@prisma/client');

  const db = new PrismaClient();
  try {
    await db.voice.createMany({
      data: [
        {
          id: 'none',
          name: 'none',
          voice_id: 'none',
          sample_url: 'none'
        },
        {
          id: 'af_bella',
          name: 'Bella',
          voice_id: 'af_bella',
          sample_url: 'none'
        },
        {
          id: 'af_sarah',
          name: 'Sarah',
          voice_id: 'af_sarah',
          sample_url: 'none'
        },
        {
          id: 'am_michael',
          name: 'Michael',
          voice_id: 'am_michael',
          sample_url: ''
        },
        {
          id: 'am_adam',
          name: 'Adam',
          voice_id: 'am_adam',
          sample_url: 'none'
        },
        {
          id: 'am_eric',
          name: 'Eric',
          voice_id: 'am_eric',
          sample_url: 'none'
        }
      ],
    });
  } catch (error) {
    console.error('Error seeding default voices:', error);
  } finally {
    await db.$disconnect();
  }
}

seedDeepinfraVoices();
