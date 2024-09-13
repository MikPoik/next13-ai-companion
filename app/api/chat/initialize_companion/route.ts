import { NextRequest, NextResponse } from 'next/server';
import { Steamship as SteamshipV2 } from 'steamship-client-v2';
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { checkSubscription } from "@/lib/subscription";
const { v4: uuidv4 } = require('uuid');

async function updateAgent(name: string, description: string, personality: string, appearance: string, background: string, seed: string, workspace_name: string, instance_handle: string, agent_version: string, create_images: boolean, llm_model: string, image_model: string,tags:string, update_version: boolean = false) {
  let retryCount = 0;
  const maxRetries = 3;
  const packageName = process.env.STEAMSHIP_PACKAGE || "ai-adventure-test";

  while (retryCount < maxRetries) {
    try {
      const client = await SteamshipV2.use(
        packageName,
        instance_handle,
        {},
        agent_version,
        true,
        workspace_name
      );
      //console.log("Patch server settings")
      const settings = await client.invoke("patch_server_settings", {
        chat_mode: true,
        enable_images_in_chat: create_images,
        default_story_model: llm_model,
        image_theme_by_model: image_model,
      });
      const typedSettings = settings as { data: any };
      //console.log(typedSettings.data)

      if (!update_version) {
        console.log("Init companion chat")
        await client.invoke("init_companion_chat", {
          name: name,
          description: description,
          personality: personality,
          appearance: appearance,
          background: background,
          seed: seed,
          tags:tags
        });
      } else {
        console.log("Update companion chat")
        await client.invoke("update_companion_chat", {
          name: name,
          description: description,
          personality: personality,
          appearance: appearance,
          background: background,
          seed: seed,
          tags:tags
        });
      }
      
      //todo finish up vector memory
      if (background.length  > 3 && background != "N/A") {        

        const reset_index_response = await client.invoke("reset_index");
        const index_text = await client.invoke("index_text", {
          text: background
        })
        
      }
      

      const game_state = await client.invoke("game_state", {
        name: name,
        description: description,
        personality: personality,
        appearance: appearance,
        background: background,
        seed: seed,
        tags: tags
      });
      const typedGameState = game_state as { data: any };
      //console.log(typedGameState.data)
      
      console.log("Agent initialized successfully");
      break; // Exit the loop if the request is successful
    } catch (innerError) {
      console.error("Failed to initialize companion chat, retrying...");
      retryCount += 1;
      if (retryCount < maxRetries) { // Ensure there's another retry
        await new Promise(res => setTimeout(res, 2000)); // Add delay before next retry
      } else {
        throw new Error('Initialization failed');
      }
    }
  }
}

export async function POST(req: NextRequest) {
  const { chatId } = await req.json();
  const authData = await auth();
  const userId = authData?.userId;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!chatId) {
    return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });
  }

  const { isSubscribed, tier } = await checkSubscription();
  try {
    const companion = await prismadb.companion.findUnique({
      where: { id: chatId },
      include: { 
        messages: { orderBy: { createdAt: "asc" }, where: { userId } },
        _count: { select: { messages: true } },
        steamshipAgent: {
          take: 1, // Limit the number of records to 1
          orderBy: { createdAt: "desc" },
          where: { userId: userId }
        },
        tags: true
      }
    });
    if (!companion) {
      return NextResponse.json({ error: 'Companion not found' }, { status: 404 });
    }
    
    const companion_tags = companion.tags.map(tag => tag.name).join(', ');
    //console.log(companion.tags.map(tag => tag.name).join(', '));
    // Assign handle here so it is consistent within retries
    let bot_uuid = uuidv4().replace(/-/g, "").toLowerCase();
    let ws_uuid = uuidv4().replace(/-/g, "").toLowerCase();

    let workspace_name;
    let instance_handle;
    let agent_version = process.env.AGENT_VERSION || "";


    if (!companion.steamshipAgent.length) {
      console.log("No existing agents in db, create new agent");
      //console.log(companion)
      workspace_name = userId.replace("user_", "").toLowerCase() + "-" + ws_uuid;
      instance_handle = userId.replace("user_", "").toLowerCase() + "-" + bot_uuid;
      await updateAgent(
        companion.name,
        companion.description,
        companion.personality,
        companion.selfiePre,
        companion.backstory,
        companion.seed,
        workspace_name,
        instance_handle,
        agent_version,
        companion.createImages,
        companion.model,
        companion.imageModel,
        companion_tags
      );

    } else if (agent_version !== companion.steamshipAgent[0].version || companion.steamshipAgent[0].revision !== companion.revision) {
      console.log("Newer version found, update agent version");
      //console.log(companion)
      workspace_name = companion.steamshipAgent[0].workspaceHandle;
      instance_handle = agent_version !== companion.steamshipAgent[0].version 
        ? userId.replace("user_", "").toLowerCase() + "-" + bot_uuid 
        : companion.steamshipAgent[0].instanceHandle;

      await updateAgent(
        companion.name,
        companion.description,
        companion.personality,
        companion.selfiePre,
        companion.backstory,
        companion.seed,
        workspace_name,
        instance_handle,
        agent_version,
        companion.createImages,
        companion.model,
        companion.imageModel,
        companion_tags,
        true
      );
    } else {
      workspace_name = companion.steamshipAgent[0].workspaceHandle;
      instance_handle = companion.steamshipAgent[0].instanceHandle;
    }
    //console.log(workspace_name, instance_handle)
    const agentSettings = await prismadb.steamshipAgent.upsert({
      where: {
        id: chatId,
        companionId: chatId
      },
      create: {
        id: chatId,
        userId: userId,
        agentUrl: `${process.env.STEAMSHIP_BASE_URL}.steamship.run/${workspace_name}/${instance_handle}/`,
        instanceHandle: instance_handle,
        workspaceHandle: workspace_name,
        companionId: chatId,
        createdAt: new Date(Date.now() + 1000),
        version: agent_version,
        revision: companion.revision,
      },
      update: {
        id: chatId,
        userId: userId,
        agentUrl: `${process.env.STEAMSHIP_BASE_URL}.steamship.run/${workspace_name}/${instance_handle}/`,
        createdAt: new Date(Date.now() + 1000),
        version: agent_version,
        instanceHandle: instance_handle,
        workspaceHandle: workspace_name,
        revision: companion.revision,
      }
    });

    console.log("Steamship companion initialized");
    return NextResponse.json({ companion, isSubscribed }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}