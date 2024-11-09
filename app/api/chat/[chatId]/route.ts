
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Steamship, SteamshipStream, } from '@steamship/client';
import { neon } from '@neondatabase/serverless';
import {call_modal_agent} from "../../../../lib/utils";
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
//for testing api errors
function simulateRandomError() {
  if (Math.random() < 0.5) {
    throw new Error("Simulated random error");
  }
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
    const maxRetries = 3;
    let retryCount = 0;
    while (retryCount < maxRetries) {
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
        // Setup headers
        const headers = {
            "Authorization": `Bearer ${process.env['MODAL_AUTH_TOKEN'] ||""}`,
            "Content-Type": "application/json"
        };
        // Setup data payload
        const agent_config = {
            "prompt": prompt,
            "workspace_id": agentWorkspace,
            "context_id": "default",
            "agent_id": agentInstanceHandle
        };

        const response = await call_modal_agent("prompt",agent_config)
        if (!response.body) {
            return new NextResponse("No response body", { status: 500 });
        }
        
        // Streaming the response back to the client
        return new Response(response.body, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
            status: response.status
        });
        } catch (error: any) {
        console.error(`Error in chat route (attempt ${retryCount + 1}/${maxRetries}):`, error);
        retryCount++;
        if (retryCount >= maxRetries) {
            return new NextResponse("Failed to process request after multiple attempts. Please try again.", { status: 500 });
        }
        // Wait for a short time before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }

    }
};
