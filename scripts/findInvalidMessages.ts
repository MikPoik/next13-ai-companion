// Import PrismaClient



async function findInvalidMessages() {
    const keyword = "tool";
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
        // Find messages that contain keyword "tool" in the "content" column
        const messages = await prisma.message.findMany({
            where: {
                content: {
                    contains: keyword
                }
            }
        });
        // Print the found messages
        console.log("\n\n[MESSAGES CONTAINING KEYWORDS] ",messages.length)
        // Add support for parsing JSON content and extracting the "text" field
        messages.forEach(message => {
            try {
                // Since content is actually a JSON string, we need to parse it as JSON
                const contentArray = JSON.parse(message.content);
                // Now contentArray is an array, loop over it to find the text
                contentArray.forEach(contentObj => {
                    if(contentObj.text && contentObj.text.includes(keyword)) {
                        // Find the index of the keyword within the text
                        const keywordIndex = contentObj.text.indexOf(keyword);
                        // Calculate startIndex by getting 50 chars before keyword index or 0 if it's near the start
                        let startIndex = Math.max(keywordIndex - 50, 0);
                        // Calculate endIndex, ensuring it doesn't exceed the length of the text
                        let endIndex = Math.min(startIndex + 100, contentObj.text.length);
                        // Adjust startIndex if the text is short and we cannot get a full 100 chars window
                        startIndex = Math.max(endIndex - 100, 0);
                        // Extract and print the substring containing the keyword in a 100 character window
                        console.log("[MESSAGE]\n",contentObj.text.substring(startIndex, endIndex),"\n[END]\n");
                    }
                });
            } catch (parseError) {
                // If there's an error parsing the JSON content, log it
                //console.error('Error parsing message content: ', parseError);
            }
        });

        console.log("\n\n[MESSAGES CONTAINING KEYWORD] ",messages.length);
    } catch (error) {
        console.error('Error', error);
    } finally {
        await prisma.$disconnect();
    }
    }


// Call the function
findInvalidMessages()