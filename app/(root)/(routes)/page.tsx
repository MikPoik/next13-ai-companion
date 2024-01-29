import prismadb from "@/lib/prismadb";
import { Categories } from "@/components/categories";
import { Companions } from "@/components/companions";
import { SearchInput } from "@/components/search-input";
import { currentUser } from "@clerk/nextjs";
import { checkSubscription } from "@/lib/subscription";
interface RootPageProps {
  searchParams: {
    categoryId: string;
    name: string;
  };
};
const RootPage = async ({
  searchParams
}: RootPageProps) => {
  const user = await currentUser();
  const isPro = await checkSubscription();
  let user_id = user?.id || "public";
    let companions = await prismadb.companion.findMany({
      where: {
        categoryId: searchParams.categoryId,
        AND: [
          {
            OR: [
              {
                name: {
                  contains: searchParams.name,
                },
              },
              {
                description: {
                  contains: searchParams.name,
                },
              },
            ],
          },
          {
            OR: [
              {
                isPublic: true,
              },
              {
                userId: user_id,
              },
            ],
          },
        ],
      },
      include: {
        _count: {
          select: { messages: true }, // Select message count
        },
      },
    });
    if (!Array.isArray(companions)) {
      throw new Error('Failed to retrieve companions from the database.');
    }
  // Calculate message count and sort the companions
      // Sort the companions by message count using the _count property
      companions.sort((a, b) => (b._count.messages || 0) - (a._count.messages || 0));
  const categories = await prismadb.category.findMany();
  return (
    <div className="h-full p-4 space-y-2">
      <SearchInput />
      <Categories data={categories} />
      <Companions data={companions} />
    </div>
  );
};
export default RootPage;