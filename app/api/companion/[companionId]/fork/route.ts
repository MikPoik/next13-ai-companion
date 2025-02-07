import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse,NextRequest } from "next/server";
import prismadb from "@/lib/prismadb";

type RouteContext = {
    params: Promise<{ companionId: string }>;  // Make params a Promise
}

export async function POST(
    request: NextRequest,
     { params }: RouteContext
) {
    try {
        const unwrappedParams = await params;
        const companionId = unwrappedParams.companionId;
        const user = await currentUser();
        if (!user || !user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const companion = await prismadb.companion.findUnique({
            where: {
                id: companionId
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
                categoryId: "default",
                userId: user.id,
                userName: user.firstName || "user",
                src: companion.src,
                name: `${companion.name}`,
                description: companion.description,
                personality: companion.personality,
                seed: companion.seed,
                packageName: companion.packageName,
                isPublic: companion.isPublic,
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
                },
                cot_prompt:companion.cot_prompt
            }
        });

        return NextResponse.json(forkedCompanion);
    } catch (error) {
        console.log("[COMPANION_FORK]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
