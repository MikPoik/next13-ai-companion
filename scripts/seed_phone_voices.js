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
                    name: 'default (Jen)',
                    voice_id: 2,
                    reduceLatency: true
                },
                {
                    name: 'Grace',
                    voice_id: 0,
                    reduceLatency: false
                },
                {
                    name: 'Josh',
                    voice_id: 1,
                    reduceLatency: false
                },
                {
                    name: 'Dorothy',
                    voice_id: 2,
                    reduceLatency: false
                },
                {
                    name: 'Ravi',
                    voice_id: 3,
                    reduceLatency: false
                },

            ],
        });
    } catch (error) {
        console.error('Error seeding default voices:', error);
    } finally {
        await db.$disconnect();
    }
}

seedPhoneVoices();
