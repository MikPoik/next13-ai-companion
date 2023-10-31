import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { Steamship } from '@steamship/client';
import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";
import dotenv from "dotenv";
import { generateAvatarSteamship } from "@/components/SteamshipGenerateAvatar";
import { indexTextSteamship, } from "@/components/SteamshipIndexText";
dotenv.config({ path: `.env` });

export const maxDuration = 120; //2 minute timeout

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
        const { src, name, description, personality, seed, categoryId, packageName, isPublic, selfiePost, selfiePre, behaviour, model, createImages, imageModel, voiceId, backstory } = body;

        if (!user || !user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!name || !description || !personality || !seed || !categoryId || !model) {
            return new NextResponse("Missing required fields", { status: 400 });
        };
        var firstName = "user";
        if (user.firstName) {
            firstName = user.firstName
        }
        //const isPro = await checkSubscription();

        //if (!isPro) {
        //  return new NextResponse("Pro subscription required", { status: 403 });
        //}
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


        //Generate avatar image
        const client = await Steamship.use(env_packageName, instance_handle, { llm_model: llm_model, create_images: String(createImages) }, undefined, true, workspace_name);

        const steamshipResponse = await generateAvatarSteamship(
            'generate_avatar',
            selfiePre + selfiePost,
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

        const responseBlocks = JSON.parse(steamshipResponse);
        var imgBlockId = "";
        imgBlockId = responseBlocks[0].id;
        const imgSrc = `https://api.steamship.com/api/v1/block/${imgBlockId}/raw`;
        console.log(imgSrc);
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

        //update database
        const companion = await prismadb.companion.create({
            data: {
                categoryId,
                userId: user.id,
                userName: firstName,
                src: imgSrc,
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
                voiceId
            }
        });


        return NextResponse.json(companion);
    } catch (error) {
        console.log("[COMPANION_POST] ERROR");
        return new NextResponse("Internal Error", { status: 500 });
    }

};
