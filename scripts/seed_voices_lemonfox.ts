async function seedLemonfoxVoices() {
  const { PrismaClient } = require('@prisma/client');

  const db = new PrismaClient();
  try {
    await db.voice.createMany({
      data: [
        {
          id: 'mia',
          name: 'Mia',
          voice_id: 'mia',
          sample_url: 'https://api.steamship.com/api/v1/block/99727F63-0B88-4358-ABD3-5483949A3DC5/raw'
        },
        {
          id: 'ava',
          name: 'Ava',
          voice_id: 'ava',
          sample_url: 'https://api.steamship.com/api/v1/block/1125D9B3-06E0-427B-B603-9BB8DD08C5E2/raw'
        },
        {
          id: 'zoe',
          name: 'Zoe',
          voice_id: 'zoe',
          sample_url: 'https://api.steamship.com/api/v1/block/2E0C87AE-AFE3-4FF5-B3DD-4068FC03AF4F/raw'
        },
        {
          id: 'leo',
          name: 'Leo',
          voice_id: 'leo',
          sample_url: 'https://api.steamship.com/api/v1/block/A9846309-9E48-4518-97D7-1CC39F3DDE98/raw'
        },
        {
          id: 'sam',
          name: 'Sam',
          voice_id: 'sam',
          sample_url: 'https://api.steamship.com/api/v1/block/C9AD86E7-92F6-465A-91EB-D3446746FEE2/raw'
        },
        {
          id: 'ben',
          name: 'Ben',
          voice_id: 'ben',
          sample_url: 'https://api.steamship.com/api/v1/block/0BC76742-6FA9-4FA4-9D24-6EE9ACC32C5D/raw'
        }
      ],
    });
  } catch (error) {
    console.error('Error seeding default voices:', error);
  } finally {
    await db.$disconnect();
  }
}

seedLemonfoxVoices();
