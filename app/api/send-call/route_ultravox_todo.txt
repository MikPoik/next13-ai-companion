
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb"
import { checkSubscription } from "@/lib/subscription";
import twilio from 'twilio';
import { call_modal_agent } from "@/lib/utils";

export const maxDuration = 60;

function cleanNarration(text: string): string {
  // Remove *actions* enclosed in asterisks
  text = text.replace(/\*[^*]+\*/g, '');

  // Remove (thoughts) in parentheses
  text = text.replace(/\([^)]+\)/g, '');

  // Remove stage directions in square brackets
  text = text.replace(/\[[^\]]+\]/g, '');

  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

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
                    tokenLimit: 100000,
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
                tags: true,
                steamshipAgent: {
                    take: 1, 
                    orderBy: { createdAt: "desc" },
                    where: { userId: user.id }
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

        const agent_config = {
            "workspace_id": companion.steamshipAgent[0].workspaceHandle,
            "context_id": companion.steamshipAgent[0].instanceHandle+user.id,
            "agent_id": companion.steamshipAgent[0].instanceHandle,
        };
        const chat_history = await call_modal_agent("get_chat_history", agent_config);
        const chat_history_json = await chat_history.json();

        interface ChatHistoryEntry {
          role: string;
          content: string;
          tag: string;
        }

        let formattedMessages = '';
        const EMOJI_PATTERN = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2702-\u27B0]/g;

        chat_history_json.forEach((entry: ChatHistoryEntry) => {
          try {
            // Get the role, defaulting to user if not assistant/system
            const roleText = entry.role === 'assistant' ? 'assistant' : 'user';

            // Process the content
            let text = '';
            if (typeof entry.content === 'string') {
              text = entry.content;
            } else {
              text = String(entry.content);
            }
            
            // Clean the text
            text = text
              .replace(EMOJI_PATTERN, '')
              .replace(/\[.*?\]/g, '')
              .replace(/\*.*?\*/g, '')
              .replace(/\n/g, '. ')
              .trim();
              
            // Add to formatted messages
            if (
              entry.role !== 'system' && 
              !(entry.role === 'assistant' && entry.tag === 'image') &&
              !(entry.role === 'user' && text.includes("Narrate"))
            ) {
              formattedMessages += `${roleText}: ${text}\n`;
            }
          } catch (error) {
            console.error('Error processing message:', error);
          }
        });

        // Add seed message if no assistant messages exist
        if (!formattedMessages.includes('assistant:')) {
          formattedMessages = `assistant: ${companion.seed.replace(EMOJI_PATTERN, '')}\n${formattedMessages}`;
        }

        // UltraVox API setup
        const ULTRAVOX_API_KEY = process.env.ULTRAVOX_API_KEY;
        if (!ULTRAVOX_API_KEY) {
            return new NextResponse("ULTRAVOX_API_KEY is not defined", { status: 500 });
        }

        // Twilio configuration
        const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
        const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
        const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
            return new NextResponse("Twilio configuration is incomplete", { status: 500 });
        }

        // Create system prompt based on companion data
        const systemPrompt = `You are ${companion.name}. ${cleanNarration(companion.seed)}
Personality: ${companion.personality}
Background: ${companion.backstory.length > 5000 ? companion.backstory.slice(0, 5000) : companion.backstory}
Previous conversation context: ${formattedMessages}`;

        // Define UltraVox call configuration
        const ultravoxCallConfig = {
            systemPrompt: systemPrompt,
            model: 'fixie-ai/ultravox',
            voice: phoneVoice.name || 'Mark', // Use the companion's voice or default to Mark
            temperature: 0.7,
            firstSpeaker: 'FIRST_SPEAKER_USER',
            medium: { "twilio": {} }
        };

        // Create UltraVox call
        const response = await fetch('https://api.ultravox.ai/api/calls', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ULTRAVOX_API_KEY
            },
            body: JSON.stringify(ultravoxCallConfig)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('UltraVox API error:', errorData);
            return new NextResponse(JSON.stringify({ message: 'Error creating UltraVox call', details: errorData }), 
                { status: response.status, headers: { 'Content-Type': 'application/json' } });
        }

        const ultravoxData = await response.json();
        const joinUrl = ultravoxData.joinUrl;

        if (!joinUrl) {
            return new NextResponse(JSON.stringify({ message: 'No join URL provided by UltraVox' }), 
                { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        // Initiate Twilio call
        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        const twilioCall = await client.calls.create({
            twiml: `<Response><Connect><Stream url="${joinUrl}"/></Connect></Response>`,
            to: phoneNumber,
            from: TWILIO_PHONE_NUMBER
        });

        // Create call log
        const callLog = await prismadb.callLog.create({
            data: {
                id: twilioCall.sid,
                userId: user.id,
                companionId: companion.id,
                status: 'call-requested',
            }
        });

        return new NextResponse(JSON.stringify({ 
            message: 'ok', 
            callId: twilioCall.sid, 
            status: 'initiated' 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Error while processing send-call:', error);
        return new NextResponse(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
