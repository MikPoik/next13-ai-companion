import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { Steamship } from '@steamship/client';
import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";
//import { generateAvatarSteamship } from "@/components/SteamshipGenerateAvatar";
import { indexTextSteamship, } from "@/components/SteamshipIndexText";
import dotenv from "dotenv";
import { create } from "domain";
dotenv.config({ path: `.env` });


export const maxDuration = 120; //2 minute timeout
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
}

export async function PATCH(
    req: Request,
    { params }: { params: { companionId: string } }
) {


    try {
        const body = await req.json();
        const user = await currentUser();
        const { name, src, description, personality, seed, categoryId, isPublic, behaviour, selfiePost, selfiePre, imageModel, voiceId, createImages, backstory,phoneVoiceId } = body;
        if (!params.companionId) {
            return new NextResponse("Companion ID required", { status: 400 });
        }

        if (!user || !user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        var firstName = "user";
        if (user.firstName) {
            firstName = user.firstName
        }

        if (!name || !src || !description || !personality || !seed || !categoryId) {
            return new NextResponse("Missing required fields", { status: 400 });
        };

        //find companion from db
        const companion = await prismadb.companion.findUnique({
            where: {
                id: params.companionId,
                userId: user.id,
            }

        });
        
        // Check if the companion was not found and return an error if so
        if (!companion) {
            return new NextResponse("Companion not found", { status: 404 });
        }
        
        const packageName = "backend-test-bot";
        const env_packageName = process.env.STEAMSHIP_PACKAGE || packageName;
        let llm_model = companion.model;
        let instance_handle = companion.instanceHandle;
        
        if (body['model'] != companion.model || body[createImages] != companion.createImages) {
            llm_model = body['model'];
            instance_handle = user.id.replace("user_", "").toLowerCase() + "-" +uuidv4().replace(/-/g, "").toLowerCase();
            const client = await Steamship.use(env_packageName, instance_handle, { llm_model: llm_model, create_images: String(createImages) }, undefined, true, companion.workspaceName);
        }

        //console.log(llm_model);
        //console.log(instance_handle);
        let newBackstory = ""

        if (backstory.length > companion.backstory.length) {
            newBackstory = backstory.slice(companion.backstory.length);
            if (newBackstory.length > 0) {
                let text_to_index = newBackstory;
                newBackstory = companion.backstory + "\n"+ newBackstory;
                if ( companion) {
                    const indexTextResponse = await indexTextSteamship(
                        'index_text',
                        text_to_index,
                        user.id,
                        companion.packageName,
                        instance_handle,
                        companion.workspaceName,
                        personality,
                        name,
                        description,
                        behaviour,
                        selfiePre,
                        selfiePost,
                        seed,
                        llm_model,
                        imageModel,
                        createImages,
                        voiceId);
                    //console.log(indexTextResponse);
                    const indexTextResponseBlocks = JSON.parse(indexTextResponse);
                    //console.log(indexTextResponseBlocks);
                }
            }

        }
        else{
            newBackstory = companion.backstory;
        }
        const updateCompanion = await prismadb.companion.update({
            where: {
                id: params.companionId,
                userId: user.id,
            },
            data: {
                categoryId:categoryId,
                name:name,
                userId: user.id,
                userName: firstName,
                src:src,
                description:description,
                personality:personality,
                seed:seed,
                isPublic:isPublic,
                behaviour:behaviour,
                selfiePost:selfiePost,
                selfiePre:selfiePre,
                imageModel:imageModel,
                voiceId:voiceId,
                model:llm_model,
                instanceHandle:instance_handle,
                backstory:newBackstory,
                createImages:createImages,
                phoneVoiceId:phoneVoiceId,
            }
        });
        return NextResponse.json(companion);
    } catch (error) {
        console.log("[COMPANION_PATCH]");
        return new NextResponse("Internal Error", { status: 500 });
    }

};

export async function DELETE(
    request: Request,
    { params }: { params: { companionId: string } }
) {
    try {
        const user = await currentUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const companion = await prismadb.companion.delete({
            where: {
                userId: user.id,
                id: params.companionId
            }
        });
        const instance = await Steamship.use(companion.packageName, companion.instanceHandle, { llm_model: companion.model, create_images: String(companion.createImages) }, undefined, true, companion.workspaceName);
        instance.delete();

        return NextResponse.json(companion);
    } catch (error) {
        console.log("[COMPANION_DELETE]");
        return new NextResponse("Internal Error", { status: 500 });
    }
};

