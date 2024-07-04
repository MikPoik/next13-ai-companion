import prismadb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: { chatId: string } }
) {
     try {

         //console.log(request)
         const { id } = await request.json();
         //console.log("Delete-Message messageId: ",id);
         const user = await currentUser();
         if (!user || !user.id) {
             return new NextResponse("Unauthorized", { status: 401 });
         }
         const deletedMessage = await prismadb.message.delete({
           where: {
             userId: user.id,
             companionId: params.chatId,
             id: id
           }
         });

         return NextResponse.json("message deleted")
     }
    
     catch (error) {
        console.log(error)
        
        return new NextResponse("Internal Error", { status: 500 });
    }
}