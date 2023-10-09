import prismadb from "@/lib/prismadb"
import { Categories } from "@/components/categories"
import { Companions } from "@/components/companions"
import { SearchInput } from "@/components/search-input"
import { auth, currentUser, redirectToSignIn } from "@clerk/nextjs";

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
  var user_id = "";
  if (!user) {
    user_id = "public";
    //return redirectToSignIn();
  } else {
    user_id = user.id;
  }
  const data = await prismadb.companion.findMany({
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
    orderBy: {
      createdAt: "desc"
    },
    include: {
      _count: {
        select: {
          messages: true,
        }
      }
    },
  });


  const categories = await prismadb.category.findMany();

  return (
    <div className="h-full p-4 space-y-2">
      <SearchInput />
      <Categories data={categories} />
      <Companions data={data} />
    </div>

  )
}

export default RootPage
