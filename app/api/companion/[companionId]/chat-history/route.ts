import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";
import { call_modal_agent } from "@/lib/utils";

type RouteContext = {
    params: Promise<{ companionId: string }>;
}
// DELETE route for deleting the chat history
export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  const unwrappedParams = await params;
  const companionId = unwrappedParams.companionId;
  
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    // Handle deletion of chat history here.
    const deletedChatHistory = await prismadb.message.deleteMany({
      where: {
        userId: user.id,
        companionId: companionId
      }
    });

    if (!deletedChatHistory) {
      return new NextResponse("Chat history not found or could not be deleted.", { status: 404 });
    }

    try {
      const companion = await prismadb.companion.findUnique({
        where: { id: companionId }, 
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
      const response = await call_modal_agent("delete_chat_history",agentConfig, )
      console.log(await response.json())


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