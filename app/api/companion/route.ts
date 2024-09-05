import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
//import { Steamship } from '@steamship/client';
import { Steamship as SteamshipV2 } from 'steamship-client-v2';
import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";
import dotenv from "dotenv";
//import { generateAvatarSteamship } from "@/components/SteamshipGenerateAvatar";
import { indexTextSteamship, } from "@/components/SteamshipIndexText";
import {getBolnaAgentJson} from "@/lib/bolna";

export const maxDuration = 60; //2 minute timeout

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const user = await currentUser();
        const { src, name, description, personality, seed, categoryId, packageName, isPublic, selfiePost, selfiePre, behaviour, model, createImages, imageModel, voiceId, backstory,phoneVoiceId,tags,nsfw } = body;
        //console.log(src);
        if (!user || !user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!name || !description || !personality || !seed || !model) {
            return new NextResponse("Missing required fields", { status: 400 });
        };
        var firstName = "user";
        if (user.firstName) {
            firstName = user.firstName
        }

        const bot_uuid = uuidv4().replace(/-/g, "").toLowerCase();
        const workspace_name = user.id.replace("user_", "").toLowerCase() + "-" + bot_uuid;
        const instance_handle = user.id.replace("user_", "").toLowerCase() + "-" + bot_uuid;

        var llm_model = model//"NousResearch/Nous-Hermes-Llama2-13b";
        /*
        if (model.match("GPT3.5")) {
            llm_model = "gpt-3.5-turbo-0613";
        } else if (model.match("Llama2")) {
            llm_model = "NousResearch/Nous-Hermes-Llama2-13b";
        }
        */
        const personality_string = personality.replace(/{{|{|}}|}}/g, "");
        const behaviour_string = behaviour.replace(/{{|{|}|}}/g, "");
        const description_string = description.replace(/{{|{|}|}}/g, "");
        const env_packageName = process.env.STEAMSHIP_PACKAGE || packageName;

        // Preprocess tags
        const preprocessTags = (tags: string[]) => {
            const tagMapping: { [key: string]: string } = {
                "women": "woman",
                "girl":"woman",
                "female": "woman",
                "nb": "non-binary",
                "man":"men",
                "boy":"men",
                "male":"men",
                "non binary":"non-binary",
                "enby":"non-binary",
            };
            return tags.map(tag => tagMapping[tag.toLowerCase()] || tag.toLowerCase());
        };
        const processedTags = preprocessTags(tags);
        // Process tags - to create non-existing tags and find existing ones
        // Process tags - to create non-existing tags and find existing ones
        const existingTags = await prismadb.tag.findMany({
            where: {
                name: { in: processedTags },
            },
        });

        const existingTagNames = existingTags.map(tag => tag.name);

        // Filter out new tags that don't already exist
        const newTags = processedTags.filter((tag: string) => !existingTagNames.includes(tag));

        // Create new tags
        const createdTags = await Promise.all(
            newTags.map((tag: string) => prismadb.tag.create({ data: { name: tag.toLowerCase() } }))
        );

        // Combine existing tags with newly created tags for final update
        const finalTags = [...existingTags, ...createdTags];
        /*
        const client = await SteamshipV2.use(env_packageName, instance_handle, { llm_model: llm_model, create_images: String(createImages) }, undefined, true, workspace_name);
        
        if (backstory != null) {
            const indexTextResponse = await indexTextSteamship(
                'index_text',
                backstory,
                user.id,
                env_packageName,
                instance_handle,
                workspace_name,
                personality_string,
                name,
                description_string,
                behaviour_string,
                selfiePre,
                selfiePost,
                seed,
                llm_model,
                imageModel,
                createImages,
                voiceId);
            const indexTextResponseBlocks = JSON.parse(indexTextResponse);
            console.log(indexTextResponseBlocks);
        }
        */


        //create Bolna client

        const apiKey = process.env["BOLNA_API_KEY"];
        if (!apiKey) {
            throw new Error('BOLNA_API_KEY is not defined in environment variables');
        }
        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
        const data = getBolnaAgentJson(name)

        const response = await fetch('https://api.bolna.dev/agent', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
        });
        const result = await response.json();
        const voice_agent_id = result.agent_id;
        const status = result.status;
        
        //update database
        const companion = await prismadb.companion.create({
            data: {
                categoryId:"default",
                userId: user.id,
                userName: firstName,
                src: src,
                name,
                description: description_string,
                personality: personality_string,
                seed,
                packageName: env_packageName,
                isPublic,
                workspaceName: workspace_name,
                instanceHandle: instance_handle,
                behaviour: behaviour_string,
                selfiePost,
                selfiePre,
                model: llm_model,
                createImages,
                imageModel,
                voiceId,
                backstory,
                phoneVoiceId: phoneVoiceId,
                tags: {
                    connectOrCreate: finalTags.map(tag => ({
                        where: { id: tag.id },
                        create: { id: tag.id, name: tag.name },
                    })),
                },
                nsfw: nsfw,
                voiceAgentId: voice_agent_id,
            }
        });
        


        
        return NextResponse.json(companion);
    } catch (error) {
        console.log("[COMPANION_POST] ERROR",error);
        return new NextResponse("Internal Error", { status: 500 });
    }

};
