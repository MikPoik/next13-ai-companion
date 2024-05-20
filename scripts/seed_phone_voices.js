async function seedPhoneVoices() {
    const { PrismaClient } = require('@prisma/client');

    const db = new PrismaClient();
    try {
        await db.phoneVoice.createMany({
            data: [
                {
                    name: 'maya',
                    voice_preset: 'maya',
                    voice_id: 0,
                    reduceLatency: false
                },
                {

                    name: 'ryan',
                    voice_preset: 'ryan',
                    voice_id: 1,
                    reduceLatency: true
                },
                {
                    name: 'mason',
                    voice_preset: 'mason',
                    voice_id: 2,
                    reduceLatency: false
                },
                {
                    name: 'tina',
                    voice_preset: 'tina',
                    voice_id: 3,
                    reduceLatency: false
                },
                {
                    name: 'matt',
                    voice_preset: 'matt',
                    voice_id: 4,
                    reduceLatency: false
                },
                {
                    name: 'evelyn',
                    voice_preset: 'evelyn',
                    voice_id: 5,
                    reduceLatency: false
                },
                {
                    name: 'matt',
                    voice_preset: 'matt',
                    voice_id: 6,
                    reduceLatency: false,
                    is_preset: false,

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
