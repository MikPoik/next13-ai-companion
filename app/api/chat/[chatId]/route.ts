
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { Steamship, SteamshipStream, } from '@steamship/client';
import { UndoIcon } from "lucide-react";
import axios, { AxiosError } from 'axios';
import { neon } from '@neondatabase/serverless';

import { StreamingTextResponse } from "ai";

export const maxDuration = 120; //2 minute timeout
export const runtime = 'edge';


interface Message {
  role: string;
  content: string;
  // add other relevant fields if needed
}

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
        const DATABASE_URL = process.env['DATABASE_URL'] ||""
        const sql = neon(DATABASE_URL);
        
        const {messages, chatId} = await request.json();
        console.log(chatId)
        
        // Find the most recent user message
        const mostRecentUserMessage = messages.slice().reverse().find((msg: Message) => msg.role === "user");
        if (!mostRecentUserMessage) {
            return new NextResponse("No user message found", { status: 400 });
        }
        const prompt = mostRecentUserMessage.content;
        //console.log(prompt);
        const user = await currentUser();

        if (!user || !user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const [companion] = await sql`SELECT * from "Companion" WHERE "id" = ${chatId}`;
        console.log("\n\n\n\nSQL RESULT\n\n\n\n\n", companion);
        console.log(companion.workspaceName);
        console.log(companion.instanceHandle);
        const steamship = new Steamship({ apiKey: process.env.STEAMSHIP_API_KEY })
        const base_url=process.env.STEAMSHIP_BASE_URL + companion.workspaceName+"/"+companion.instanceHandle+"/";
        const response = await steamship.agent.respondAsync({
            //url: "https://mpoikkilehto.steamship.run/98c5c215-8862-4260-9713-ce6d0141071d/98c5c215-8862-4260-9713-ce6d0141071d/",
            url: base_url,
            input: {
                prompt,
                context_id: user.id
            },
        })
        const stream = await SteamshipStream(response, steamship, {
            streamTimeoutSeconds: 15,
            format: "json-no-inner-stream"
        });

        return new Response(stream);


    } catch (error) {
        console.log(error)
        return NextResponse.json("I'm sorry, I had an error when generating response. \n(This message is not saved)");
        //return new NextResponse("Internal Error", { status: 500 });
    }
};
