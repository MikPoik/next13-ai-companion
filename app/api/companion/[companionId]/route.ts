import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { Steamship } from '@steamship/client';
import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";
//import { generateAvatarSteamship } from "@/components/SteamshipGenerateAvatar";
import { indexTextSteamship, } from "@/components/SteamshipIndexText";
import dotenv from "dotenv";
dotenv.config({ path: `.env` });


export const maxDuration = 120; //2 minute timeout

export async function PATCH(
    req: Request,
    { params }: { params: { companionId: string } }
) {


    try {
        const body = await req.json();
        const user = await currentUser();
        const { name, src, description, personality, seed, categoryId, isPublic, behaviour, selfiePost, selfiePre, imageModel, voiceId, createImages, backstory } = body;
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


        if (backstory != null && companion) {
            const indexTextResponse = await indexTextSteamship(
                'index_text',
                backstory,
                user.id,
                companion.packageName,
                companion.instanceHandle,
                companion.workspaceName,
                personality,
                name,
                description,
                behaviour,
                selfiePre,
                selfiePost,
                seed,
                companion.model,
                imageModel,
                createImages,
                voiceId);
            //console.log(indexTextResponse);
            const indexTextResponseBlocks = JSON.parse(indexTextResponse);
            //console.log(indexTextResponseBlocks);
        }
        const updateCompanion = await prismadb.companion.update({
            where: {
                id: params.companionId,
                userId: user.id,
            },
            data: {
                name,
                categoryId,
                userId: user.id,
                userName: firstName,
                src,
                description,
                personality,
                seed,
                isPublic,
                behaviour,
                selfiePost,
                selfiePre,
                imageModel,
                voiceId
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

