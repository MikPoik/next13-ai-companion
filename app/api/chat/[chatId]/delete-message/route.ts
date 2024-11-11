import prismadb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Steamship as SteamshipV2 } from 'steamship-client-v2';
import { call_modal_agent} from "@/lib/utils";
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
        where: { id: params.chatId },
        include: { 
          steamshipAgent: {
            take: 1, // Limit the number of records to 1
            orderBy: {
              createdAt: "desc" // Order by creation date in ascending order
            },
            where: {
              userId: user.id // Replace with the actual user ID
            }
          }
      }});
    if (!companion) {
      return new NextResponse("Chat history not found or could not be deleted.", { status: 404 });
    }

    const payload = {
      context_id: "default",
      workspace_id: companion.steamshipAgent[0].workspaceHandle,
      agent_id: companion.steamshipAgent[0].instanceHandle,
      kwargs: {
        num_pairs: 1
      }
  }
    const response = await call_modal_agent("delete_message_pairs",payload)
    console.log(response)    
    
    return NextResponse.json("message deleted")
  }

  catch (error) {
    console.log(error)

    return new NextResponse("Internal Error", { status: 500 });
  }
}