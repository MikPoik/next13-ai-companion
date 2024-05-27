import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs";
import prismadb from "@/lib/prismadb"
import { UserButton } from "@clerk/nextjs"
import { checkSubscription } from "@/lib/subscription";
import { appendHistorySteamship, } from "@/components/SteamshipAppendHistory";
import { Steamship } from '@steamship/client';
import { format } from "path";

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
        console.log('Companion ID:', companionId);
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
        console.log(balance)
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

        if (!phoneVoice) {
            return new NextResponse("No phone voice found", { status: 404 });
        }
        //console.log(phoneVoice)
        //retrieve chat history from db, last 10 messages    
        let formattedMessages = '';
        companion.messages.forEach((message) => {
            const role = message.role;
            let text;
            if (role === 'system') {
                // Parse the JSON string to get the text for system messages
                const contentArray = JSON.parse(message.content);
                const firstContentObject = contentArray[0];
                text = firstContentObject.text;
            } else {
                // Directly use the content for user messages
                text = message.content;
            }
            let role_text = "";
            if (role === 'system') {
                role_text = `You`;
            }
            else {
                role_text = "person";
            }
            formattedMessages += `${role_text}: ${text}\n`; // Append to the string with a newline character for separation
        });

        if (!formattedMessages.includes("You:")) {
            formattedMessages = `You: ${companion.seed}\n` + formattedMessages;
        }



        // Create dynamic environment variables
        const now = new Date();
        const day = now.toLocaleString("en-US", { weekday: "long" }); // Get the current day name
        const time = now.toLocaleTimeString("en-US", { hour12: true }); // Get the current time (AM/PM format)
        const date = now.toLocaleDateString("en-US"); // Get the current date in MM/DD/YYYY format


        const call_prompt = `Embody a character, your name is ${companion.name} and you are ${companion.description}. You're calling a person. If you haven't had previous conversation with the person before, introduce yourself and ask the person's name so you get to know each other. Begin the call with a tone and mood based on your personality, be creative when conversation proceeds. Keep the conversation fresh while avoiding repetition. If it fits the flow of conversation you can be explicit and sexually charged.

Your personality: ${companion.personality}
Your physical appearance: ${companion.selfiePre}

Date: ${date}, Time: ${time}, Day: ${day}.

Here's dialogue from a previous conversation between person and You:
${formattedMessages}`;



        //console.log(call_prompt);
        // Your call initiation logic goes here
        // Headers  
        const apiKey = process.env["BLAND_API_KEY"];
        if (!apiKey) {
            throw new Error('BLAND_API_KEY is not defined in environment variables');
        }
        const headers = {
            'Authorization': `${apiKey}`,
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
        //console.log(data);
        //call api post 'https://api.bland.ai/call', data, {headers};
        // Make the API call to bland.ai
        //console.log("making api call")
        const response = await fetch('https://api.bland.ai/v1/calls', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
        });

        const responseJson = await response.json(); // This converts the response to a JSON object
        //console.log(responseJson);
        const callId = responseJson.call_id; // This extracts the call_id value from the response JSON
        const status = responseJson.status; // This extracts the status value from the response JSON
        //console.log(callId, status); // This logs the call_id value
        if (status === 'success') {
            const callLog = await prismadb.callLog.create({
                data: {
                    id: callId,
                    userId: user.id,
                    companionId: companion.id,
                    status: 'call-requested',
                }
            });
            //console.log(callLog);
        }
    } catch (error: any) {
        console.error('Error while processing send-call:', error);
        return new NextResponse(`Error: ${error.message}`, { status: 400 });
    }

    return new NextResponse(JSON.stringify({ message: 'ok' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
