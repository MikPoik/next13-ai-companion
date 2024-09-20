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
        messages: {
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
        messages: {
          where: {
            userId: user.id
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 1,
          select: {
            id: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                userId: user.id
              }
            }
          }
        }
      },
      orderBy: {
        messages: {
          _count: "desc"
        }
      },
      skip: skip,
      take: pageSize,
    });

    // Sort the chats based on the most recent message
    chats.sort((a, b) => {
      const dateA = a.messages[0]?.createdAt ?? new Date(0);
      const dateB = b.messages[0]?.createdAt ?? new Date(0);
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    const totalCount = await prismadb.companion.count({
      where: {
        messages: {
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