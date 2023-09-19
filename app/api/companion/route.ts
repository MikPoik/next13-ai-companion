import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";

export async function POST(req: Request) {
  //return new NextResponse("Currently disabled", { status: 500 });
  
  try {

    const body = await req.json();
    const user = await currentUser();
    const { src, name, description, instructions, seed, categoryId, packageName,isPublic } = body;

    if (!user || !user.id || !user.firstName) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!src || !name || !description || !instructions || !seed || !categoryId ) {
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
        instructions,
        seed,
        packageName,
        isPublic,
        workspaceName:workspace_name,
        instanceHandle:instance_handle,
      }
    });

    return NextResponse.json(companion);
  } catch (error) {
    console.log("[COMPANION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
  
};
