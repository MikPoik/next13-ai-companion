"use client";
import { useChat } from "ai/react";
import { useEffect, useState } from "react";
import { Companion, Message } from "@prisma/client";
import { useRouter } from "next/navigation";
import { ChatForm } from "@/components/chat-form";
import { ChatHeader } from "@/components/chat-header";
import { ChatMessages } from "@/components/chat-messages";
import { ChatMessageProps } from "@/components/chat-message";
import { responseToChatBlocks } from "@/components/ChatBlock";
import { Button } from "@/components/ui/button";
import { SendHorizonal, Sparkles } from "lucide-react";
import { useProModal } from "@/hooks/use-pro-modal";
import { chatMessagesJsonlToBlocks } from "@/components/parse-blocks-from-message";
interface ChatClientProps {
  isPro: boolean;
  companion: Companion & {
    messages: Message[];
    _count: {
      messages: number;
    }
  };
};

export const ChatClient = ({
  isPro,
  companion,
}: ChatClientProps) => {
  const router = useRouter();
  const proModal = useProModal();

  const {
    messages: chatMessages,
    input,
    isLoading,
    append,
    handleInputChange,
    handleSubmit,
    setInput,
  } = useChat({
    api: `/api/chat/${companion.id}`,
    initialMessages: companion.messages.map(message => ({
      // Initial processing of messages is moved inside useEffect to ensure it's re-processed on refresh
      id: message.id,
      role: message.role as "user" | "system",
      content: message.content, // Directly use message content, transformation will be applied later
    })),
      onResponse: async (res) => {
          console.log("Stream processing not directly handled here.", res);
      },
    onFinish: (message) => {
      console.log("finish useChat: ", message)
      router.refresh();
    },
  });
/*
  useEffect(() => {
    // Re-process messages to ensure responseToChatBlocks is applied when component mounts
    const processedMessages = chatMessages.map(message => ({
      ...message,
      content: chatMessagesJsonlToBlocks(messages,""), // Apply the transformation here
    }));

    // Since chatMessages is read-only from useChat, we're updating the component state to trigger a re-render
    // This step might need adjustments based on your state management or re-render strategy
  }, [chatMessages, companion.messages]);
*/
  const messages = chatMessages.map((message) => ({
    role: message.role as "user" | "system",
    content: chatMessagesJsonlToBlocks([message],""), // Ensure transformation is applied for rendering
  }));

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (input.trim() !== '') {
            append({ id: companion.id, role: "user", content: input });
            setInput('');
        }
    };

  return (
    <div className="flex flex-col h-full p-4 space-y-2">
      <ChatHeader isPro={isPro} companion={companion} />

      <ChatMessages
        companion={companion}
        isLoading={isLoading}
        messages={messages} // Render transformed messages
      />

      <ChatForm
        isPro={isPro}
        isLoading={isLoading}
        input={input}
        handleInputChange={handleInputChange}
        companion={companion}
        onSubmit={onSubmit}
      />
    </div>
  );
};