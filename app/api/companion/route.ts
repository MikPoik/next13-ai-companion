import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { Steamship } from '@steamship/client';
import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";

export async function POST(req: Request) {
  //return new NextResponse("Currently disabled", { status: 500 });
  
  try {

    const body = await req.json();
    const user = await currentUser();
    const { src, name, description, personality, seed, categoryId, packageName,isPublic,selfiePost,selfiePre,behaviour } = body;

    if (!user || !user.id || !user.firstName) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!src || !name || !description || !personality || !seed || !categoryId || !behaviour ) {
      return new NextResponse("Missing required fields", { status: 400 });
    };

    const isPro = await checkSubscription();

    if (!isPro) {
      return new NextResponse("Pro subscription required", { status: 403 });
    }
    const package_name = packageName;
    const workspace_name = user.id.replace("user_","").toLowerCase()+"-"+name.replace(" ","-").toLowerCase();
    const instance_handle = user.id.replace("user_","").toLowerCase()+"-"+name.replace(" ","-").toLowerCase();

    const companion = await prismadb.companion.create({
      data: {
        categoryId,
        userId: user.id,
        userName: user.firstName,
        src,
        name,
        description,
        personality,
        seed,
        packageName,
        isPublic,
        workspaceName:workspace_name,
        instanceHandle:instance_handle,
        behaviour,
        selfiePost,
        selfiePre
      }
    });
    await Steamship.use(packageName, instance_handle, undefined, undefined, true, workspace_name);

    return NextResponse.json(companion);
  } catch (error) {
    console.log("[COMPANION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
  
};
