import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { Steamship as SteamshipV2 } from 'steamship-client-v2';
import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";

// DELETE route for deleting the chat history
export async function DELETE(
  request: Request,
  { params }: { params: { companionId: string } }
) {
  try {
    //const { userId } = auth();
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    //console.log("delete chat history")
    
    // Handle deletion of chat history here.
    const deletedChatHistory = await prismadb.message.deleteMany({
      where: {
        userId: user.id,
        companionId: params.companionId
      }
    });


    if (!deletedChatHistory) {
      return new NextResponse("Chat history not found or could not be deleted.", { status: 404 });
    }

    const companion = await prismadb.companion.findUnique({
      where: {
        id: params.companionId
      },       
    });    
    if (!companion) {
      return new NextResponse("Chat history not found or could not be deleted.", { status: 404 });
    }
    const instance = await SteamshipV2.use(companion.packageName, companion.instanceHandle, { llm_model: companion.model, create_images: String(companion.createImages) }, undefined, true, companion.workspaceName);
    const context_id = user.id;
    const response = await (instance.invoke('clear_history', {
      context_id
    }));
    //console.log(response);
    return NextResponse.json({ message: "Chat history deleted successfully." });
  } catch (error) {
    console.error("[DELETE_CHAT_HISTORY]");
    return new NextResponse("Internal Error", { status: 500 });
  }
}
