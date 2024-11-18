import prismadb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{ chatId: string }>;
}

export async function POST(
    request: Request,
     { params }: RouteContext
) {
     try {
         const unwrappedParams = await params;
         const chatId = unwrappedParams.chatId;

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
                 companionId: chatId 
             },
             update: {
                 id: id,
                 content: prompt,
                 role: "user",
                 userId: user.id,
                 companionId: chatId
             }
         });
         await prismadb.companion.update({
             where: { id: chatId },
             data: {
                 messageCount: {
                     increment: 1
                 }
             }
         });
         return NextResponse.json("prompt saved")
     }
    
     catch (error) {
        console.log(error)
        
        return new NextResponse("Internal Error", { status: 500 });
    }
}