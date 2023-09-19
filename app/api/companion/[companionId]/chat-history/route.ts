import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";

// DELETE route for deleting the chat history
export async function DELETE(
  request: Request,
  { params }: { params: { companionId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.log("delete chat history")
    

    // Handle deletion of chat history here.
    // Replace the following line with your actual logic for deleting chat history.
    const deletedChatHistory = await prismadb.message.deleteMany({
      where: {
        userId: userId,
        companionId: params.companionId
      }
    });


    if (!deletedChatHistory) {
      return new NextResponse("Chat history not found or could not be deleted.", { status: 404 });
    }

    return NextResponse.json({ message: "Chat history deleted successfully." });
  } catch (error) {
    console.error("[DELETE_CHAT_HISTORY]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
