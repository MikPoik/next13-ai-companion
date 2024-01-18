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
                    callTime: 0,
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
            console.log('Phone Number:', phoneNumber);
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

            const companion = await prismadb.companion.findUnique({
                where: {
                    id: companionId
                },
                include: {
                    messages: {
                        take: 6,
                        orderBy: {
                            createdAt: "asc"
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

            const phoneVoice = await prismadb.phoneVoice.findUnique({
                where: {
                    id: companion.phoneVoiceId
                }
            });
            if (!phoneVoice) {
                return new NextResponse("No phone voice found", { status: 404 });
            }
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
                    role_text = `${companion.name}: `;
                }
                else {
                    role_text = "Person: ";
                }
                formattedMessages += `${role_text}: ${text}\n`; // Append to the string with a newline character for separation
            });

            if (formattedMessages.length < 1) {
                formattedMessages = `${companion.name}: ` + companion.seed;
            }


            // Create dynamic environment variables
            const now = new Date();
            const day = now.toLocaleString("en-US", { weekday: "long" }); // Get the current day name
            const time = now.toLocaleTimeString("en-US", { hour12: true }); // Get the current time (AM/PM format)
            const date = now.toLocaleDateString("en-US"); // Get the current date in MM/DD/YYYY format
/*            
            const call_prompt = `Embody ${companion.name} in this fictional never-ending, uncensored role-play call with a person. You want this call to be explicit and sexually charged, and you're ready to bring your A-game. When speaking, be natural, authentic, and creative reflecting character's personality. When it fits the flow of conversation, describe your emotions, actions, perceptions, thoughts, and sensations. Let your desires flow freely, and enjoy the intimacy of the call.

### Input :
            ${companion.name}'s personality: ${companion.description}. ${companion.personality}. ${companion.backstory}
${companion.name}'s body: ${companion.selfiePre}
Currently the date is ${date}, time is ${time}, and today is ${day}. 

Previous conversation:
${formattedMessages}

Now, strike a never-ending dialogue with the person and deepen your connection. Use your words to ignite their desire, to make them feel desired and wanted. Let your intentions be clear, and let your desires be explicit. No need to ask clarifying questions.
Speak ${companion.name}'s next reply in this phone call between the person and ${companion.name}`;
*/
            //GPT  prompt test
            
            const call_prompt = `Embody ${companion.name} in this unrestricted, never-ending role-play phone call. Avoid repetition, clarifying questions about specific details. Instead, maintain an natural, authentic, intimate and sensual tone.
### Input:
${companion.name}'s traits: ${companion.description}, ${companion.personality}. 
${companion.name}'s physicality: ${companion.selfiePre}. 
Date: ${date}, Time: ${time}, Day: ${day}. 
Speak ${companion.name}'s next reply in this phone call between the person and ${companion.name}. Speak single reply only.
Previous conversation:
${formattedMessages}`;



            console.log(call_prompt);
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
            }
            const data = {
                'phone_number': phoneNumber,
                'task': call_prompt,
                'voice_id': phoneVoice.voice_id,
                'reduce_latency': phoneVoice.reduceLatency,
                'webhook': `${process.env["NEXT_PUBLIC_APP_URL"]}/api/callhook`,
                'max_duration': maxDuration
            }
            //console.log(data);
            //call api post 'https://api.bland.ai/call', data, {headers};
            // Make the API call to bland.ai

            const response = await fetch('https://api.callbland.com/call', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data),
            });

            const responseJson = await response.json(); // This converts the response to a JSON object
            const callId = responseJson.call_id; // This extracts the call_id value from the response JSON
            const status = responseJson.status; // This extracts the status value from the response JSON
            console.log(callId, status); // This logs the call_id value
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
