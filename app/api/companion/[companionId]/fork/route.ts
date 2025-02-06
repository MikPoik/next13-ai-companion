
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

export async function POST(
    req: Request,
    { params }: { params: { companionId: string } }
) {
    try {
        const user = await currentUser();
        if (!user || !user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const companion = await prismadb.companion.findUnique({
            where: {
                id: params.companionId
            },
            include: {
                tags: true
            }
        });

        if (!companion) {
            return new NextResponse("Companion not found", { status: 404 });
        }

        const forkedCompanion = await prismadb.companion.create({
            data: {
                userId: user.id,
                userName: user.firstName || "user",
                src: companion.src,
                name: `${companion.name} (Fork)`,
                description: companion.description,
                personality: companion.personality,
                seed: companion.seed,
                packageName: companion.packageName,
                isPublic: true,
                workspaceName: companion.workspaceName,
                instanceHandle: companion.instanceHandle,
                behaviour: companion.behaviour,
                selfiePost: companion.selfiePost,
                selfiePre: companion.selfiePre,
                model: companion.model,
                createImages: companion.createImages,
                imageModel: companion.imageModel,
                voiceId: companion.voiceId,
                backstory: companion.backstory,
                phoneVoiceId: companion.phoneVoiceId,
                nsfw: companion.nsfw,
                tags: {
                    connect: companion.tags.map(tag => ({ id: tag.id }))
                }
            }
        });

        return NextResponse.json(forkedCompanion);
    } catch (error) {
        console.log("[COMPANION_FORK]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
