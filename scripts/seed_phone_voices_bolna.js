async function seedPhoneVoicesBolna() {
    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient();

    const newVoices = [
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
        },
        {
            name: 'Charlotte',
            voice_id: 102,
            bolnaVoice: 'Charlotte',
            bolnaProvider: 'elevenlabs',
            bolnaModel: 'eleven_turbo_v2',
            bolnaVoiceId: 'XB0fDUnXU5powFXDhCwa',
            bolnaElevenlabTurbo: true
        }
    ];

    try {
        // Fetch all existing voice IDs from the table
        const existingVoices = await db.phoneVoice.findMany({
            select: {
                voice_id: true,
            },
        });

        const existingVoiceIds = new Set(existingVoices.map(v => v.voice_id));

        // Filter new voices to exclude those already in the table
        const voicesToAdd = newVoices.filter(v => !existingVoiceIds.has(v.voice_id));

        if (voicesToAdd.length) {
            await db.phoneVoice.createMany({
                data: voicesToAdd,
            });
            console.log('Voices added successfully.');
        } else {
            console.log('No new voices to add.');
        }
    } catch (error) {
        console.error('Error seeding default voices:', error);
    } finally {
        await db.$disconnect();
    }
}

seedPhoneVoicesBolna();