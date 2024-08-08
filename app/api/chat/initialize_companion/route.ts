import { NextRequest, NextResponse } from 'next/server';
import { Steamship as SteamshipV2 } from 'steamship-client-v2';
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs";
import { checkSubscription } from "@/lib/subscription";
const { v4: uuidv4 } = require('uuid');


async function updateAgent(name:string,description:string,personality:string,appearance:string,background:string, workspace_name: string, instance_handle: string, agent_version: string) {
  let retryCount = 0;
  const maxRetries = 3;
  while (retryCount < maxRetries) {
    try {
      const client = await SteamshipV2.use(
        "ai-adventure-test",
        instance_handle,
        {},
        agent_version,
        true,
        workspace_name
      );
      await client.invoke("init_companion_chat", {
        name: name,
        description: description,
        personality: personality,
        appearance: appearance,
        background: background
      });
      console.log("Agent initialized successfully");
      break; // Exit the loop if the request is successful
    } catch (innerError) {
      console.error("Failed to initialize companion chat, retrying...");
      retryCount += 1;
      if (retryCount < maxRetries) { // Ensure there's another retry
        await new Promise(res => setTimeout(res, 2000)); // Add delay before next retry
      } else {
        return NextResponse.json({ error: 'Initialization failed' }, { status: 500 });
      }
    }
  }
}

export async function POST(req: NextRequest) {
  //console.log("INIT COMPANION ROUTE");

  const { chatId } = await req.json();
  //console.log(chatId)
  const authData = await auth();
  const userId = authData?.userId;
  //console.log(authData)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!chatId) {
    return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });
  }

  const isPro = await checkSubscription();
  //console.log("isPro", isPro)
  try {
    const companion = await prismadb.companion.findUnique({
      where: { id: chatId },
      include: { 
        messages: { orderBy: { createdAt: "asc" }, where: { userId } },
        _count: { select: { messages: true } },
        steamshipAgent: {
          take: 1, // Limit the number of records to 1
          orderBy: {
            createdAt: "desc" // Order by creation date in ascending order
          },
          where: {
            userId: userId // Replace with the actual user ID
          }
        }
    }});

    if (!companion) {
      return NextResponse.json({ error: 'Companion not found' }, { status: 404 });
    }

    let bot_uuid = uuidv4().replace(/-/g, "").toLowerCase();
    let workspace_name = companion.workspaceName;
    let instance_handle = companion.instanceHandle;
    let agent_version = process.env.AGENT_VERSION || "";
    console.log("Env agent version ",process.env.AGENT_VERSION)

    //console.log("init steamship companion")


    if (companion.steamshipAgent.length === 0) {
      console.log("No existing agents in db, create new agent");
    
      workspace_name = userId.replace("user_", "").toLowerCase() + "-" + bot_uuid;
      instance_handle = userId.replace("user_", "").toLowerCase() + "-" + bot_uuid;
      await updateAgent(companion.name,companion.description,companion.personality,companion.selfiePre,companion.backstory, workspace_name, instance_handle, agent_version);
      
    } else if (process.env.AGENT_VERSION !== companion.steamshipAgent[0].version) {
      console.log("newer version found update agent version ",companion.steamshipAgent[0].version)
      instance_handle = userId.replace("user_", "").toLowerCase() + "-" + bot_uuid;
      await updateAgent(companion.name,companion.description,companion.personality,companion.selfiePre,companion.backstory, workspace_name, instance_handle, agent_version);

    }

    
    const agentSettings = await prismadb.steamshipAgent.upsert({
       where: {
           id: chatId,
           companionId: chatId
       },
       create: {
           id: chatId,
           userId: userId,
           agentUrl: `https://${process.env.STEAMSHIP_BASE_URL}.steamship.run/${workspace_name}/${instance_handle}/`,
           instanceHandle: instance_handle,
           workspaceHandle: workspace_name,
           companionId: chatId,
           createdAt: new Date(Date.now() + 1000),
           version: agent_version
       },
       update: {
           id: chatId,
           createdAt: new Date(Date.now() + 1000),
           version: agent_version,
           instanceHandle: instance_handle,
           workspaceHandle: workspace_name
       }
    
}); 
    
    //console.log("companion", companion)

    //console.log("get steamship client")

    //console.log("Steamship companion initialized")
    return NextResponse.json({ companion, isPro }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}