import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const name = searchParams.get("name");
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = 24;
    const nsfw = searchParams.get('nsfw') === 'true';
    const tagIds = searchParams.get('tag')?.split(',').filter(id => id !== '') || [];
    const user = await currentUser();
    let user_id = user?.id || "public";
    let whereClause: any = {
      name: { contains: name || undefined, mode: 'insensitive' },
      ...(nsfw === false ? { nsfw: false } : {}),
      ...(tagIds.length > 0 ? {
        tags: {
          some: { id: { in: tagIds } },
        },
      } : {}),
    };
    if (categoryId === "my-companions") {
      whereClause.userId = user_id;
    } else if (categoryId === "suggested") {
      whereClause.featured = true;
      whereClause.isPublic = true;
    } else {
      whereClause.isPublic = true;
    }
    console.log("Where clause:", JSON.stringify(whereClause, null, 2));
    console.log("Page:", page, "PageSize:", pageSize);
    const companions = await prismadb.companion.findMany({
      where: whereClause,
      include: {
        _count: { select: { messages: true } },
        tags: true,
      },
      orderBy: {
        messages: { _count: 'desc' },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    console.log("Companions found:", companions.length);
    console.log("User ID:", user_id);
    console.log("Category ID:", categoryId);
    console.log("Where clause:", JSON.stringify(whereClause, null, 2));
    console.log("Companions found:", companions.length);
    
    const totalCount = await prismadb.companion.count({ where: whereClause });
    return NextResponse.json({
      companions,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page
    });
  } catch (error) {
    console.error("[COMPANIONS_GET] Detailed error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}