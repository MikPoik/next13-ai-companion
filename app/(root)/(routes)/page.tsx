import prismadb from "@/lib/prismadb";
import { Categories } from "@/components/categories";
import { Companions } from "@/components/companions";
import { SearchInput } from "@/components/search-input";
import { currentUser } from "@clerk/nextjs";
import { checkSubscription } from "@/lib/subscription";
import { Companion } from "@prisma/client";
import { Tag } from "@prisma/client";
import { Prisma } from '@prisma/client';

interface RootPageProps {
    searchParams: {
        categoryId: string | null; // Modified to reflect possible null value.
        name: string;
        tag?: string | null;
        nsfw?: string;
    };
}

const RootPage = async ({
    searchParams
}: RootPageProps) => {
    const user = await currentUser();
    const isPro = await checkSubscription();
    let user_id = user?.id || "public";

    let companions;
    const tagsWithCount = await prismadb.tag.findMany({
      include: {
        _count: {
          select: { companions: true }, // Counts the companions for each tag
        },
      },
    });
    // Step 2: Sort the tags by the companions count in descending order and limit to top 20
    const sortedTags = tagsWithCount.sort((a, b) => b._count.companions - a._count.companions).slice(0, 20);
    //console.log(sortedTags);
    const tags = sortedTags//await prismadb.tag.findMany();
    let selectedTagIds = searchParams.tag ? searchParams.tag.split(',') : [];
    //console.log(selectedTagIds)
    const nsfw = searchParams.nsfw === 'true';


    // Determine if "My Companions" category has been selected
    const isMyCompanionsCategorySelected = searchParams.categoryId === "my-companions";
    const isSuggestedCategorySelected = searchParams.categoryId === "suggested";

    if (isMyCompanionsCategorySelected) {
        companions = await prismadb.companion.findMany({
            where: {
                AND: [
                    { 
                        name: { contains: searchParams.name, mode: 'insensitive' as Prisma.QueryMode, },
                        nsfw: nsfw,
                        ...(selectedTagIds.length > 0 ? {
                            tags: {
                                some: { id: { in: selectedTagIds } },
                            },
                        } : {})
                    },
                ],
                userId: user_id,
                name: {
                    contains: searchParams.name,
                },
            },
            include: {
                _count: {
                    select: { messages: true },
                },
                tags: true, // Ensuring tags are included in the result for filtering.
            },
        });
    } else if (isSuggestedCategorySelected) {
        // Example logic for suggested category, adjust based on actual criteria

        companions = await prismadb.companion.findMany({
            where: {
                AND: [
                    { 
                        featured: true, // Assuming isSuggested is a valid attribute
                        nsfw: nsfw,
                        isPublic: true,
                        ...(selectedTagIds.length > 0 ? {
                            tags: {
                                some: { id: { in: selectedTagIds } },
                            },
                        } : {})
                    },
                ],
            },
            include: {
                _count: {
                    select: { messages: true },
                },
                tags: true,
            },
        });
    }else {
        let queryObject ={
                where: {
                    AND: [
                        //searchParams.categoryId ? { categoryId: searchParams.categoryId } : {},
                        { 
                            name: { contains: searchParams.name, mode: 'insensitive' as Prisma.QueryMode, },
                            nsfw: nsfw,
                            ...(selectedTagIds.length > 0 ? {
                                tags: {
                                    some: { id: { in: selectedTagIds } },
                                },
                            } : {})
                        },
                    ],
                    isPublic: true,
                },
                include: {
                    _count: { select: { messages: true } },
                    tags: true,
                },
                };
        companions = await prismadb.companion.findMany(queryObject);
    }
    if (selectedTagIds.length > 0) {
        companions = companions.filter(companion => {
            // Convert companion tags to tag IDs for easier comparison
            const companionTagIds = companion.tags.map(tag => tag.id);
            // Check if every selectedTagId is included in companionTagIds
            return selectedTagIds.every(tagId => companionTagIds.includes(tagId));
        });
    }
    

    if (!Array.isArray(companions)) {
        throw new Error('Failed to retrieve companions from the database.');
    }

    // Sort the companions by message count using the _count property
    companions.sort((a, b) => (b._count.messages || 0) - (a._count.messages || 0));

    //const categories = await prismadb.category.findMany();
    // You may add "My Companions" to the categories list if needed

    return (
        <div className="h-full p-4 space-y-2">
            <SearchInput tags={tags} selectedTags={selectedTagIds} nsfw={nsfw.toString()} />
            <Categories data={[]} />
            <Companions data={companions} />
        </div>
    );
};

export default RootPage;