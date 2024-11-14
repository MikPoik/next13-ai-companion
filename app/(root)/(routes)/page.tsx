import prismadb from "@/lib/prismadb";
import { Categories } from "@/components/categories";
import { Companions } from "@/components/companions";
import { SearchInput } from "@/components/search-input";
import { currentUser } from "@clerk/nextjs/server";

interface RootPageProps {
  searchParams: Promise<{
    categoryId?: string;
    name?: string;
    tag?: string;
    nsfw?: string;
  }>;
}

const RootPage = async ({ searchParams }: RootPageProps) => {
  const user = await currentUser();
  let user_id = user?.id || "public";

  // Unwrap searchParams
  const params = await searchParams;

  // Safely access searchParams properties
  const categoryId = params.categoryId;
  const tagParam = params.tag;
  const nsfwParam = params.nsfw;

  // Determine categories
  const isMyCompanionsCategorySelected = categoryId === "my-companions";
  const isSuggestedCategorySelected = categoryId === "suggested";

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

  // Sort tags and process
  const sortedTags = tagsWithCount
    .sort((a, b) => b._count.companions - a._count.companions)
    .slice(0, 20);

  const tags = sortedTags;
  const selectedTagIds = tagParam ? tagParam.split(',') : [];
  const nsfw = nsfwParam === 'true';

  let nsfwFilter = {};
  if (nsfw) {
    nsfwFilter = {}; // If nsfw is true, no additional filter is applied
  } else {
    nsfwFilter = { nsfw: false }; // If nsfw is false, only companions with nsfw = false are shown
  }

  return (
    <div className="h-full p-4 space-y-2">
      <SearchInput 
        tags={tags} 
        selectedTags={selectedTagIds} 
        nsfw={nsfw.toString()} 
      />
      <Categories data={[]} />
      <Companions initialCompanions={[]} />
    </div>
  );
};

export default RootPage;