"use client";

import { ElementRef, useEffect, useRef, useState } from "react";
import { Companion } from "@prisma/client";
const { v4: uuidv4 } = require('uuid');
import { ChatMessage, ChatMessageProps } from "@/components/chat-message";

interface ChatMessagesProps {
  messages: ChatMessageProps[];
  isLoading: boolean;
  companion: Companion
}

export const ChatMessages = ({
  messages = [],
  isLoading,
  companion,
}: ChatMessagesProps) => {

  const [messageKeys, setMessageKeys] = useState<string[]>([]);

  useEffect(() => {
    // Generate unique keys for messages
    const messageKeys = messages.map(() => uuidv4());
    setMessageKeys(messageKeys);
  }, [messages,isLoading]);

  const scrollRef = useRef<ElementRef<"div">>(null);

  const [fakeLoading, setFakeLoading] = useState(messages.length === 0 ? true : false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFakeLoading(false);
    }, 1000);

    return () => {
      clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    scrollRef?.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto pr-4">
      <ChatMessage
        id= {uuidv4()}
        isLoading={fakeLoading}
        src={companion.src}
        role="system"
        content={`${companion.seed}`}
        key="system" // Assign a fixed key for system message
      />
      {messages.map((message, index) => (
        <ChatMessage
          id={uuidv4()}
          key={index} // Assign the pre-generated key
          src={companion.src}
          content={message.content}
          role={message.role}
        />
      ))}
      {isLoading && (
        <ChatMessage
          id= {uuidv4()}
          src={companion.src}
          role="system"
          isLoading
          key="loading" // Assign a fixed key for loading message
        />
      )}
      <div ref={scrollRef} />
    </div>
  );
};
