import prismadb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: { chatId: string } }
) {
     try {


         const { prompt,id } = await request.json();
         //console.log("Save-Prompt - prompt received:", prompt);
         //console.log("messageId: ",id)
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
                 role: "user",
                 userId: user.id,
                 companionId: params.chatId 
             },
             update: {
                 id: id,
                 content: prompt,
                 role: "user",
                 userId: user.id,
                 companionId: params.chatId
             }
         });

         return NextResponse.json("prompt saved")
     }
    
     catch (error) {
        console.log(error)
        
        return new NextResponse("Internal Error", { status: 500 });
    }
}