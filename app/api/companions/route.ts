import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs/server";
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const name = searchParams.get("name");
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = 48;
    const nsfw = searchParams.get('nsfw') === 'true';
    const tagIds = searchParams.get('tag')?.split(',').filter(id => id !== '') || [];
    const user = await currentUser();
    let user_id = user?.id || "public";

    let whereClause: any = {
      name: { contains: name || undefined, mode: 'insensitive' }};
    
    if (nsfw !== true) {
      whereClause.nsfw = false;
    }
    if (tagIds.length > 0) {
      whereClause.tags = {
        some: {
          id: { in: tagIds }
        }
      };

      // If there's more than one tag, ensure all selected tags are present
      if (tagIds.length > 1) {
        whereClause.AND = tagIds.map(tagId => ({
          tags: { some: { id: tagId } }
        }));
      }
    }

    if (categoryId === "my-companions") {
      whereClause.userId = user_id;
    } else if (categoryId === "suggested") {
      whereClause.featured = true;
      whereClause.isPublic = true;
      whereClause.userId = { not: user_id }; 
    } else {
      whereClause.isPublic = true;
      whereClause.userId = { not: user_id }; 
    }

    //console.log("Where clause:", JSON.stringify(whereClause, null, 2));
    //console.log("Page:", page, "PageSize:", pageSize);

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

    //console.log("Companions found:", companions.length);

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