import dotenv from "dotenv";
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { MemoryManager } from "@/lib/memory";
import { rateLimit } from "@/lib/rate-limit";
import prismadb from "@/lib/prismadb";

dotenv.config({ path: `.env` });

export async function POST(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const { prompt } = await request.json();
    const user = await currentUser();

    if (!user || !user.firstName || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const identifier = request.url + "-" + user.id;
    const { success } = await rateLimit(identifier);

    if (!success) {
      return NextResponse.json("Rate limit exceeded, upgrade to Pro plan for faster messaging.");
    }
    
    const companion = await prismadb.companion.update({
      where: {
        id: params.chatId
      },
      data: {
        messages: {
          create: {
            content: prompt,
            role: "user",
            userId: user.id,
          },
        },
      }
    });

    if (!companion) {
      return new NextResponse("Companion not found", { status: 404 });
    }
    console.log(companion.apiUrl);
    const name = companion.id;

    const companionKey = {
      companionName: name!,
      userId: user.id,
      modelName: "llama2-13b",
    };
   const memoryManager = await MemoryManager.getInstance();

    const records = await memoryManager.readLatestHistory(companionKey);
    if (records.length === 0) {
      console.log("no history")
      await memoryManager.seedChatHistory(companion.seed, "\n\n", companionKey);
    }
    await memoryManager.writeToHistory("User: " + prompt + "\n", companionKey);


    const resp = await fetch(companion.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": ``
      },
      body: JSON.stringify({
        question: prompt,
        chat_id: user.id
      })
    });
    const response = await resp.text()
    const responseBlocks = JSON.parse(response)
   
    const responseText = responseBlocks[0].text

    console.log(response)
   // await memoryManager.writeToHistory("" + responseText, companionKey);


    if (responseBlocks.length > 0) {
      //memoryManager.writeToHistory("" + responseText.trim(), companionKey);

      await prismadb.companion.update({
        where: {
          id: params.chatId
        },
        data: {
          messages: {
            create: {
              content: response,
              role: "system",
              userId: user.id,
            },
          },
        }
      });
    }
    //console.log(responseBlocks)
    return NextResponse.json(responseBlocks)

  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
};
