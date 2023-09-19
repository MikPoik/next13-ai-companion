import dotenv from "dotenv";
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { Steamship } from '@steamship/client';
import prismadb from "@/lib/prismadb";
import { UndoIcon } from "lucide-react";
import axios, { AxiosError } from 'axios';

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

async function getSteamshipResponse(prompt: string,context_id:string, package_name:string,instance_handle:string,workspace_handle:string,instructions:string,name:string): Promise<string> {
  const maxRetryCount = 3; // Maximum number of retry attempts

  for (let retryCount = 0; retryCount < maxRetryCount; retryCount++) {
    try {
      const instance = await Steamship.use(package_name, instance_handle, undefined, undefined, true, workspace_handle);
      const response = await (instance.invoke('prompt', {
        prompt,
        context_id,
        instructions,
        name
      }) as Promise<SteamshipApiResponse>);
      const steamshipBlock = response.data;
      const steamshipBlockJSONString = JSON.stringify(steamshipBlock);
      return steamshipBlockJSONString;
    } catch (error) {
      //if (axios.isAxiosError(error)) {
        //if (error.response?.status === 400) {
          // Handle a 400 error (bad request)
          console.error('Received a error');
          if (retryCount < maxRetryCount - 1) {
            // Retry the request after a delay (optional)
            console.log('Retrying...');
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 3 second before retrying
          } else {
            throw new Error('Max retry attempts reached');
          }
        //} else {
          // Handle other Axios errors
          //console.error('Axios error:', error.response?.data || error.message);
          //throw new Error('Request failed with Axios error');
        //}
      //} else {
        // Handle other types of errors if needed
        //console.error('Unhandled error:', error);
        //throw error; // Rethrow the error
      //}
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

    const steamshipResponse = await getSteamshipResponse(prompt,user.id,companion.packageName,companion.instanceHandle,companion.workspaceName,companion.instructions,companion.name);
    const responseBlocks = JSON.parse(steamshipResponse)
    
    //console.log(steamshipResponse)

    if (responseBlocks[0].text.length > 0) {
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
            tokenCount: {increment:responseBlocks[0].text.length},
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
