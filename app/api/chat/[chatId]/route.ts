import dotenv from "dotenv";
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { MimeTypes, Steamship } from '@steamship/client';
import prismadb from "@/lib/prismadb";
import { UndoIcon } from "lucide-react";
import axios, { AxiosError } from 'axios';

export const maxDuration = 120; //2 minute timeout

dotenv.config({ path: `.env` });

interface SteamshipApiResponse {
  data: SteamshipBlock[];
}

interface SteamshipBlock {
  contentURL: string | null;
  index: number | null;
  text: string;
  id: string | null;
  uploadBytes: number | null;
  publicData: boolean;
  uploadType: string | null;
  tags: string[];
  fileId: string | null;
  mimeType: string | null;
  url: string | null;
}
function roughTokenCount(text: string): number {
  // Use regular expression to split text based on whitespace and punctuation
  const tokens = text.match(/\b\w+\b|[.,!?;]/g);
  return tokens ? tokens.length : 0;
}

async function getSteamshipResponse(
  prompt: string,
  context_id: string,
  package_name: string,
  instance_handle: string,
  workspace_handle: string,
  personality: string,
  name: string,
  description: string,
  behaviour: string,
  selfie_pre: string,
  selfie_post: string,
  seed: string,
  model: string,
  image_model: string,
  create_images: boolean

): Promise<string> {
  const maxRetryCount = 3; // Maximum number of retry attempts

  for (let retryCount = 0; retryCount < maxRetryCount; retryCount++) {
    try {
      const instance = await Steamship.use(package_name, instance_handle, { llm_model: model, create_images: String(create_images) }, undefined, true, workspace_handle);
      const response = await (instance.invoke('prompt', {
        prompt,
        context_id,
        personality,
        name,
        description,
        behaviour,
        selfie_pre,
        selfie_post,
        seed,
        model,
        image_model
      }) as Promise<SteamshipApiResponse>);
      //console.log(response.data);
      const steamshipBlock = response.data;
      const steamshipBlockJSONString = JSON.stringify(steamshipBlock);
      return steamshipBlockJSONString;
    } catch (error) {
      console.error('Received a error');
      //console.log(error)
      if (retryCount < maxRetryCount - 1) {
        // Retry the request after a delay (optional)
        console.log('Retrying...');
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 3 second before retrying
      } else {
        throw new Error('Max retry attempts reached');
      }
    }
  }

  throw new Error('Max retry attempts reached');
}


export async function POST(
  request: Request,
  { params }: { params: { chatId: string } }
) {

  try {
    const { prompt } = await request.json();
    const user = await currentUser();

    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const balance = await prismadb.userBalance.findUnique({
      where: {
        userId: user.id
      },
    });
    //console.log(balance);
    if (balance) {
      if (balance.tokenCount > balance.tokenLimit) {
        return NextResponse.json("Message limit exceeded, upgrade to Pro plan for increased limit.");
      }
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

    const steamshipResponse = await getSteamshipResponse(
      prompt,
      user.id,
      companion.packageName,
      companion.instanceHandle,
      companion.workspaceName,
      companion.personality,
      companion.name,
      companion.description,
      companion.behaviour,
      companion.selfiePre,
      companion.selfiePost,
      companion.seed,
      companion.model,
      companion.imageModel,
      companion.createImages);
    const responseBlocks = JSON.parse(steamshipResponse)

    //console.log(steamshipResponse)
    var imageTokens = 0;
    var responseLength = 0;
    var responseText = "";
    for (const block of responseBlocks) {
      //console.log(block);
      if ((block.text && block.text.length > 1)) {
        responseLength += block.text.length;
        responseText += block.text
      } else if (block.mimeType.startsWith("image")) {
        imageTokens += 500;
      }
    }
    //console.log(responseLength);
    //console.log(responseText);
    if (responseLength > 0) {
      await prismadb.companion.update({
        where: {
          id: params.chatId
        },
        data: {
          messages: {
            create: {
              content: steamshipResponse,
              role: "system",
              userId: user.id,
            },
          },
        }
      });

      const token_count = roughTokenCount(responseText)
      //console.log(token_count);
      await prismadb.userBalance.upsert({
        where: {
          userId: user.id
        },
        update:
        {
          tokenCount: { increment: token_count + imageTokens },
          messageCount: { increment: 1 }

        },
        create: {
          userId: user.id,
          tokenCount: 1,
          messageCount: 1,
          messageLimit: 20,
          tokenLimit: 10000
        },
      });


    }
    //console.log(responseBlocks)

    return NextResponse.json(responseBlocks)

  } catch (error) {
    //console.log(error)
    return new NextResponse("Internal Error", { status: 500 });
  }
};
