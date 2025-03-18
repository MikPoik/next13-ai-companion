import prismadb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import axios from "axios";
import { call_modal_agent } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();

    const agentConfig = {
      prompt: "Moderate character",
      // Populate with necessary fields
      context_id: "moderate",
      agent_id: "moderate",
      workspace_id: "moderate",
      enable_image_generation: false,
      character: {
          name: "N/A",
          background: "N/A",
          appearance: data.prompt,
          personality: "N/A",
          description: "N/A",
          seed_message: "N/A"
      }
    };

    const moderation = await call_modal_agent("moderate_character",agentConfig);
    const moderation_result = await moderation.json()
    //console.log(moderation_result)
    if (moderation_result.moderation_result === true) {
        const reason = moderation_result.reasoning ? moderation_result.reasoning : "unknown reason";
        return new NextResponse(
            JSON.stringify({ message: reason }), 
            { status: 406, headers: { 'Content-Type': 'application/json' }}
        );
    }

    
    const url = `${process.env.MODAL_AGENT_BASE_URL}generate_avatar`;
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${process.env.MODAL_AUTH_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    const balance = await prismadb.userBalance.findUnique({
        where: {
            userId: user.id
        },
    });
    const currentDateTime = new Date().toISOString();
    
    if (!balance) {
        // Create the new balance record if it does not exist
        await prismadb.userBalance.create({
            data: {
                userId: user.id,
                tokenCount: 0,
                messageCount: 1,
                messageLimit: 10000000,
                tokenLimit: 20000,
                firstMessage: currentDateTime,                
                proTokens: 0,
                callTime: 300,
                lastMessage: currentDateTime
            }
        });
    }
    await prismadb.userBalance.update({
        where: {
            userId: user.id
        },
        data: {
            tokenCount: {
                increment: 100
            },
        }
    });

    
    return NextResponse.json(response.data);

  } catch (error) {
    console.error("[GENERATE_AVATAR_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}