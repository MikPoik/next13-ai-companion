async function seedPhoneVoicesBolna() {
    const { PrismaClient } = require('@prisma/client');

    const db = new PrismaClient();
    try {
        await db.phoneVoice.createMany({
            data: [
                {
                    name: 'Olivia',
                    bolnaVoice: 'Olivia',
                    bolnaProvider: 'polly',
                    voice_id: 100,
                    bolnaPollyEngine: 'neural',
                    bolnaPollyLanguage: 'en-US'

                },
                {

                    name: 'Rachel',
                    voice_id: 101,
                    bolnaVoice: 'Rachel',
                    bolnaProvider: 'elevenlabs',
                    bolnaModel: 'eleven_multilingual_v2',
                    bolnaVoiceId: '21m00Tcm4TlvDq8ikWAM',
                    bolnaElevenlabTurbo: false
                }    


            ],
        });
    } catch (error) {
        console.error('Error seeding default voices:', error);
    } finally {
        await db.$disconnect();
    }
}

seedPhoneVoicesBolna();
