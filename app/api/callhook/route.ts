import { headers } from "next/headers"
import { NextResponse } from "next/server"
import prismadb from "@/lib/prismadb"
import { UserButton } from "@clerk/nextjs"
import { appendHistorySteamship, } from "@/components/SteamshipAppendHistory";
import { Steamship as SteamshipV2 } from 'steamship-client-v2';
import {Role } from "@prisma/client";
export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const body = await req.text();
        console.log("CALL HOOK");
        console.log("jsonbody", body);
        const data = JSON.parse(body);
        console.log("data", data);
        const callId = data.id;
        const agentId = data.agent_id;
        console.log('Call ID:', callId);
        console.log('Agent ID:', agentId);
        const correctedDuration = data.telephony_data.duration;
        console.log('Corrected Duration:', correctedDuration);
        const transcriptsText = data.transcript;
        console.log('Transcripts:', transcriptsText);
        // Declare transcriptUser outside of the nested try block
        let transcriptUser: Array<{ user: string, text: string }> = [];
        try {
            transcriptUser = transcriptsText.split('\n').map((line: string) => {
                try {
                    const [user, text] = line.split(':  ');
                    return { user: user.trim().toLowerCase(), text: text.trim() };
                } catch (error: any) {
                    console.error(`Error processing line: "${line}"`, error);
                    return null;
                }
            }).filter(Boolean);
            console.log('Transcript User:', transcriptUser);
        } catch (transcriptError: any) {
            console.error('Error processing transcripts:', transcriptError);
            return new NextResponse(`Transcript Processing Error: ${transcriptError.message}`, { status: 400 });
        }
        console.log("find callLog");
        const call_sender = await prismadb.callLog.findUnique({
            where: {
                id: callId
            }
        });
        console.log("call_sender", call_sender);
        if (!call_sender) {
            return new NextResponse(`No call log found}`, { status: 400 });
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
        const companionId = call_sender.companionId;
        const userId = call_sender.userId;
        // Prepare an array of message objects to insert based on the new response
        const messagesToCreate = transcriptUser.map((transcript: any, index: number) => {
            // Debugging each transcript
            const role: Role = transcript.user === "assistant" ? Role.system : Role.user;
            console.log('Processing transcript:', transcript);
            const createdAt = new Date(data.createdAt).getTime() + index * 1000;
            console.log(createdAt)
            const message = {
                companionId: companionId,
                userId: userId,
                content: transcript.user === "assistant" ? `[{"text":"${transcript.text.replace(/\n+/g, ". ")}"}]` : transcript.text.replace(/\n+/g, ". "),
                role,
                createdAt: new Date(createdAt).toISOString(),
            };
            // Debugging the constructed message
            console.log('Created message:', message);
            return message;
        });
        console.log('messagesToCreate:', messagesToCreate);
        // Use createMany to insert all at once
        console.log("update_history")
        let update_history;
        try {
            update_history = await prismadb.message.createMany({
                data: messagesToCreate
            });
            console.log('update_history successful', update_history);
        } catch (error: any) {
            console.error('Error with update_history:', error);
            throw new Error(`Error creating messages: ${error.message}`);
        }
        console.log('update_history', update_history);
        // Update user balance
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
        console.log("userBalance",userBalance)
        // Check if the new userBalance's callTime is below 0 after decrementing
        if (userBalance.callTime < 0) {
            console.warn(`User balance for userId ${userId} got negative after decrement.`);
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
        const json_messages = JSON.stringify(transcriptUser.map((transcript: any) => ({
            role: transcript.user === "assistant" ? "assistant" : "user",
            content: transcript.text.replace(/\\n/g, ". ")
        })));
        console.log("json_messages",json_messages);
        if (!companion) {
            return new NextResponse(`No companion found}`, { status: 400 });
        }
        console.log("apped history to steamship")
        const client = await SteamshipV2.use(companion.packageName, companion.instanceHandle, { llm_model: companion.model, create_images: String(companion.createImages) }, undefined, true, companion.workspaceName);
        const appendHistoryResponse = await appendHistorySteamship(
            'append_history',
            json_messages,
            userId,
            companion.packageName,
            companion.instanceHandle,
            companion.workspaceName,
            companion.model,
            companion.createImages,);
        const appendHistoryResponseBlocks = JSON.parse(appendHistoryResponse);
    } catch (error: any) {
        console.error('Error while processing webhook:');
        return new NextResponse(`Webhook Error: ${error.message}\n\n`, { status: 400 });
    }
    return new NextResponse(null, { status: 200 });
}