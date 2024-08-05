
async function resetCompanionPhoneVoices() {
  const { PrismaClient } = require('@prisma/client');
  const { v4: uuidv4 } = require('uuid');


  const prisma = new PrismaClient();

  try {


    await prisma.companion.updateMany({
      data: {
        phoneVoiceId: 'd306e473-f19a-49d7-9d74-41427e9ded83', //id of the PhoneVoice record
      },
    });


    console.log('updated successfully');
  } catch (error) {
    console.error('Error updating ', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetCompanionPhoneVoices();