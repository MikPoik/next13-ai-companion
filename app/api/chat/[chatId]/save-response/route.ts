import prismadb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: { chatId: string } }
) {
    try {


        const { prompt,id } = await request.json();
        //console.log("Save-Response, prompt received:", prompt);
        //console.log("Message id ",id)
        const user = await currentUser();
        if (!user || !user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

         await prismadb.message.upsert({
             where: {
                 id: id,
             },
             create: {
                 id: id,
                 content: prompt,
                 role: "assistant",
                 userId: user.id,
                 companionId: params.chatId,
                 createdAt: new Date(Date.now() + 1000),
             },
             update: {
                 id: id,
                 content: prompt,
                 role: "assistant",
                 userId: user.id,
                 companionId: params.chatId,
                 createdAt: new Date(Date.now() + 1000),
             }
         });
        return NextResponse.json("prompt saved")
    }
    catch (error) {
        console.log(error)

        //return new NextResponse("Internal Error", { status: 500 });
    }
}