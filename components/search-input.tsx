// components/search-input.tsx
"use client";
import { Tag } from "@prisma/client";
import qs from "query-string";
import { ChangeEventHandler, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ToggleRight, ToggleLeft } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
// At the beginning of your `search-input.tsx` file

interface SearchInputProps {
    tags: Tag[];
    selectedTags: string[];
    nsfw: string; // Add this line to include the nsfw prop
}
export const SearchInput = ({ tags, selectedTags,nsfw: initialIsNSFW }: SearchInputProps) => {
    
    const router = useRouter();
    const searchParams = useSearchParams();
    const categoryId = searchParams.get("categoryId");
    const name = searchParams.get("name");
    const [isNSFW, setIsNSFW] = useState(searchParams.get("nsfw") || "false");
    useEffect(() => {
        setIsNSFW(searchParams.get("nsfw") || "false");
    }, [searchParams]);
    
    // Modified toggleNSFW function
    const toggleNSFW = async () => {
        const newState = isNSFW === "true" ? "false" : "true";
        setIsNSFW(newState); // Set the new state directly as string
        const newSearchParams = new URLSearchParams(window.location.search);
        for (const param of Array.from(searchParams.keys())) {
            newSearchParams.set(param, searchParams.get(param) || '');
        }
        newSearchParams.set('nsfw', newState);
        
        await router.push(`${window.location.pathname}?${newSearchParams.toString()}`);
    };

    const [value, setValue] = useState(name || "");
    const debouncedValue = useDebounce<string>(value, 500);

    const onTagClick = (tagId: string) => {
        const newSelectedTags = selectedTags.includes(tagId)
            ? selectedTags.filter((id) => id !== tagId) // Uncheck the tag
            : [...selectedTags, tagId]; // Check the tag
        const query = {
            name: debouncedValue,
            categoryId: categoryId,
            tag: newSelectedTags.join(','),
            nsfw: isNSFW,
        };
        const url = qs.stringifyUrl({
            url: window.location.href,
            query
        }, { skipNull: true, skipEmptyString: true });
        router.push(url);
    };

    const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        setValue(e.target.value);
    };
    useEffect(() => {
        const query = {
            name: debouncedValue,
            categoryId: categoryId,
            nsfw: isNSFW,
        };

        const url = qs.stringifyUrl({
            url: window.location.href,
            query
        }, { skipNull: true, skipEmptyString: true });

        router.push(url);
    }, [debouncedValue, searchParams,isNSFW, router, categoryId]);

    return (
        <div>
            <div className="flex items-center mb-2">
                <Search className="absolute h-4 w-4 top-3 left-4 text-muted-foreground" />
                <Input
                    onChange={onChange}
                    value={value}
                    placeholder="Search..."
                    className="pl-10 bg-primary/10"
                />
                <button onClick={toggleNSFW} className="p-2 ml-2">
                    {isNSFW === "true" ? <ToggleLeft size={24} className="fill-sky-500" /> : <ToggleRight size={24} className="fill-muted-foreground" />}
                </button> <div className="text-xs">NSFW</div>
            </div>
            <div className="tags-container flex flex-wrap gap-2">
                {tags.map((tag) => (
                    <button key={tag.id} onClick={() => onTagClick(tag.id)} className={`flex items-center text-center text-xs md:text-sm px-1 md:px-1 py-1 md:py-1 rounded-md hover:opacity-75 transition tag ${selectedTags.includes(tag.id) ? 'bg-primary/30' : 'bg-primary/10'}`}>
                        {tag.name}
                    </button>
                ))}
            </div>
        </div>
    );
};