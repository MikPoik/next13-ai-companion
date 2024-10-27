import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb"
import { UserButton } from "@clerk/nextjs"
import { checkSubscription } from "@/lib/subscription";
import { appendHistorySteamship, } from "@/components/SteamshipAppendHistory";
import { Steamship } from '@steamship/client';
import { format } from "path";
import {getBolnaAgentJson} from "@/lib/bolna";

export const maxDuration = 60;

export async function GET(request: Request) {
    try {
        const user = await currentUser();
        if (!user || !user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const balance = await prismadb.userBalance.findUnique({
            where: {
                userId: user.id
            },
        });

        if (balance) {
            if (balance.callTime < 1) {
                return new NextResponse(JSON.stringify({ message: 'Not enough balance' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }
        } else {
            //balance record does not exist, create one
            const currentDateTime = new Date().toISOString();
            await prismadb.userBalance.create({
                data: {
                    userId: user.id,
                    tokenCount: 0,
                    messageCount: 1,
                    messageLimit: 1000,
                    tokenLimit: 10000,
                    firstMessage: currentDateTime,
                    proTokens: 0,
                    callTime: 300,
                    lastMessage: currentDateTime
                }
            });
            return new NextResponse(JSON.stringify({ message: 'Not enough balance' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        return new NextResponse(JSON.stringify({ message: 'OK' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    catch (error: any) {
        console.error('Error checking balance:', error);
        return new NextResponse(`Error: ${error.message}`, { status: 400 });
    }
}

export async function POST(req: Request) {
    try {
        // Get the body from the POST request
        const body = await req.json();
        const phoneNumber = body.phoneNumber;
        const companionId = body.companionId;

        const user = await currentUser();
        if (!user || !user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const balance = await prismadb.userBalance.findUnique({
            where: {
                userId: user.id
            },
        });

        if (balance) {
            if (balance.callTime < 6) {
                return new NextResponse(JSON.stringify({ message: 'Not enough balance' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }
        } else {
            return new NextResponse(JSON.stringify({ message: 'User balance not found' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const companion = await prismadb.companion.findUnique({
            where: {
                id: companionId
            },
            include: {
                messages: {
                    take: 10,
                    orderBy: {
                        createdAt: "desc"
                    },
                    where: {
                        userId: user.id,
                    },
                },
                tags: true,
            }
        });
        if (!companion) {
            return new NextResponse("No companion found", { status: 404 });
        }

        const phoneVoice = await prismadb.phoneVoice.findUnique({
            where: {
                id: companion.phoneVoiceId
            }
        });
        if (!phoneVoice) {
            return new NextResponse("No phone voice found", { status: 404 });
        }

        let formattedMessages = ''

        const EMOJI_PATTERN = /([\u{1F1E0}-\u{1F1FF}|\u{1F300}-\u{1F5FF}|\u{1F600}-\u{1F64F}|\u{1F680}-\u{1F6FF}|\u{1F700}-\u{1F77F}|\u{1F780}-\u{1F7FF}|\u{1F800}-\u{1F8FF}|\u{1F900}-\u{1F9FF}|\u{1FA00}-\u{1FA6F}|\u{1FA70}-\u{1FAFF}|\u{2702}-\u{27B0}])/gu;

        companion.messages.forEach((message) => {
            const role = message.role;
            let text;
            try {
                if (typeof message.content === 'string') {
                    const textMatch = message.content.match(/"text":"((?:[^"\\]|\\.)*)"/);
                    if (textMatch && textMatch[1]) {
                        text = textMatch[1];
                        text = text.replace(/\\(.)/g, "$1");
                    } else {
                        text = message.content;
                    }
                } else {
                    console.error("Unexpected message content type:", typeof message.content);
                    text = String(message.content);
                }
                text = text.replace(EMOJI_PATTERN, '');
                text = text.replace(/\[.*?\]/g, '');
                text = text.replace(/\*.*?\*/g, '');
                text = text.trim();
            } catch (error) {
                console.error('Error processing message');
                text = String(message.content);
            }
            let roleText = role === 'system' || role === 'assistant' ? 'assistant' : 'user';
            text = text.replace(/\n/g, ". ");
            formattedMessages += `${roleText}: ${text}\n`;
        });

        if (!formattedMessages.includes("assistant:")) {
            formattedMessages += `assistant:  ${companion.seed.replace(EMOJI_PATTERN, '')}\n` + formattedMessages;
        }

        // Create dynamic environment variables
        const now = new Date();
        const day = now.toLocaleString("en-US", { weekday: "long" });
        const time = now.toLocaleTimeString("en-US", { hour12: true });
        const date = now.toLocaleDateString("en-US");

        const apiKey = process.env["BOLNA_API_KEY"];
        if (!apiKey) {
            return new NextResponse("BOLNA_API_KEY is not defined", { status: 500 });
        }
        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
        let maxDuration = 0;
        if (balance) {
            maxDuration = balance.callTime / 60;
            if (maxDuration < 1 && balance.callTime > 0) {
                maxDuration = 1;
            }
            if (maxDuration > 12) {
                maxDuration = 2;
            }
        }
        let voice_preset = phoneVoice.voice_preset;

        let voice_agent_id = companion.voiceAgentId;


        const create_bolna_agent_json = getBolnaAgentJson(companion.name,phoneVoice.bolnaVoice,phoneVoice.bolnaProvider,phoneVoice.bolnaVoiceId,phoneVoice.bolnaModel,phoneVoice.bolnaElevenlabTurbo,phoneVoice.bolnaPollyEngine,phoneVoice.bolnaPollyLanguage)

        if (!companion.voiceAgentId || companion.voiceAgentId === "") {
            console.log("companion voice agent id not set")

            const response = await fetch('https://api.bolna.dev/agent', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(create_bolna_agent_json),
            });
            const result = await response.json();

            voice_agent_id = result.agent_id;  
            const updateCompanion = await prismadb.companion.update({
                where: {
                    id: companionId,
                },
                data: {
                    voiceAgentId: voice_agent_id,
                }
            });
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        const update_voice_agent = await fetch(`https://api.bolna.dev/agent/${voice_agent_id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(create_bolna_agent_json),
        });
        console.log("Update agent: ", await update_voice_agent.json())
        await new Promise(resolve => setTimeout(resolve, 3000));

        let tags = companion.tags.map(tag => tag.name).join(", ");

        const data = {
            "agent_id": voice_agent_id, 
            "recipient_phone_number": phoneNumber,
            "user_data": {
                "character_name": companion.name,
                "character_type": companion.description,
                "character_personality": companion.personality,
                "character_appearance": companion.selfiePre,
                "previous_messages": formattedMessages,
                "character_background": companion.backstory.length > 2000 ? companion.backstory.slice(0, 2000) : companion.backstory,
                "tags": tags,
            }
        }

        const response = await fetch('https://api.bolna.dev/call', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
        });

        const responseJson = await response.json();
        console.log("response", responseJson);

        const callId = responseJson.call_id;
        const status = responseJson.status;
        console.log(callId, status);

        if (status === 'queued') {
            const callLog = await prismadb.callLog.create({
                data: {
                    id: callId.split('#')[1],
                    userId: user.id,
                    companionId: companion.id,
                    status: 'call-requested',
                }
            });
            return new NextResponse(JSON.stringify({ message: 'ok', callId, status }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
        } else {
            console.log(responseJson, callId, status)
            return new NextResponse(JSON.stringify({ message: 'Something went wrong, please try again', callId, status }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error: any) {
        console.error('Error while processing send-call:', error);
        return new NextResponse(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    // Fallback response in case none of the above conditions are met
    return new NextResponse(JSON.stringify({ message: 'Unexpected end of function reached' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
}