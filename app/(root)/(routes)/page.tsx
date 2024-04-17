import prismadb from "@/lib/prismadb";
import { Categories } from "@/components/categories";
import { Companions } from "@/components/companions";
import { SearchInput } from "@/components/search-input";
import { currentUser } from "@clerk/nextjs";
import { checkSubscription } from "@/lib/subscription";
import { Companion } from "@prisma/client";

interface RootPageProps {
  searchParams: {
    categoryId: string | null; // Modified to reflect possible null value.
    name: string;
  };
}

const RootPage = async ({
  searchParams
}: RootPageProps) => {
  const user = await currentUser();
  const isPro = await checkSubscription();
  let user_id = user?.id || "public";

  let companions;
  // Determine if "My Companions" category has been selected
  const isMyCompanionsCategorySelected = searchParams.categoryId === "my-companions";

  if (isMyCompanionsCategorySelected) {
    // Fetch private companions for "My Companions" category
    companions = await prismadb.companion.findMany({
      where: {
        userId: user_id,
        name: {
          contains: searchParams.name,
        },
      },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });
  } else {
    // Fetch only public companions for other categories or default view
    // Adjusted to correctly handle undefined categoryId
    companions = await prismadb.companion.findMany({
      where: {
        AND: [
          searchParams.categoryId ? { categoryId: searchParams.categoryId } : {},
          { isPublic: true },
        ],
        name: {
          contains: searchParams.name,
        },
      },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  if (!Array.isArray(companions)) {
    throw new Error('Failed to retrieve companions from the database.');
  }

  // Sort the companions by message count using the _count property
  companions.sort((a, b) => (b._count.messages || 0) - (a._count.messages || 0));

  const categories = await prismadb.category.findMany();
  // You may add "My Companions" to the categories list if needed

  return (
    <div className="h-full p-4 space-y-2">
      <SearchInput />
      <Categories data={categories} />
      <Companions data={companions} />
    </div>
  );
};

export default RootPage;