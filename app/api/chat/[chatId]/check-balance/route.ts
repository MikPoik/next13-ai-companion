import prismadb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
export async function POST(
    request: Request,
    { params }: { params: { chatId: string } }
) {
    try {
        const user = await currentUser();
        if (!user || !user.id) {
            return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        const balance = await prismadb.userBalance.findUnique({
            where: {
                userId: user.id
            },
        });
        const currentDateTime = new Date().toISOString();
        if (!balance) {
            await prismadb.userBalance.create({
                data: {
                    userId: user.id,
                    tokenCount: 0,
                    messageCount: 1,
                    messageLimit: 1000,
                    tokenLimit: 10000,
                    firstMessage: currentDateTime,
                    proTokens: 0,
                    callTime: 300,
                    lastMessage: currentDateTime
                }
            });
            return new NextResponse(JSON.stringify({ status: "OK" }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (balance.tokenCount > balance.tokenLimit + balance.proTokens) {
            return new NextResponse(JSON.stringify({ status: "NoBalance" }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return new NextResponse(JSON.stringify({ status: "OK" }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
        console.log(error);
        return new NextResponse(JSON.stringify({ error: "Internal Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}