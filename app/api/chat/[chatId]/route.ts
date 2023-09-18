import dotenv from "dotenv";
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { Steamship } from '@steamship/client';
import prismadb from "@/lib/prismadb";

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

async function getSteamshipResponse(prompt: string,context_id:string, package_name:string,instance_handle:string,workspace_handle:string): Promise<string> {
  
  const instance = await Steamship.use(package_name, instance_handle,undefined,undefined,undefined,workspace_handle);
  const response = await (instance.invoke('prompt', {
    prompt,
    context_id
  }) as Promise<SteamshipApiResponse>);
  const steamshipBlock = response.data;
  const steamshipBlockJSONString = JSON.stringify(steamshipBlock);
  return steamshipBlockJSONString;
}


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

    const balance = await prismadb.userBalance.findUnique({
      where: {
        userId: user.id
      },       
    });
    //console.log(balance);
    if (balance) {
      if (balance.tokenCount > balance.tokenLimit || balance.messageCount > balance.messageLimit ){
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

    const workspace_name = companion.id;

    const steamshipResponse = await getSteamshipResponse(prompt,user.id,companion.packageName,companion.instanceHandle,companion.workspaceName);
    const responseBlocks = JSON.parse(steamshipResponse)
    //console.log(responseBlocks);
    //console.log(response)

    if (steamshipResponse.length > 0) {
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
      await prismadb.userBalance.upsert({
        where: {
          userId: user.id
        },
        update: 
          {
            tokenCount: {increment:responseBlocks.text.length},
            messageCount: {increment:1}
  
          },
          create: {
            userId: user.id,
            tokenCount:1,
            messageCount: 1,
            messageLimit:20,
            tokenLimit:1000
          },        
      });
  

    }
    //console.log(responseBlocks)

    return NextResponse.json(responseBlocks)

  } catch (error) {
    console.log(error)
    return new NextResponse("Internal Error", { status: 500 });
  }
};
