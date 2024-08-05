async function seedPhoneVoicesBolna() {
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();

  const defaultFemaleVoice  = "101"
  const defaultMaleVoice  = "102"
  const newVoices = [
    {
      id: "100",
      name: 'Olivia',
      bolnaVoice: 'Olivia',
      bolnaProvider: 'polly',
      voice_id: 100,
      bolnaPollyEngine: 'neural',
      bolnaPollyLanguage: 'en-US'
    },
    {
      id: "101",
      name: 'Rachel',
      voice_id: 101,
      bolnaVoice: 'Rachel',
      bolnaProvider: 'elevenlabs',
      bolnaModel: 'eleven_multilingual_v2',
      bolnaVoiceId: '21m00Tcm4TlvDq8ikWAM',
      bolnaElevenlabTurbo: false
    },
    {
      id: "102",
      name: 'Charlotte',
      voice_id: 102,
      bolnaVoice: 'Charlotte',
      bolnaProvider: 'elevenlabs',
      bolnaModel: 'eleven_multilingual_v2',
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

    // Fetch all companions with their tags
    const companions = await db.companion.findMany({
      include: {
        tags: true,
      },
    });

    for (const companion of companions) {
      for (const tag of companion.tags) {
        if (tag.name === 'male') {
          await db.companion.update({
            where: { id: companion.id },
            data: { phoneVoiceId: defaultMaleVoice },
          });
          console.log(`Updated companion ${companion.name} with voice_id: 102`);
        } else if (tag.name === 'woman') {
          await db.companion.update({
            where: { id: companion.id },
            data: { phoneVoiceId: defaultFemaleVoice },
          });
          console.log(`Updated companion ${companion.name} with voice_id: 101`);
        }
      }
    }

    console.log('Companion voices updated based on tags.');
  } catch (error) {
    console.error('Error seeding default voices:', error);
  } finally {
    await db.$disconnect();
  }
}

seedPhoneVoicesBolna();