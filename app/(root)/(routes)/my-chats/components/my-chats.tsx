"use client";

import { useEffect, useState, useRef,useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { BotAvatar } from "@/components/bot-avatar";
import { MoonLoader } from "react-spinners";
import { useTheme } from "next-themes";

interface ChatCompanion {
  id: string;
  userId: string;
  userName: string;
  name: string;
  description: string;
  src: string;
  createdAt: string;
  steamshipAgent: {
    createdAt: string;
  }[];
}

  export const MyChats = () => {
    const [chats, setChats] = useState<ChatCompanion[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [activeCards, setActiveCards] = useState<number[]>([]);
    const router = useRouter();
    const observerTarget = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const { theme } = useTheme();
    const initialFetchMade = useRef(false);
    const fetchChats = useCallback(async () => {
      if (isLoading || !hasMore) return;
      setIsLoading(true);
      try {
        const response = await axios.get<{
          chats: ChatCompanion[];
          currentPage: number;
          totalPages: number;
        }>(`/api/my-chats?page=${page}`);
        const newChats = response.data.chats;
        setChats((prevChats) => {
          const uniqueNewChats = newChats.filter(
            (newChat: ChatCompanion) => !prevChats.some((prevChat) => prevChat.id === newChat.id)
          );
          // Combine and sort all chats by createdAt in descending order
          return [...prevChats, ...uniqueNewChats].sort((a, b) => 
            new Date(b.steamshipAgent[0].createdAt).getTime() - new Date(a.steamshipAgent[0].createdAt).getTime()
          );
        });
        setPage((prevPage) => prevPage + 1);
        setHasMore(response.data.currentPage < response.data.totalPages);
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setIsLoading(false);
      }
    }, [isLoading, hasMore, page]);
    useEffect(() => {
      if (!initialFetchMade.current) {
        fetchChats();
        initialFetchMade.current = true;
      }
    }, [fetchChats]);
    useEffect(() => {
      const currentObserverTarget = observerTarget.current;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoading && initialFetchMade.current) {
            fetchChats();
          }
        },
        { threshold: 1.0 }
      );
      if (currentObserverTarget) {
        observer.observe(currentObserverTarget);
      }
      return () => {
        if (currentObserverTarget) {
          observer.unobserve(currentObserverTarget);
        }
      };
    }, [fetchChats, hasMore, isLoading]);

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

    const cardElements = document.querySelectorAll('.chat-card');
    cardElements.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [chats]);

  const handleChatClick = (companionId: string) => {
    router.push(`/chat/${companionId}`);
  };

  return (
    <div className="space-y-4">
      {chats.map((chat, index) => (
        <div
          key={chat.id}
          className="chat-card p-4 border rounded-lg cursor-pointer hover:bg-secondary"
          onClick={() => handleChatClick(chat.id)}
          data-index={index}
          style={{
            opacity: activeCards.includes(index) ? 1 : 0,
            transition: 'opacity 0.5s ease-out'
          }}
        >
          <div className="flex items-center space-x-4">
            <BotAvatar src={chat.src} />
            <div className="flex-grow">
              <h3 className="text-lg font-semibold">{chat.name}</h3>
              <p className="text-sm text-gray-500">{chat.description}</p> 
              <p className="text-xs text-gray-400">Last chat: {new Date(chat.steamshipAgent[0].createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-center items-center p-4">
          <MoonLoader size={20} color={theme === 'light' ? 'black' : 'white'} />
        </div>
      )}
      {hasMore && <div ref={observerTarget} style={{ height: '10px' }}></div>}
    </div>
  );
};