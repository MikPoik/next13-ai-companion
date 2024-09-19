"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { BotAvatar } from "@/components/bot-avatar";

interface ChatCompanion {
  id: string;
  userId: string;
  userName: string;
  name: string;
  description: string;
  src: string;
  messages: { id: string; createdAt: string }[];
  _count: { messages: number };
}

export const MyChats = () => {
  const [chats, setChats] = useState<ChatCompanion[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeCards, setActiveCards] = useState<number[]>([]);
  const router = useRouter();
  const observerTarget = useRef(null);

  const fetchChats = async () => {
    try {
      const response = await axios.get(`/api/my-chats?page=${page}`);
      const newChats = response.data.chats;
      setChats((prevChats) => [...prevChats, ...newChats]);
      setPage((prevPage) => prevPage + 1);
      setHasMore(response.data.currentPage < response.data.totalPages);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchChats();
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
  }, [hasMore]);

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
              {chat.messages.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Last message: {new Date(chat.messages[0].createdAt).toLocaleString()}
                </p>
              )}
              <p className="text-xs text-gray-400">
                Total messages: {chat._count.messages}
              </p>
            </div>
          </div>
        </div>
      ))}
      {hasMore && <div ref={observerTarget} style={{ height: '10px' }}></div>}
    </div>
  );
};