
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { call_modal_agent } from "@/lib/utils";

export async function GET(
    request: NextRequest,
    { params }: { params: { chatId: string } }
) {
    try {
        const { chatId } = params;
        const user = await auth();

        if (!user || !user.userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const companion = await prismadb.companion.findUnique({
            where: { id: chatId },
            include: { 
                steamshipAgent: {
                    take: 1,
                    orderBy: { createdAt: "desc" },
                    where: { userId: user.userId }
                }
            }
        });

        if (!companion?.steamshipAgent?.[0]) {
            return new NextResponse("Companion not found", { status: 404 });
        }

        const agentConfig = {
            workspace_id: companion.steamshipAgent[0].workspaceHandle,
            context_id: "default",
            agent_id: companion.steamshipAgent[0].instanceHandle,
        };

        const response = await call_modal_agent("get_chat_history", agentConfig);
        const allMessages = await response.json();
        
        // Filter messages to include only user and assistant messages, excluding first user message
        const filteredMessages = allMessages
            .filter((msg: any, index: number) => 
                (msg.role === 'user' || msg.role === 'assistant') && 
                !(index === 1 && msg.role === 'user')
            );

        // Generate HTML content
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Chat History with ${companion.name}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .message { margin: 10px 0; padding: 10px; border-radius: 8px; }
        .user { background: #e3f2fd; margin-left: 20%; }
        .assistant { background: #f5f5f5; margin-right: 20%; }
        .timestamp { font-size: 0.8em; color: #666; }
        img { max-width: 100%; height: auto; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Chat History with ${companion.name}</h1>
    <div class="chat-container">
        ${filteredMessages.map((msg: any) => {
            const isImage = msg.content?.includes("![") && msg.content?.includes("](") && !msg.content?.includes("![voice]");
            let content = msg.content || "";
            let imageUrl = "";
            
            if (isImage) {
                const matches = content.match(/!\[.*?\]\((.*?)\)/);
                if (matches) {
                    imageUrl = matches[1];
                    content = content.replace(/!\[.*?\]\((.*?)\)/g, "").trim();
                }
            }
            
            return `
        <div class="message ${msg.role}">
            <div class="timestamp">${msg.role === 'user' ? 'You' : companion.name} - ${new Date().toLocaleString()}</div>
            <div>${content}</div>
            ${imageUrl ? `<img src="${imageUrl}" alt="Chat Image">` : ''}
        </div>`;
        }).join("")}
    </div>
</body>
</html>`;

        const fileName = `chat-history-${companion.name}-${new Date().toISOString().split('T')[0]}.html`;

        return new NextResponse(htmlContent, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `attachment; filename="${fileName}"`
            }
        });

    } catch (error) {
        console.error("[DOWNLOAD_CHAT_HISTORY]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
