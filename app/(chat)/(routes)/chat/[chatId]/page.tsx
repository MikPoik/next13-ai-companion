"use client";

import { useState, useEffect, useRef,useCallback } from 'react';
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
  const [chatHistory, setChatHistory] = useState([]);
  // Ref to track initialization
  const initializingRef = useRef(false);
  const initializedRef = useRef(false);

  //console.log("Rendering ChatIdPage component");

  const initializeCompanion = useCallback(async () => {
    if (initializingRef.current || initializedRef.current) {
      return;
    }

    //console.log("Initializing companion...");
    initializingRef.current = true;

    try {
      const response = await axios.post('/api/chat/initialize_companion', { chatId: params.chatId });
      const chat_history = await response.data.chat_history_json.slice(1) || []; // Access chat_history from response.data
      
      setChatHistory(chat_history);
      if (response.status === 200) {
        const { companion, isPro } = response.data;
        setCompanion(companion);
        setIsPro(isPro);
        initializedRef.current = true;
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to initialize companion:', error);
      router.push('/');
    } finally {
      initializingRef.current = false;
      setIsLoading(false);
    }
  }, [params.chatId, router]);

  useEffect(() => {
    initializeCompanion();
  }, [initializeCompanion]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}>
        Loading your companion... <br />
        <MoonLoader size={20} color={theme === 'light' ? 'black' : 'white'} loading={isLoading} />
      </div>
    );
  }

  if (!companion) {
    return null; // Fallback if companion is not set
  }

  return (
    <ChatClient isPro={isPro} companion={companion} chat_history={chatHistory} />
  );
};

export default ChatIdPage;