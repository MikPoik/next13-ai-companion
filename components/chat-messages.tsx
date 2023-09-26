"use client";

import { ElementRef, useEffect, useRef, useState } from "react";
import { Companion } from "@prisma/client";

import { ChatMessage, ChatMessageProps } from "@/components/chat-message";

interface ChatMessagesProps {
  messages: ChatMessageProps[];
  isLoading: boolean;
  companion: Companion
}
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
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
        isLoading={fakeLoading}
        src={companion.src}
        role="system"
        content={`Hello, I am ${companion.name}, ${companion.seed}`}
        key="system" // Assign a fixed key for system message
      />
      {messages.map((message, index) => (
        <ChatMessage
          key={index} // Assign the pre-generated key
          src={companion.src}
          content={message.content}
          role={message.role}
        />
      ))}
      {isLoading && (
        <ChatMessage
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
