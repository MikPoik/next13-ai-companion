"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ChatClient } from "./components/client";
import { MoonLoader } from "react-spinners";
import { useTheme } from "next-themes";
const ChatIdPage = ({ params }: { params: { chatId: string } }) => {
  const [companion, setCompanion] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { theme } = useTheme();
  useEffect(() => {
    console.log("create chat")
    const initializeCompanion = async () => {
      try {
        console.log("init companion route call")
        const response = await axios.post('/api/chat/initialize_companion', { chatId: params.chatId });
        if (response.status === 200) {
          const { companion, isPro } = response.data;
          setCompanion(companion);
          setIsPro(isPro);
        } else {
          console.log("error response")
          router.push('/');
        }
      } catch (error) {
        console.error('Failed to initialize companion:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    console.log("initialize companion")
    initializeCompanion();
  }, [params.chatId, router]);

  if (isLoading) {
    return <div  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading your companion... <br/><MoonLoader size={20} color={theme === "light" ? "black" : "white"} loading={isLoading} /></div>;
  }

  if (!companion) {
    return null; // Fallback if companion is not set
  }

  return (
    <ChatClient isPro={isPro} companion={companion} />
  );
};

export default ChatIdPage;