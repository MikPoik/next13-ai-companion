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
                {
                    name:'Paola',
                    voice_id: -1,
                    reduceLatency: false,
                    is_preset:true,
                    voice_preset:'caad7545-c58b-4b37-954c-27b93aed8dbd'
                },
                {   
                    id: '302df500-b53f-4e33-bcd7-1e06d06cebc5',
                    name:'Amilia',
                    voice_id: -1,
                    is_preset:true,
                    reduceLatency: false,
                    voice_preset:'a832ba3f-532d-47e1-97e8-a7b8c212dd98'
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
