async function seedPhoneVoicesBolna() {
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();

  const defaultFemaleVoice  = "101"
  const defaultMaleVoice  = "103"
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
      bolnaElevenlabTurbo: false
    },
    {
      id: "103",
      name: 'Larry',
      voice_id: 103,
      bolnaVoice: 'Larry',
      bolnaProvider: 'elevenlabs',
      bolnaModel: 'eleven_multilingual_v2',
      bolnaVoiceId: 'f1Bv0aZf1CDR0ljsbQEU',
      bolnaElevenlabTurbo: false
    },
    {
      id:"104",
      name: 'Clyde',
      voice_id: 104,
      bolnaVoice: 'Clyde',
      bolnaProvider: 'elevenlabs',
      bolnaModel: 'eleven_multilingual_v2',
      bolnaVoiceId: '2EiwWnXFnvU5JabPnv8n',
      bolnaElevenlabTurbo: false
    },
    {
      id:"105",
      name: 'Paul',
      voice_id: 105,
      bolnaVoice: 'Paul',
      bolnaProvider: 'elevenlabs',
      bolnaModel: 'eleven_multilingual_v2',
      bolnaVoiceId: '5Q0t7uMcjvnagumLfvZi',
      bolnaElevenlabTurbo: false
      
    },
    {
      id:"106",
      name: 'Freya',
      voice_id: 106,
      bolnaVoice: 'Freya',
      bolnaProvider: 'elevenlabs',
      bolnaModel: 'eleven_multilingual_v2',
      bolnaVoiceId: 'jsCqWAovK2LkecY7zXl4',
      bolnaElevenlabTurbo: false
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
    let tagFound = false;
    for (const tag of companion.tags) {
      if (tag.name === 'male') {
        await db.companion.update({
          where: { id: companion.id },
          data: { phoneVoiceId: defaultMaleVoice },
        });
        console.log("Updated companion with id " + companion.id + " to use voice_id " + defaultMaleVoice)
        tagFound = true;
        break;
      } else if (tag.name === 'woman') {
        await db.companion.update({
          where: { id: companion.id },
          data: { phoneVoiceId: defaultFemaleVoice },
        });
        console.log("Updated companion with id " + companion.id + " to use voice_id " + defaultFemaleVoice)
        tagFound = true;
        break;
      }
    }
    // If no matching tags, set to default female voice
    if (!tagFound) {
      await db.companion.update({
        where: { id: companion.id },
        data: { phoneVoiceId: defaultFemaleVoice },
      });
      console.log("Set default voice for companion:", companion.name)
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