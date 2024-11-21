import { headers } from "next/headers"
import { NextResponse } from "next/server"
import prismadb from "@/lib/prismadb"
import { UserButton } from "@clerk/nextjs"
import {Role } from "@prisma/client";
export const maxDuration = 60;
import { checkSubscription } from "@/lib/subscription";
import { call_modal_agent } from "@/lib/utils";

export async function POST(req: Request) {
    try {
        const body = await req.text();
        //console.log("CALL HOOK");
        console.log("jsonbody", body);
        const data = JSON.parse(body);
        console.log("data", data);
        const callId = data.id;
        const agentId = data.agent_id;
        //console.log('Call ID:', callId);
        //console.log('Agent ID:', agentId);
        const correctedDuration = data.telephony_data.duration;
        //console.log('Corrected Duration:', correctedDuration);
        const transcriptsText = data.transcript;
        console.log('Transcripts:', transcriptsText);
        // Declare transcriptUser outside of the nested try block
        let transcriptUser: Array<{ user: string, text: string }> = [];
        try {
            transcriptUser = transcriptsText.split('\n').map((line: string) => {
                const colonIndex = line.indexOf(':');
                if (colonIndex !== -1) {
                    const user = line.slice(0, colonIndex).trim().toLowerCase();
                    const text = line.slice(colonIndex + 1).trim();
                    return { user, text };
                }
                return null;
            }).filter(Boolean);
            //console.log('Transcript User:', transcriptUser);
        } catch (transcriptError: any) {
            console.error('Error processing transcripts');
            //return new NextResponse(`Transcript Processing Error: ${transcriptError.message}`, { status: 400 });
        }
        //console.log("find callLog");
        const call_sender = await prismadb.callLog.findUnique({
            where: {
                id: callId
            }
        });
        //console.log("call_sender", call_sender);
        if (!call_sender) {
            return new NextResponse(`No call log found}`, { status: 400 });
        }
        const update_call_log = await prismadb.callLog.update({
            where: {
                id: callId
            },
            data: {
                status: "completed",
                duration: correctedDuration.toString(),
            }
        });
        const companionId = call_sender.companionId;
        const userId = call_sender.userId;
        // Prepare an array of message objects to insert based on the new response
        const messagesToCreate = transcriptUser.map((transcript: any, index: number) => {
            // Debugging each transcript
            const role: Role = transcript.user === "assistant" ? Role.system : Role.user;
            //console.log('Processing transcript:', transcript);
            let createdAt: Date;
            try {
                // Remove the last colon from the timezone offset
                const formattedTimestamp = data.created_at.replace(/([+-]\d{2}):(\d{2})$/, '$1$2');
                createdAt = new Date(formattedTimestamp);

                if (isNaN(createdAt.getTime())) {
                    throw new Error('Invalid date');
                }
            } catch (error) {
                console.error('Error parsing timestamp:', error);
                // Fallback to current time if parsing fails
                createdAt = new Date();
            }
            //console.log(createdAt)
            const message = {
                companionId: companionId,
                userId: userId,
                content: transcript.user === "assistant" ? `[{"text":"${transcript.text.replace(/\n+/g, ". ")}"}]` : transcript.text.replace(/\n+/g, ". "),
                role,
                createdAt: new Date(createdAt).toISOString(),
            };
            // Debugging the constructed message
            //console.log('Created message:', message);
            return message;
        });
        //console.log('messagesToCreate:', messagesToCreate);
        // Use createMany to insert all at once
        //console.log("update_history")
        let update_history;

        //console.log('update_history', update_history);
        // Update user balance
        //const { isSubscribed, tier } = await checkSubscription();

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
        //console.log("userBalance",userBalance)
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
          where: { id: companionId },
          include: { 
            steamshipAgent: {
              take: 1, // Limit the number of records to 1
              orderBy: { createdAt: "desc" },
              where: { userId: userId }
            },
            tags: true
          }
        });

        const json_messages = JSON.stringify(transcriptUser.map((transcript: any) => ({
            role: transcript.user === "assistant" ? "assistant" : "user",
            content: transcript.text.replace(/\\n/g, ". ")
        })));
        //console.log("json_messages",json_messages);
        if (!companion) {
            return new NextResponse(`No companion found}`, { status: 400 });
        }
        if (!companion.steamshipAgent.length) {
            return new NextResponse(`No companion found}`, { status: 400 });
        }
        const agent_config = {
            "workspace_id": companion.steamshipAgent[0].workspaceHandle,
            "context_id": "default",
            "agent_id": companion.steamshipAgent[0].instanceHandle,
            kwargs: {
                chat_messages: json_messages
            }
        };

        //retrieve history in format [{"role": "user", "content": "message"},... , {"role": "assistant", "content": "message"}]
        const appended_history_response = await call_modal_agent("append_chat_history", agent_config);
        console.log(await appended_history_response.json())

          return new NextResponse(JSON.stringify({ message: 'Webhook processed successfully' }), { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
          });

    } catch (error: any) {
        console.error('Error while processing webhook:', error);
        return new NextResponse(`Webhook Error: ${error.message}\n\n`, { status: 400 });
    }
    
}