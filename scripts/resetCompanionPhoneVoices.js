
async function resetCompanionPhoneVoices() {
  const { PrismaClient } = require('@prisma/client');
  const { v4: uuidv4 } = require('uuid');


  const prisma = new PrismaClient();

  try {


      await prisma.companion.updateMany({
        data: {
          phoneVoiceId: '302df500-b53f-4e33-bcd7-1e06d06cebc5', //id of the PhoneVoice record
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