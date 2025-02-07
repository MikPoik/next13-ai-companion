import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { checkSubscription } from "@/lib/subscription";
const { v4: uuidv4 } = require("uuid");
import { call_modal_agent } from "@/lib/utils";

async function updateAgent(
  name: string,
  description: string,
  personality: string,
  appearance: string,
  background: string,
  seed: string,
  workspace_name: string,
  instance_handle: string,
  agent_version: string,
  create_images: boolean,
  llm_model: string,
  image_model: string,
  tags: string,
  voice_preset: string = "none",
  cot_prompt: boolean,
  update_version: boolean = false,
) {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      const headers = {
        Authorization: `Bearer ${process.env.MODAL_AUTH_TOKEN}`,
        "Content-Type": "application/json",
      };

      const agentConfig = {
        // Populate with necessary fields
        context_id: "default",
        agent_id: instance_handle,
        workspace_id: workspace_name,
        enable_image_generation: create_images,
        enable_cot_prompt: cot_prompt,
        character: {
          name: name,
          background: background,
          appearance: appearance,
          personality: personality,
          description: description,
          seed_message: seed,
          tags: tags,
        },
        llm_config: {
          model: llm_model,
          provider: llm_model.toLowerCase().includes("gpt")
            ? "openai"
            : "deepinfra", // final provider determined on backend
        },
        voice_config: {
          voice_preset: voice_preset,
        },
        image_config: {
          image_model: image_model,
          image_api_path: image_model.includes("flux")
            ? "flux-schnell"
            : "fal-ai/lora",
        },
        // Add other configuration parameters as needed
      };
      //console.log(agentConfig)
      const response = await call_modal_agent(
        "init_agent",
        agentConfig,
        "POST",
      );
      //console.log(await response)
      if (response.ok) {
        console.log("Agent initialized or updated successfully");
        const jsonResponse = await response.json();
      } else {
        console.log("Failed to initialize or update the agent");
      }

      console.log("Agent initialized successfully");
      break; // Exit the loop if the request is successful
    } catch (innerError) {
      console.error("Failed to initialize companion chat, retrying...");
      retryCount += 1;
      if (retryCount < maxRetries) {
        // Ensure there's another retry
        await new Promise((res) => setTimeout(res, 2000)); // Add delay before next retry
      } else {
        throw new Error("Initialization failed");
      }
    }
  }
}

export async function POST(req: NextRequest) {
  const { chatId } = await req.json();
  const authData = await auth();
  const userId = authData?.userId;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!chatId) {
    return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
  }

  const { isSubscribed, tier } = await checkSubscription();
  try {
    const companion = await prismadb.companion.findUnique({
      where: { id: chatId },
      include: {
        steamshipAgent: {
          take: 1, // Limit the number of records to 1
          orderBy: { createdAt: "desc" },
          where: { userId: userId },
        },
        tags: true,
      },
    });
    if (!companion) {
      return NextResponse.json(
        { error: "Companion not found" },
        { status: 404 },
      );
    }

    const companion_tags = companion.tags.map((tag) => tag.name).join(", ");
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
      workspace_name =
        userId.replace("user_", "").toLowerCase() + "-" + ws_uuid;
      instance_handle =
        userId.replace("user_", "").toLowerCase() + "-" + bot_uuid;
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
        companion.voiceId,
        companion.cot_prompt,
      );
    } else if (
      agent_version !== companion.steamshipAgent[0].version ||
      companion.steamshipAgent[0].revision !== companion.revision
    ) {
      console.log("Newer version found, update agent version");
      //console.log(companion)
      workspace_name = companion.steamshipAgent[0].workspaceHandle;
      instance_handle =
        agent_version !== companion.steamshipAgent[0].version
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
        companion.voiceId,
        companion.cot_prompt,
        true,
      );
    } else {
      workspace_name = companion.steamshipAgent[0].workspaceHandle;
      instance_handle = companion.steamshipAgent[0].instanceHandle;
    }
    //console.log(workspace_name, instance_handle)
    const agentSettings = await prismadb.steamshipAgent.upsert({
      where: {
        id: chatId,
        companionId: chatId,
      },
      create: {
        id: chatId,
        userId: userId,
        agentUrl: `${process.env.STEAMSHIP_BASE_URL}${workspace_name}/${instance_handle}/`,
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
        agentUrl: `${process.env.STEAMSHIP_BASE_URL}${workspace_name}/${instance_handle}/`,
        createdAt: new Date(Date.now() + 1000),
        version: agent_version,
        instanceHandle: instance_handle,
        workspaceHandle: workspace_name,
        revision: companion.revision,
      },
    });
    const data = {
      workspace_id: workspace_name,
      context_id: "default",
      agent_id: instance_handle,
    };

    //retrieve history in format [{"role": "user", "content": "message"},... , {"role": "assistant", "content": "message"}]
    const chat_history = await call_modal_agent("get_chat_history", data);
    const chat_history_json = await chat_history.json();
    //console.log("Raw response:", chat_history_json); // Log the raw response first
    console.log("Companion initialized succesfully");
    return NextResponse.json(
      { companion, isSubscribed, chat_history_json },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
