import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { Steamship } from '@steamship/client';
import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";

export async function PATCH(
  req: Request,
  { params }: { params: { companionId: string } }
) {
  //return new NextResponse("Currently disabled", { status: 500 });
  
  try {
    const body = await req.json();
    const user = await currentUser();
    const { src, description, personality, seed, categoryId,isPublic,behaviour,selfiePost,selfiePre,createImages } = body;

    if (!params.companionId) {
      return new NextResponse("Companion ID required", { status: 400 });
    }

    if (!user || !user.id || !user.firstName) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!src || !description || !personality || !seed || !categoryId) {
      return new NextResponse("Missing required fields", { status: 400 });
    };

    const isPro = await checkSubscription();

    if (!isPro) {
      return new NextResponse("Pro subscription required", { status: 403 });
    }

    const companion = await prismadb.companion.update({
      where: {
        id: params.companionId,
        userId: user.id,
      },
      data: {
        categoryId,
        userId: user.id,
        userName: user.firstName,
        src,
        description,
        personality,
        seed,
        isPublic,
        behaviour,
        selfiePost,
        selfiePre,
        createImages
      }
    });

    return NextResponse.json(companion);
  } catch (error) {
    console.log("[COMPANION_PATCH]", error);
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
        userId:user.id,
        id: params.companionId
      }
    });

    const instance = await Steamship.use(companion.packageName, companion.instanceHandle, undefined, undefined, true, companion.workspaceName);
    instance.delete();

    return NextResponse.json(companion);
  } catch (error) {
    console.log("[COMPANION_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
};

