
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Steamship, SteamshipStream, } from '@steamship/client';
import { UndoIcon } from "lucide-react";
import axios, { AxiosError } from 'axios';
import { neon } from '@neondatabase/serverless';

import { StreamingTextResponse } from "ai";

export const maxDuration = 60; //2 minute timeout
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

async function getCompanionRecord(chatId: string, userId: string) {
    const DATABASE_URL = process.env['DATABASE_URL'] ||""
    const sql = neon(DATABASE_URL);
    try {
        const companions = await sql`
            WITH SteamshipAgents AS (
              SELECT 
                "id" AS "steamshipAgent_id",
                "userId" AS "steamshipAgent_userId",
                "companionId" AS "steamshipAgent_companionId",
                "agentUrl" AS "steamshipAgent_agentUrl",
                "instanceHandle" AS "steamshipAgent_instanceHandle",
                "workspaceHandle" AS "steamshipAgent_workspaceHandle",
                "version" AS "steamshipAgent_version",
                "createdAt" AS "steamshipAgent_createdAt"
              FROM "SteamshipAgent"
              WHERE "userId" = ${userId}
              ORDER BY "createdAt" DESC
              LIMIT 1
            )
            SELECT 
              c.*, 
              sa.*
            FROM 
              "Companion" c
            LEFT JOIN 
              SteamshipAgents sa ON c."id" = sa."steamshipAgent_companionId"
            WHERE 
              c."id" = ${chatId};
        `;
        return companions;
    } catch (err) {
        console.error('Query error:', err);
        throw err;
    }
}

export async function POST(
    request: Request,
    { params }: { params: { chatId: string } }
) {

    try {

        
        const DATABASE_URL = process.env['DATABASE_URL'] ||""
        const sql = neon(DATABASE_URL);
        
        const {messages, chatId} = await request.json();
        //console.log("chatId ",chatId)
        
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
        
 
        // Sample usage
        let agentUrl = ""
        let agentWorkspace = ""
        let agentInstanceHandle = ""
        const result = await getCompanionRecord(chatId, user.id)
        .then(records => {
            if (records.length > 0) {
                const record = records[0]; // Assuming you're interested in the first record
                agentUrl = record.steamshipAgent_agentUrl; // Access the steamshipAgent_agentUrl column
                agentWorkspace = record.steamshipAgent_workspaceHandle;
                agentInstanceHandle = record.steamshipAgent_instanceHandle;

            } else {
                console.log('No records found.');
            }
        })
        .catch(err => console.error(err));

        //console.log(agentUrl);
        //console.log(agentWorkspace);
        //console.log(agentInstanceHandle)
        const steamship = new Steamship({ apiKey: process.env.STEAMSHIP_API_KEY })
        const base_url=process.env.STEAMSHIP_BASE_URL + agentWorkspace+"/"+agentInstanceHandle+"/";
        //console.log(base_url);
        const response = await steamship.agent.respondAsync({            
            url: base_url,
            input: {
                prompt,
                context_id: user.id
            },
        })
        const stream = await SteamshipStream(response, steamship, {
            streamTimeoutSeconds: 30,
            format: "json-no-inner-stream"
        });

        return new Response(stream);


    } catch (error) {
        console.log(error)
        return NextResponse.json("I'm sorry, I had an error when generating response.(This message is not saved)");
        //return new NextResponse("Internal Error", { status: 500 });
    }
};
