
async function resetCompanionPhoneVoices() {
  const { PrismaClient } = require('@prisma/client');
  const { v4: uuidv4 } = require('uuid');


  const prisma = new PrismaClient();

  try {


      await prisma.companion.updateMany({
        data: {
          phoneVoiceId: '85dc6fb9-9d75-4f59-aeb1-07b49ff4d382', //id of the PhoneVoice record
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