"use client";

import { useState, useEffect, useRef } from 'react';
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

  // Ref to track initialization
  const initializingRef = useRef(false);
  const initializedRef = useRef(false);

  //console.log("Rendering ChatIdPage component");

  const initializeCompanion = async () => {
    if (initializingRef.current || initializedRef.current) {
      console.log("Initialization already in progress or completed, skipping...");
      return;
    }

    //console.log("Initializing companion...");
    initializingRef.current = true;

    try {
      const response = await axios.post('/api/chat/initialize_companion', { chatId: params.chatId });

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
  };

  useEffect(() => {
    initializeCompanion();
  }, [params.chatId, router]);

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
    <ChatClient isPro={isPro} companion={companion} />
  );
};

export default ChatIdPage;