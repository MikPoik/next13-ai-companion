import prismadb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs/server";
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
        where: { id: params.chatId },
        include: { 
          messages: { orderBy: { createdAt: "asc" }, where: { userId: user.id } },
          _count: { select: { messages: true } },
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
    const packageName = process.env.STEAMSHIP_PACKAGE || "ai-adventure-test";
    const instance = await SteamshipV2.use(packageName, companion.steamshipAgent[0].instanceHandle, {}, companion.steamshipAgent[0].version, true, companion.steamshipAgent[0].workspaceHandle);
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