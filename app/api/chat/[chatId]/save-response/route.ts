import prismadb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

function roughTokenCount(text: string): number {
    // Use regular expression to split text based on whitespace and punctuation
    const tokens = text.match(/\b\w+\b|[.,!?;]/g);
    return tokens ? tokens.length : 0;
}

export async function POST(
    request: Request,
    { params }: { params: { chatId: string } }
) {
    try {


        const { prompt,id,blockList } = await request.json();
        console.log("Save-Response, prompt received:", prompt);
        console.log("Message id ",id)
        console.log("Block List ",blockList)
        const user = await currentUser();
        if (!user || !user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

         await prismadb.message.upsert({
             where: {
                 id: id,
             },
             create: {
                 id: id,
                 content: prompt,
                 role: "assistant",
                 userId: user.id,
                 companionId: params.chatId,
                 createdAt: new Date(Date.now() + 1000),
             },
             update: {
                 id: id,
                 content: prompt,
                 role: "assistant",
                 userId: user.id,
                 companionId: params.chatId,
                 createdAt: new Date(Date.now() + 1000),
             }
         });

        var imageTokens = 0;
        var voiceTokens = 0;
        var responseLength = 0;
        var responseText = "";
        var hasAudio = 0;
        responseText = prompt;
        
        /*
        for (const block of blockList) {
            console.log(block);
            if (block.mimeType.startsWith("image")) {
                imageTokens += 500;
            } else if (block.mimeType.startsWith("audio")) {
                hasAudio = 1;
            }
        }
        */
        const balance = await prismadb.userBalance.findUnique({
            where: {
                userId: user.id
            },
        });
        console.log(balance);
        if (balance) {
            if (balance.tokenCount > balance.tokenLimit+balance.proTokens) {
                return NextResponse.json("No balance");
            }
        }
        const tokenCost = roughTokenCount(responseText) + imageTokens + voiceTokens;
        console.log("Token Cost: ", tokenCost);
        const currentDateTime = new Date().toISOString();

            if (!balance) {
                // Create the new balance record if it does not exist
                await prismadb.userBalance.create({
                    data: {
                        userId: user.id,
                        tokenCount: tokenCost,
                        messageCount: 1,
                        messageLimit: 1000,
                        tokenLimit: 10000,
                        firstMessage: currentDateTime,
                        // Assuming initial setting for proTokens and callTime needs to be handled here as well
                        proTokens: 0,
                        callTime: 300,
                        lastMessage: currentDateTime
                    }
                });
            } else {
                // Check if proTokens cover all the cost
                if (balance.proTokens >= tokenCost) {
                    // Decrement from proTokens only
                    await prismadb.userBalance.update({
                        where: {
                            userId: user.id
                        },
                        data: {
                            proTokens: {
                                decrement: tokenCost
                            },
                            messageCount: {
                                increment: 1
                            },
                            lastMessage: currentDateTime
                        }
                    });
                } else {
                    // Use up all proTokens and remainder goes to tokenCount
                    const remainder = tokenCost - balance.proTokens;
                    await prismadb.userBalance.update({
                        where: {
                            userId: user.id
                        },
                        data: {
                            proTokens: {
                                decrement: balance.proTokens
                            },
                            tokenCount: {
                                increment: remainder
                            },
                            messageCount: {
                                increment: 1
                            },
                            lastMessage: currentDateTime
                        }
                    });
                }
            }
        return NextResponse.json("prompt saved")
    }
    catch (error) {
        console.log(error)

        //return new NextResponse("Internal Error", { status: 500 });
    }
}