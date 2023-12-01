// Import PrismaClient



async function reportCompanions() {
    const keyword = "pedoph";
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
        // Find messages that contain keyword in the "content" column
        const companions = await prisma.companion.findMany({
            where: {
                OR: [
                    {
                        personality: {
                            contains: keyword
                        },
                    },
                    {
                        behaviour: {
                            contains: keyword
                        },
                    },
                    {
                        description: {
                            contains: keyword
                        },
                    }
                ]
            }
        });


        // Print the matching text within a 200 character window
        companions.forEach(companion => {
            const texts = [companion.personality, companion.behaviour, companion.description];
            var match = 0;
            texts.forEach(text => {
                if (text.includes(keyword)) {
                    match++;
                }
            });
            if (match != 0) {
                console.log("\n\n[COMPANION]: ", companion.name, "\nid: ", companion.id, "\nuserName: ", companion.userName, "\nuserId: ", companion.userId);
            }
            texts.forEach(text => {
                const keywordIndex = text.indexOf(keyword);
                if (keywordIndex !== -1) {
                    const start = Math.max(keywordIndex - 100, 0);
                    const end = text.length < start + 200 ? text.length : start + 200;
                    const snippet = text.substring(start, end).trim();
                    console.log("[MATCHING TEXTS SAMPLE]: ", snippet);
                }
            });
        });
        console.log("\n\n[COMPANIONS CONTAINING KEYWORDS] ", companions.length)
    } catch (error) {
        //console.error('Error', error);/
    } finally {
        await prisma.$disconnect();
    }
}


// Call the function
reportCompanions()