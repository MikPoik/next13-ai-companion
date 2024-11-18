import prismadb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { call_modal_agent } from "@/lib/utils";

type RouteContext = {
    params: Promise<{ chatId: string }>;
}

export async function POST(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        const unwrappedParams = await params;
        const chatId = unwrappedParams.chatId;

        const { id, id2 } = await request.json();

        const user = await currentUser();
        if (!user || !user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const deletedMessages = await prismadb.message.deleteMany({
            where: {
                userId: user.id,
                companionId: chatId,
                id: {
                    in: id2 ? [id, id2] : [id]
                }
            }
        });

        const companion = await prismadb.companion.findUnique({
            where: { id: chatId },
            include: { 
                steamshipAgent: {
                    take: 1,
                    orderBy: {
                        createdAt: "desc"
                    },
                    where: {
                        userId: user.id
                    }
                }
            }
        });

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

        const response = await call_modal_agent("delete_message_pairs", payload);

        return NextResponse.json("message deleted");
    } catch (error) {
        console.log(error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}