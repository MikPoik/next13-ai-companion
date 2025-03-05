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
    const pageSize = 68;
    const nsfw = searchParams.get('nsfw') === 'true';
    const tagIds = searchParams.get('tag')?.split(',').filter(id => id !== '') || [];
    const user = await currentUser();
    let user_id = user?.id || "public";

    // Base where clause with name and description search
    let whereClause: any = {};
    
    // If there's a search term, search in both name and description
    if (name) {
      whereClause.OR = [
        { name: { contains: name, mode: 'insensitive' } },
        { description: { contains: name, mode: 'insensitive' } }
      ];
    }

    // First determine the category context
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

    // Apply NSFW filter
    if (nsfw) {
      whereClause.nsfw = true;
    } else {
      whereClause.nsfw = false;
    }

    // Apply tag filtering within the established context
    if (tagIds.length > 0) {
      if (tagIds.length === 1) {
        whereClause.tags = {
          some: {
            id: { in: tagIds }
          }
        };
      } else {
        // For multiple tags
        whereClause.AND = tagIds.map(tagId => ({
          tags: { some: { id: tagId } }
        }));
      }
    }

    const companions = await prismadb.companion.findMany({
      where: whereClause,
      select: {
        id:true,
        name: true,
        description: true,
        messageCount: true,
        tags: true,
        createImages:true,
        src:true,
        isPublic:true
      },
      orderBy: {
        messageCount: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

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