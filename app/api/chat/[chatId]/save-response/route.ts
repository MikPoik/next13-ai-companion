import prismadb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {Role} from "@prisma/client"
import { checkSubscription } from "@/lib/subscription";

function roughTokenCount(text: string): number {
    // Use regular expression to split text based on whitespace and punctuation
    const tokens = text.match(/\b\w+\b|[.,!?;]/g);
    return tokens ? tokens.length : 0;
}

interface Block {
  text?: string;
  publicData?: boolean;
  streamState?: string;
  requestId?: string;
  index?: number;
  tags?: Array<any>;
  mimeType?: string;
  createdAt?: string;
  id?: string;
  fileId?: string;
  workspaceId?: string;
}

async function containsMarkdownImageSyntax(blockListStr: string): Promise<boolean> {
  try {
    // Check if the input blockList string contains Markdown image syntax
    const markdownImageRegex = /!\[(?!voice).*?\]\(.*?\)/g;
    const containsImage = markdownImageRegex.test(blockListStr);
    console.log("containsImage", containsImage)
    return containsImage; // Return true if Markdown image syntax is found, otherwise false
  } catch (error) {
    console.error("SaveResponse, Error detecting Markdown image syntax:", error);
    console.error("SaveResponse, Block list string causing error:", blockListStr);
    return false; // In case of error, return false
  }
}

async function containsMarkdownVoiceSyntax(blockListStr: string): Promise<boolean> {
  try {
    // Check if the input blockList string contains Markdown image syntax
    const markdownImageRegex = /!\[voice\]\(.*?\)/g;
    const containsVoice = markdownImageRegex.test(blockListStr);
    console.log("containsVoice", containsVoice)
    return containsVoice; // Return true if Markdown image syntax is found, otherwise false
  } catch (error) {
    console.error("SaveResponse, Error detecting Markdown image syntax:", error);
    console.error("SaveResponse, Block list string causing error:", blockListStr);
    return false; // In case of error, return false
  }
}

type RouteContext = {
    params: Promise<{ chatId: string }>;
}


export async function POST(
    request: Request,
    { params }: RouteContext
) {
    try {
        const unwrappedParams = await params;
        const chatId = unwrappedParams.chatId;

        
        const { prompt,id,blockList } = await request.json();


        //Parse blockList for possible image block and save to db also.
        
        const user = await currentUser();
        if (!user || !user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        
        const { isSubscribed, tier } = await checkSubscription();
        
        var imageTokens = 0;
        var voiceTokens = 0;
        var responseLength = 0;
        var responseText = "";
        var hasAudio = 0;
        responseText = prompt;
        
        const image_url = await containsMarkdownImageSyntax(blockList)
        let finalContent = prompt
        if (image_url) {
            imageTokens = 500
        }

        const voice_url = await containsMarkdownVoiceSyntax(blockList)
        if (voice_url) {
            voiceTokens = 10
        }
        await prismadb.companion.update({
            where: { id: chatId },
            data: {
                messageCount: {
                    increment: 1
                }
            }
        });

        if (tier !="unlimited") {            
            const balance = await prismadb.userBalance.findUnique({
                where: {
                    userId: user.id
                },
            });

            if (balance) {
                if (balance.tokenCount > balance.tokenLimit+balance.proTokens) {
                    return NextResponse.json("No balance");
                }
            }
            const tokenCost = roughTokenCount(prompt.content) + imageTokens + voiceTokens;

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
        }

        return NextResponse.json("prompt saved")
    }
    catch (error) {
        console.log(error)

        //return new NextResponse("Internal Error", { status: 500 });
    }
}