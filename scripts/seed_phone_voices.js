async function seedPhoneVoices() {
    const { PrismaClient } = require('@prisma/client');

    const db = new PrismaClient();
    try {
        await db.phoneVoice.createMany({
            data: [
                {
                    id: 'none',
                    name: 'none',
                    voice_id: 999
                },
                {
                    name: 'Matt',
                    voice_id: 0,
                    reduceLatency: true
                },
                {
                    name: 'Sophie',
                    voice_id: 1,
                    reduceLatency: true
                },
                {
                    name: 'Jen',
                    voice_id: 2,
                }
            ],
        });
    } catch (error) {
        console.error('Error seeding default voices:', error);
    } finally {
        await db.$disconnect();
    }
}

seedPhoneVoices();
