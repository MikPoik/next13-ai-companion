import prismadb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { Steamship as SteamshipV2 } from 'steamship-client-v2';
export async function POST(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {

    //console.log(request)
    const { id, id2 } = await request.json();
    
    const user = await currentUser();
    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const deletedMessages = await prismadb.message.deleteMany({
      where: {
        userId: user.id,
        companionId: params.chatId,
        id: {
          in: id2 ? [id, id2] : [id]
        }
      }
    });
    const companion = await prismadb.companion.findUnique({
      where: {
        id: params.chatId
      },
    });
    if (!companion) {
      return new NextResponse("Chat history not found or could not be deleted.", { status: 404 });
    }
    const instance = await SteamshipV2.use(companion.packageName, companion.instanceHandle, { llm_model: companion.model, create_images: String(companion.createImages) }, undefined, true, companion.workspaceName);
    const context_id = user.id;
    const response = await (instance.invoke('delete_messages', {
      context_id
    }));
    
    return NextResponse.json("message deleted")
  }

  catch (error) {
    console.log(error)

    return new NextResponse("Internal Error", { status: 500 });
  }
}