import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const chats = await prismadb.companion.findMany({
      where: {
        steamshipAgent: {
          some: {
            userId: user.id
          }
        }
      },
      select: {
        id: true,
        userId: true,
        userName: true,
        name: true,
        description: true,
        src: true,
        createdAt: true,
        steamshipAgent: {
          select: {
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: [{
        steamshipAgent: {
          _count: 'desc'
        }
      }],
      skip: skip,
      take: pageSize,
    });



    const totalCount = await prismadb.companion.count({
      where: {
        steamshipAgent: {
          some: {
            userId: user.id
          }
        }
      }
    });

    return NextResponse.json({
      chats,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page
    });
  } catch (error) {
    console.log("[MY_CHATS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}