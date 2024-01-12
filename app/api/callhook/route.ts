import { headers } from "next/headers"
import { NextResponse } from "next/server"
import prismadb from "@/lib/prismadb"
import { UserButton } from "@clerk/nextjs"
import { appendHistorySteamship, } from "@/components/SteamshipAppendHistory";
import { Steamship } from '@steamship/client';
export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        // Read the request body as text
        const body = await req.text();
        console.log(body);
        // Convert the text to a JavaScript object
        const data = JSON.parse(body);
        // Access properties from the parsed object
        const callId = data.call_id;
        const status = data.status;
        const correctedDuration = data.corrected_duration;
        const transcripts = data.transcript;


        console.log('Call ID:', callId);
        console.log('Status:', status);
        console.log('Corrected Duration:', correctedDuration);

        //retrieve callID from DB
        const call_sender = await prismadb.callLog.findUnique({
            where: {
                id: callId
            }
        });
        if (!call_sender) {
            return new NextResponse(`No call log found}`, { status: 400 })
        }

        const update_call_log = await prismadb.callLog.update({
            where: {
                id: callId
            },
            data: {
                status: "completed",
                duration: correctedDuration,
            }
        });
        console.log(update_call_log);

        const companionId = call_sender.companionId;
        const userId = call_sender.userId;

        // Prepare an array of message objects to insert
        const messagesToCreate = transcripts.map((transcript: any) => ({
            companionId: companionId,
            userId: userId,
            content: transcript.user === "assistant" ? `[{"index":null,"mimeType":null,"text":"${transcript.text}","fileId":null,"id":null,"publicData":true,"contentURL":null,"url":null,"tags":[],"uploadBytes":null,"uploadType":null}]` : transcript.text,
            role: transcript.user === "assistant" ? "system" : "user", // Changed from transcript.user to "user"
        }));

        // Use createMany to insert all at once
        const update_history = await prismadb.message.createMany({
            data: messagesToCreate
        });

        //update userBalance

        const userBalance = await prismadb.userBalance.update({
            where: {
                userId: userId
            },
            data: {
                callTime: {
                    decrement: parseInt(correctedDuration, 10)
                }
            }
        });
        console.log(userBalance);
        // Check if the new userBalance's callTime is below 0 after decrementing
        if (userBalance.callTime < 0) {
            // Handle the situation when balance is below 0
            // For example, you might want to set it to 0 or throw an error
            // Here we will log it and potentially you could also send a warning to the user
            console.warn(`User balance for userId ${userId} got negative after decrement.`);

            // Reset the balance to 0 if it's negative (optional step)
            await prismadb.userBalance.update({
                where: {
                    userId: userId
                },
                data: {
                    callTime: 0
                }
            });
        }

        const companion = await prismadb.companion.findUnique({
            where: {
                id: companionId
            }
        });

        //format to json string to be parsed in steamship
        const json_messages = JSON.stringify(transcripts.map((transcript: any) => ({
            role: transcript.user === "assistant" ? "assistant" : "user",
            content: transcript.text
        })));
        
        if (!companion) {
            return new NextResponse(`No companion found}`, { status: 400 })
        }
        const client = await Steamship.use(companion.packageName, companion.instanceHandle, { llm_model: companion.model, create_images: String(companion.createImages) }, undefined, true, companion.workspaceName);
        const appendHistoryResponse = await appendHistorySteamship(
            'append_history',
            json_messages,
            userId,
            companion.packageName,
            companion.instanceHandle,
            companion.workspaceName,
            companion.model,
            companion.createImages,);
        const appendHistorytResponseBlocks = JSON.parse(appendHistoryResponse);
        console.log(appendHistorytResponseBlocks);




    } catch (error: any) {
        console.error('Error while processing webhook:', error);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
    }

    return new NextResponse(null, { status: 200 })
}