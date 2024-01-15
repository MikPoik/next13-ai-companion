async function seedPhoneVoices() {
    const { PrismaClient } = require('@prisma/client');

    const db = new PrismaClient();
    try {
        await db.phoneVoice.createMany({
            data: [
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
                    id: 'default',
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
