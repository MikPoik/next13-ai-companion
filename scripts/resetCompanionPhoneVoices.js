
async function resetCompanionPhoneVoices() {
  const { PrismaClient } = require('@prisma/client');
  const { v4: uuidv4 } = require('uuid');


  const prisma = new PrismaClient();

  try {


    await prisma.companion.updateMany({
      data: {
        phoneVoiceId: '3ee88a1a-8c02-4aed-b84b-7a69586a9b68', //id of the PhoneVoice record
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