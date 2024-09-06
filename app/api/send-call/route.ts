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
                    // Assuming initial setting for proTokens and callTime needs to be handled here as well
                    proTokens: 0,
                    callTime: 300,
                    lastMessage: currentDateTime
                }
            });
            return new NextResponse(JSON.stringify({ message: 'Not enough balance' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
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
        const phoneNumber = body.phoneNumber; // Access the phone number from the request body
        const companionId = body.companionId;
        //console.log('Phone Number:', phoneNumber);
        //console.log('Companion ID:', companionId);
        const user = await currentUser();
        if (!user || !user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }



        const balance = await prismadb.userBalance.findUnique({
            where: {
                userId: user.id
            },
        });
        //TODO different balance for calls

        if (balance) {
            if (balance.callTime < 6) {
                return new NextResponse(JSON.stringify({ message: 'Not enough balance' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }
        }
        //console.log("user balance: ",balance)
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
        //console.log(companion);
        const phoneVoice = await prismadb.phoneVoice.findUnique({
            where: {
                id: companion.phoneVoiceId
            }
        });
        //console.log("phoneVoice: ",phoneVoice)
        if (!phoneVoice) {
            return new NextResponse("No phone voice found", { status: 404 });
        }

        //retrieve chat history from db, last 10 messages    
        let formattedMessages = ''

        //console.log(formattedMessages)
        const EMOJI_PATTERN = /([\u{1F1E0}-\u{1F1FF}|\u{1F300}-\u{1F5FF}|\u{1F600}-\u{1F64F}|\u{1F680}-\u{1F6FF}|\u{1F700}-\u{1F77F}|\u{1F780}-\u{1F7FF}|\u{1F800}-\u{1F8FF}|\u{1F900}-\u{1F9FF}|\u{1FA00}-\u{1FA6F}|\u{1FA70}-\u{1FAFF}|\u{2702}-\u{27B0}])/gu;
        
        companion.messages.forEach((message) => {
            //console.log("Processing message:", message);
            const role = message.role;
            let text;
            try {
                if (typeof message.content === 'string') {
                    // Use a regular expression to extract the text field
                    const textMatch = message.content.match(/"text":"((?:[^"\\]|\\.)*)"/);
                    if (textMatch && textMatch[1]) {
                        text = textMatch[1];
                        // Unescape any escaped characters
                        text = text.replace(/\\(.)/g, "$1");
                    } else {
                        text = message.content;
                    }
                } else {
                    console.error("Unexpected message content type:", typeof message.content);
                    text = String(message.content);
                }
                // Remove most emojis from the text content
                text = text.replace(EMOJI_PATTERN, '');
                // Remove text between square brackets (like [Image of Caroline clothed])
                text = text.replace(/\[.*?\]/g, '');
                // Trim any extra whitespace
                text = text.trim();
            } catch (error) {
                console.error('Error processing message');
                text = String(message.content);
            }
            let roleText = role === 'system' || role === 'assistant' ? 'assistant' : 'user';
            text = text.replace(/\n/g, ". ");
            formattedMessages += `${roleText}: ${text}\n`;
            //console.log("Formatted message:", `${roleText}: ${text}`);
        });

        
        if (!formattedMessages.includes("assistant:")) {
            formattedMessages += `assistant:  ${companion.seed.replace(EMOJI_PATTERN, '')}\n` + formattedMessages;
        }

        //console.log("***MESSAGES***\n"+formattedMessages);
        
        // Create dynamic environment variables
        const now = new Date();
        const day = now.toLocaleString("en-US", { weekday: "long" }); // Get the current day name
        const time = now.toLocaleTimeString("en-US", { hour12: true }); // Get the current time (AM/PM format)
        const date = now.toLocaleDateString("en-US"); // Get the current date in MM/DD/YYYY format



        //console.log(call_prompt);
        // Your call initiation logic goes here
        // Headers  
        /*
        const apiKey = process.env["BLAND_API_KEY"];
        if (!apiKey) {
            throw new Error('BLAND_API_KEY is not defined in environment variables');
        }
        */
        const apiKey = process.env["BOLNA_API_KEY"];
        if (!apiKey) {
            throw new Error('BOLNA_API_KEY is not defined in environment variables');
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
        let voice_id = null
        let voice_preset = null

        voice_preset = phoneVoice.voice_preset;

        /*
        const data = {
            'phone_number': phoneNumber,
            'task': call_prompt,
            'reduce_latency': phoneVoice.reduceLatency,
            'webhook': `${process.env["NEXT_PUBLIC_APP_URL"]}/api/callhook`,
            'max_duration': maxDuration,
            'interruption_threshold': 300,
            'temperature': 0.9,
            'voice': voice_preset,
            'model': 'turbo'

        }

        */
        let voice_agent_id = companion.voiceAgentId;

        
        const create_bolna_agent_json = getBolnaAgentJson(companion.name,phoneVoice.bolnaVoice,phoneVoice.bolnaProvider,phoneVoice.bolnaVoiceId,phoneVoice.bolnaModel,phoneVoice.bolnaElevenlabTurbo,phoneVoice.bolnaPollyEngine,phoneVoice.bolnaPollyLanguage)
        //console.log("json body: ", JSON.stringify(create_bolna_agent_json, null, 2));

        
        //console.log("check agent id")
        //console.log(voice_agent_id)
        if (!companion.voiceAgentId) {
            //if companion does not exist
            console.log("companion voice agent id not set")

            
            const response = await fetch('https://api.bolna.dev/agent', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(create_bolna_agent_json),
            });
            const result = await response.json();
            //console.log(result);
            
            voice_agent_id = result.agent_id;  
            //console.log(companionId,user.id,result.agent_id)
            const updateCompanion = await prismadb.companion.update({
                where: {
                    id: companionId,
                },
                data: {
                    voiceAgentId: voice_agent_id,
                }
                });
            //console.log(updateCompanion)
            
        }
        //update voice agent template
       //console.log("update voice agent template")
        const update_voice_agent = await fetch(`https://api.bolna.dev/agent/${voice_agent_id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(create_bolna_agent_json),
        });
        
        console.log("Update agent: ",await update_voice_agent.json())
        let tags = companion.tags.map(tag => tag.name).join(", ");
        //console.log(tags)
        
        const data = {
                "agent_id": voice_agent_id, 
                "recipient_phone_number": phoneNumber,
                "user_data": {
                    "character_name": companion.name,
                    "character_type": companion.description,
                    "character_personality": companion.personality,
                    "character_appearance": companion.selfiePre,
                    "previous_messages": formattedMessages,
                    "character_background": companion.backstory,
                    "tags": tags,
                }
            }
        //console.log(data);
        //call api post 'https://api.bland.ai/call', data, {headers};
        // Make the API call to bland.ai
        //console.log("making api call")
        /*

        const response = await fetch('https://api.bland.ai/v1/calls', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
        });
        */
        
        //console.log("Make Bolna API call")
        const response = await fetch('https://api.bolna.dev/call', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
        });
        
        const responseJson = await response.json(); // This converts the response to a JSON object

        //console.log(responseJson);


        const callId = responseJson.call_id; // This extracts the call_id value from the response JSON
        const status = responseJson.status; // This extracts the status value from the response JSON
       //console.log(callId, status); // This logs the call_id value
        //if (status === 'success') {
        if (status === 'queued') {
            const callLog = await prismadb.callLog.create({
                data: {
                    id: callId.split('#')[1],
                    userId: user.id,
                    companionId: companion.id,
                    status: 'call-requested',
                }
            });
            console.log(callLog);
        }
    } catch (error: any) {
        console.error('Error while processing send-call:', error);
        return new NextResponse(`Error: ${error.message}`, { status: 400 });
    }

    return new NextResponse(JSON.stringify({ message: 'ok' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
