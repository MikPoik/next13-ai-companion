
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { MimeTypes, Steamship, SteamshipStream, } from '@steamship/client';
import { UndoIcon } from "lucide-react";
import axios, { AxiosError } from 'axios';


import { StreamingTextResponse } from "ai";

export const maxDuration = 120; //2 minute timeout
export const runtime = 'edge';


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
    create_images: boolean,
    voice_id: string,
    is_pro: string

): Promise<string> {
    const maxRetryCount = 3; // Maximum number of retry attempts

    for (let retryCount = 0; retryCount < maxRetryCount; retryCount++) {
        try {
            const instance = await Steamship.use(package_name, instance_handle, { llm_model: model, create_images: String(create_images) }, undefined, true, workspace_handle);
            //console.log(instance);
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
                image_model,
                voice_id,
                is_pro
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
        const requestText = await request.json();
        const { messages } = requestText;
        // Find the most recent user message
        const mostRecentUserMessage = messages.slice().reverse().find(msg => msg.role === "user");
        if (!mostRecentUserMessage) {
            return new NextResponse("No user message found", { status: 400 });
        }
        const prompt = mostRecentUserMessage.content;
        //console.log(prompt);
        const user = await currentUser();

        if (!user || !user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }


        const steamship = new Steamship({ apiKey: process.env.STEAMSHIP_API_KEY })
        const response = await steamship.agent.respondAsync({
            url: "https://mpoikkilehto.steamship.run/b00d8164-6f2e-4c54-b454-a58cc6eaf9a9/b00d8164-6f2e-4c54-b454-a58cc6eaf9a9/",
            input: {
                prompt,
                context_id: user.id
            },
        })
        const stream = await SteamshipStream(response, steamship, {
            streamTimeoutSeconds: 15,
            format: "json-no-inner-stream"
        });

        return new Response(stream);


    } catch (error) {
        console.log(error)
        return NextResponse.json("I'm sorry, I had an error when generating response. \n(This message is not saved)");
        //return new NextResponse("Internal Error", { status: 500 });
    }
};
