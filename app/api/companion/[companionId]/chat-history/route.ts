import { auth, currentUser } from "@clerk/nextjs/server";
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
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
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

    try {
      const companion = await prismadb.companion.findUnique({
        where: { id: params.companionId }, // Changed to params.companionId for consistency
        include: { 
          steamshipAgent: {
            take: 1, // Limit the number of records to 1
            orderBy: {
              createdAt: "desc" // Order by creation date in descending order
            },
            where: {
              userId: user.id // Replace with the actual user ID
            }
          }
        }
      });

      if (!companion) {
        return new NextResponse("Chat history not found or could not be deleted.", { status: 404 });
      }
      if (companion.steamshipAgent.length === 0) {
        return new NextResponse("companion not initialized", { status: 404 });
      }
      const url = "https://mikpoik--modal-agent-fastapi-app-dev.modal.run/delete_chat_history";
      const headers = {
          Authorization: `Bearer ${process.env.MODAL_AUTH_TOKEN}`,
          "Content-Type": "application/json"
      };
      const agentConfig = {
          // Populate with necessary fields
          context_id: "default",
          agent_id: companion.steamshipAgent[0].instanceHandle,
          workspace_id: companion.steamshipAgent[0].workspaceHandle,
          // Add other configuration parameters as needed
      };
      //console.log(agentConfig)
      const response = await fetch(url, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(agentConfig)
      });
      //console.log(response)
      const context_id = user.id;


      return NextResponse.json({ message: "Chat history deleted successfully." });
    } catch (error) {
      console.error("[DELETE_CHAT_HISTORY]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  } catch (error) {
    console.error("[DELETE_CHAT_HISTORY]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}