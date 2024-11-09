import prismadb from "@/lib/prismadb";
import { Categories } from "@/components/categories";
import { Companions } from "@/components/companions";
import { SearchInput } from "@/components/search-input";
import { currentUser } from "@clerk/nextjs/server";
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
    //const isPro = await checkSubscription();
    let user_id = user?.id || "public";

    let companions;
    // Determine if "My Companions" category has been selected
    const isMyCompanionsCategorySelected = searchParams.categoryId === "my-companions";
    const isSuggestedCategorySelected = searchParams.categoryId === "suggested";
    let tagsWithCount = null;
    if (isMyCompanionsCategorySelected) {
        tagsWithCount = await prismadb.tag.findMany({
            where: {
                          companions: {
                              some: {
                                  userId: user_id,                                  
                              },
                          },
                      },
                      include: {
                          _count: {
                              select: { companions: true },
                          },
                      },
                  });
    } else {
        tagsWithCount = await prismadb.tag.findMany({
            where: {
                companions: {
                    some: {
                        isPublic: true,
                    },
                },
            },
            include: {
                _count: {
                    select: { companions: true },
                },
            },
        });
    }
    // Step 2: Sort the tags by the companions count in descending order and limit to top 20
    const sortedTags = tagsWithCount.sort((a, b) => b._count.companions - a._count.companions).slice(0, 20);
    //console.log(sortedTags);
    const tags = sortedTags//await prismadb.tag.findMany();
    let selectedTagIds = searchParams.tag ? searchParams.tag.split(',') : [];
    //console.log(selectedTagIds)
    const nsfw = searchParams.nsfw === 'true';

    let nsfwFilter = {};
    if (nsfw) {
        nsfwFilter = {}; // If nsfw is true, no additional filter is applied, allowing both nsfw true and false
    } else {
        nsfwFilter = { nsfw: false }; // If nsfw is false, only companions with nsfw = false are shown
    }


    return (
        <div className="h-full p-4 space-y-2">
            <SearchInput tags={tags} selectedTags={selectedTagIds} nsfw={nsfw.toString()} />
            <Categories data={[]} />
            <Companions initialCompanions={[]} />
        </div>
    );
};

export default RootPage;