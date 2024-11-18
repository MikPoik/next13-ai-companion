import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";
import dotenv from "dotenv";
import { create } from "domain";
import {getBolnaAgentJson} from "@/lib/bolna";


export const maxDuration = 60; //2 minute timeout
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

type RouteContext = {
    params: Promise<{ companionId: string }>;
}

export async function PATCH(
    req: Request,
    { params }: RouteContext
) {

      const unwrappedParams = await params;
      const companionId = unwrappedParams.companionId;
    try {
        const body = await req.json();
        const user = await currentUser();
        const { name, src, description, personality, seed, categoryId, isPublic, behaviour, selfiePost, selfiePre, imageModel, voiceId, createImages, backstory, phoneVoiceId, tags, nsfw,model } = body;

        if (!companionId) {
            return new NextResponse("Companion ID required", { status: 400 });
        }

        if (!user || !user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        var firstName = "user";
        if (user.firstName) {
            firstName = user.firstName
        }

        if (!name || !src || !description || !personality || !seed) {
            return new NextResponse("Missing required fields", { status: 400 });
        };

        //find companion from db
        const companion = await prismadb.companion.findUnique({
          where: { id: companionId },
          include: { 

            steamshipAgent: {
              take: 1, // Limit the number of records to 1
              orderBy: {
                createdAt: "desc" // Order by creation date in ascending order
              },
              where: {
                userId: user.id // Replace with the actual user ID
              }
            }
        }});

        // Check if the companion was not found and return an error if so
        if (!companion) {
            return new NextResponse("Companion not found", { status: 404 });
        }
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

        const packageName = "backend-test-bot";
        const env_packageName = process.env.STEAMSHIP_PACKAGE || packageName;

        let instance_handle = companion.instanceHandle;

        const updateCompanion = await prismadb.companion.update({
            where: {
                id: companionId,
                userId: user.id,
            },
            data: {
                categoryId: "default",
                name: name,
                userId: user.id,
                userName: firstName,
                src: src,
                description: description,
                personality: personality,
                seed: seed,
                isPublic: isPublic,
                behaviour: behaviour,
                selfiePost: selfiePost,
                selfiePre: selfiePre,
                imageModel: imageModel,
                voiceId: voiceId,
                model: model,
                instanceHandle: instance_handle,
                backstory: backstory,
                createImages: createImages,
                phoneVoiceId: phoneVoiceId,
                tags: {
                    set: finalTags.map(tag => ({ id: tag.id })),
                },
                nsfw: nsfw,
                revision: companion.revision + 1,
            }
        });


          //update bolna agent, add bolna agent id to companion db table
            const apiKey = process.env["BOLNA_API_KEY"];
            if (!apiKey) {
                throw new Error('BOLNA_API_KEY is not defined in environment variables');
            }
            const headers = {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            };


        let voiceAgentId = companion.voiceAgentId;
        let bolna_json = getBolnaAgentJson(name);
        
        if (!updateCompanion.voiceAgentId) {
            bolna_json = getBolnaAgentJson(companion.name)
            const response = await fetch('https://api.bolna.dev/agent', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(bolna_json),
            });
            const result = await response.json();
            const voice_agent_id = result.agent_id;            
            const updateCompanion = await prismadb.companion.update({
                where: {
                    id: companion.id,
                },
                data: {
                    voiceAgentId: voice_agent_id,
                }
                });
            voiceAgentId = voice_agent_id;
        }
        const response = await fetch(`https://api.bolna.dev/agent/${updateCompanion.voiceAgentId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(bolna_json),
        });
        const result = await response.json();
        const voice_agent_id = result.agent_id;
        const status = result.status;
        
        return NextResponse.json(companion);
    } catch (error) {
        console.log("[COMPANION_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }

};

export async function DELETE(
    request: Request,
    { params }: RouteContext
) {
  const unwrappedParams = await params;
  const companionId = unwrappedParams.companionId;
    console.log("DELETE COMPANION")
    try {
        const user = await currentUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }


        const companion = await prismadb.companion.delete({
            where: {
                userId: user.id,
                id: companionId
            }
        });

        return NextResponse.json("OK",{status: 200});
    } catch (error) {
        console.log("[COMPANION_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
};

