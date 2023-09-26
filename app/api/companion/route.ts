import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { Steamship } from '@steamship/client';
import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";

export async function POST(req: Request) { 
  try {
    const body = await req.json();
    const user = await currentUser();
    const { src, name, description, personality, seed, categoryId, packageName,isPublic,selfiePost,selfiePre,behaviour,model,createImages } = body;

    if (!user || !user.id || !user.firstName) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if ( !src ||!name || !description || !personality || !seed || !categoryId || !behaviour || !model ) {
      return new NextResponse("Missing required fields", { status: 400 });
    };

    const isPro = await checkSubscription();

    //if (!isPro) {
    //  return new NextResponse("Pro subscription required", { status: 403 });
    //}

    const workspace_name = user.id.replace("user_","").toLowerCase()+"-"+name.replace(" ","-").toLowerCase();
    const instance_handle = user.id.replace("user_","").toLowerCase()+"-"+name.replace(" ","-").toLowerCase();

    var llm_model = "NousResearch/Nous-Hermes-Llama2-13b";

    if (model.match("GPT3.5")) {
      llm_model = "gpt-3.5-turbo-0613";
    } else if (model.match("Llama2")){
      llm_model = "NousResearch/Nous-Hermes-Llama2-13b";
    }
    
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
        packageName:packageName,
        isPublic,
        workspaceName:workspace_name,
        instanceHandle:instance_handle,
        behaviour,
        selfiePost,
        selfiePre,
        model:llm_model,
        createImages
      }
    });
    await Steamship.use(packageName, instance_handle, {llm_model:llm_model,create_images:createImages}, undefined, true, workspace_name);

    return NextResponse.json(companion);
  } catch (error) {
    console.log("[COMPANION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
  
};
