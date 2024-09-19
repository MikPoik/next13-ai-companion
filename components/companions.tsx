"use client";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { Companion } from "@prisma/client";
import axios from "axios";
import { MessagesSquare, EyeOff, ImagePlus, ImageOff } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { MoonLoader } from "react-spinners";
import { useTheme } from "next-themes";

interface CompanionsProps {
  initialCompanions: (Companion & {
    _count: {
      messages: number;
    };
    tags: { id: string }[];
  })[];
}

export const Companions = ({ initialCompanions }: CompanionsProps) => {
  const [ageVerificationState, setAgeVerificationState] = useState<string | null>(null);
  const [companions, setCompanions] = useState(initialCompanions || []);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeCards, setActiveCards] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const observerTarget = useRef(null);
  const { theme } = useTheme();
  const [isInitialState, setIsInitialState] = useState(true);
  
  const fetchCompanions = async (currentPage: number) => {
    try {
      setIsLoading(true);
      setIsInitialState(false);
      const categoryId = searchParams.get("categoryId");
      const name = searchParams.get("name");
      const nsfw = searchParams.get("nsfw");
      const tag = searchParams.get("tag");
      const response = await axios.get(`/api/companions?page=${currentPage}&categoryId=${categoryId || ''}&name=${name || ''}&nsfw=${nsfw || ''}&tag=${tag || ''}`);
      console.log("API response:", response.data);
      const newCompanions = response.data.companions;
      setCompanions((prevCompanions) => currentPage === 1 ? newCompanions : [...prevCompanions, ...newCompanions]);
      setPage((prevPage) => prevPage + 1);
      setHasMore(response.data.currentPage < response.data.totalPages);
    } catch (error) {
      console.error("Error fetching companions:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    console.log("Companions state:", companions);
  }, [companions]);
  
  useEffect(() => {
    console.log("Search params changed:", Object.fromEntries(searchParams.entries()));
    setAgeVerificationState(localStorage.getItem('age-verification-state'));
    setCompanions([]);
    setPage(1);
    fetchCompanions(1);
  }, [searchParams]);
  useEffect(() => {
    console.log("Companions state:", companions);
  }, [companions]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchCompanions(page);
        }
      },
      { threshold: 1.0 }
    );
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, isLoading, page]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const targetIndex = parseInt(entry.target.getAttribute('data-index') || '0', 10);
          setActiveCards((prevActiveCards) => {
            if (!prevActiveCards.includes(targetIndex)) {
              return [...prevActiveCards, targetIndex];
            }
            return prevActiveCards;
          });
        }
      });
    }, { threshold: 0.1 });

    const cardElements = document.querySelectorAll('.card-container');
    cardElements.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [companions]);

  if (isLoading && companions.length === 0) {
    return (
      <div className="col-span-full flex justify-center items-center p-4 w-full h-20 relative">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <MoonLoader size={20} color={theme === 'light' ? 'black' : 'white'} />
        </div>
      </div>
    );
  }

  if (companions.length === 0 && !isInitialState) {
    return (
      <div className="pt-10 flex flex-col items-center justify-center space-y-3">
        <p className="text-sm text-muted-foreground">No companions found.</p>
      </div>
    );
  }
  if (isLoading && companions.length === 0) {
    return (
      <div className="pt-10 flex flex-col items-center justify-center space-y-3 w-full">
        <MoonLoader size={20} color={theme === 'light' ? 'black' : 'white'} />
        <p className="text-sm text-muted-foreground">Loading companions...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pb-10">
      {ageVerificationState === 'true' && companions.map((item, index) => (
          <div 
            className="card-container" 
            style={{ 
              opacity: activeCards.includes(index) ? 1 : 0, 
              transition: 'opacity 0.5s ease-out' 
            }} 
            data-index={index} 
            key={item.id}
          >
            <Card className="bg-primary/10 rounded-xl cursor-pointer hover:opacity-75 transition border-0 flex flex-col h-full relative"
            style={{aspectRatio: '3 / 4'}}>
              <div className="absolute inset-0 z-0">
                <Image src={item.src} fill className="rounded-xl object-cover" alt="Character" />
              </div>
              <Link 
                href={{
                  pathname: `/chat/${item.id}`,
                  query: searchParams.toString() ? Object.fromEntries(searchParams.entries()) : undefined,
                }}              
                className="flex flex-col h-full z-10 relative"
              >
                <CardHeader className="flex flex-col items-center justify-center text-center text-white">
                </CardHeader>
                <CardContent className="text-white">
                </CardContent>
                <div className="mt-auto w-full absolute bottom-0 left-0 bg-[rgba(0,0,0,0.3)] rounded-b-xl hover:bg-[rgba(0,0,0,0.8)]">
                  <div className="flex flex-row items-center justify-between text-white">
                    <span className="flex-grow text-center">{item.name}</span>
                  </div>
                  <div className="flex flex-row items-center justify-between text-xs text-white">
                    <span className="flex-grow text-center">{item.description}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 my-1">
                    <span title="Total messages"><MessagesSquare size={15} /></span>
                    <span className="text-xs font-normal mr-2">{item._count.messages ?? 0}</span>
                    {!item.isPublic && (<span title="Bot is private"><EyeOff size={16} /></span>)}
                    {item.createImages ? (<span title="Image generation enabled"><ImagePlus size={16} /></span>) : (<span title="Image generation disabled"><ImageOff size={16} /></span>)}
                  </div>
                  <div className="text-white text-xs text-center">{item.model.split('/').pop()?.toLowerCase().replace('nous-', '') ?? ''}</div>
                </div>
              </Link>
            </Card>
          </div>
        ))
      }
      {isLoading && companions.length > 0 && (
      <div className="col-span-full flex justify-center items-center p-4 w-full h-20 relative">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <MoonLoader size={20} color={theme === 'light' ? 'black' : 'white'} />
        </div>
      </div>
      )}
       {hasMore && <div ref={observerTarget} style={{ height: '10px' }}></div>}
    </div>
  );
}