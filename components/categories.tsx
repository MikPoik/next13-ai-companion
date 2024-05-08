"use client";

import qs from "query-string";
import { Category } from "@prisma/client"
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

interface CategoriesProps {
  data: Category[]
}

export const Categories = ({
  data
}: CategoriesProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryId = searchParams.get("categoryId");

  const onClick = (id: string | undefined) => {
    const query = { categoryId: id };

    const url = qs.stringifyUrl({
      url: window.location.href,
      query
    }, { skipNull: true });

    router.push(url);
  };

  return (
    <div className="w-full overflow-x-auto space-x-2 flex p-1">
      {/* Add Suggested as a manual button */}
      <button
        onClick={() => onClick('suggested')}
        className={cn(`
          flex 
          items-center 
          text-center 
          text-xs 
          md:text-sm 
          px-2 
          md:px-4 
          py-2 
          md:py-2 
          rounded-md 
          bg-primary/10 
          hover:opacity-75 
          transition
        `,
          'suggested' === categoryId ? 'bg-primary/25' : 'bg-primary/10'
        )}
      >
        Featured
      </button>
      <button
        onClick={() => onClick(undefined)}
        className={cn(`
          flex 
          items-center 
          text-center 
          text-xs 
          md:text-sm 
          px-2 
          md:px-4 
          py-2 
          md:py-2 
          rounded-md 
          bg-primary/10 
          hover:opacity-75 
          transition
        `,
          !categoryId ? 'bg-primary/25' : 'bg-primary/10'
        )}
      >
        Popular
      </button>
      {data.map((item) => (
        <button
          onClick={() => onClick(item.id)}
          className={cn(`
            flex 
            items-center 
            text-center 
            text-xs 
            md:text-sm 
            px-2 
            md:px-4 
            py-2 
            md:py-2 
            rounded-md 
            bg-primary/10 
            hover:opacity-75 
            transition
          `,
            item.id === categoryId ? 'bg-primary/25' : 'bg-primary/10'
          )}
          key={item.id}
        >
          {item.name}
        </button>
      ))}
      {/* Add My Companions as a manual button */}
      <button
        onClick={() => onClick('my-companions')}
        className={cn(`
          flex 
          items-center 
          text-center 
          text-xs 
          md:text-sm 
          px-2 
          md:px-4 
          py-2 
          md:py-2 
          rounded-md 
          bg-primary/10 
          hover:opacity-75 
          transition
        `,
          'my-companions' === categoryId ? 'bg-primary/25' : 'bg-primary/10'
        )}
      >
        My Companions
      </button>

    </div>
  )
}