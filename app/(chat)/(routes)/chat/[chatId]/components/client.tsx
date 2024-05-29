"use client";
import { useChat } from "ai/react";
import { FormEvent, useEffect,ElementRef, useRef, useState } from "react";
import { SendHorizonal, X, RotateCcw,Trash2 } from "lucide-react";
import { Companion, Message, Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { ChatForm } from "@/components/chat-form";
import { ChatHeader } from "@/components/chat-header";
import { Button } from "@/components/ui/button";
import { useProModal } from "@/hooks/use-pro-modal";
import { responseToChatBlocks } from "@/components/ChatBlock";
import { BeatLoader } from "react-spinners";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
interface ChatClientProps {
  isPro: boolean;
  companion: Companion & {
    messages: Message[];
    _count: {
      messages: number;
    };
  };
}

interface ChatClientMessage {
  id: string;
  role: Role;
  content: JSX.Element[];
}
const scrollContainerStyle: React.CSSProperties = {
  msOverflowStyle: "none",  /* Internet Explorer 10+ */
  scrollbarWidth: "none",  /* Firefox */
};

export const ChatClient = ({ isPro, companion }: ChatClientProps) => {
  // Define initialMessages
  const { theme } = useTheme();
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialMessages: Message[] = [
    {
      id: "seed",
      role: Role.system,
      content: companion.seed,
      createdAt: new Date(),
      updatedAt: new Date(),
      companionId: companion.id,
      userId: "",
    },
    ...companion.messages.map((message) => ({
      ...message,
      role: message.role,
    })),
  ];

  const proModal = useProModal();
  const router = useRouter();
  const scrollRef = useRef<ElementRef<"div">>(null);
  // Initialize useChat
  const {
    messages = initialMessages, // Provide default value
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    setInput,
    append,
    isLoading,
    error,
    stop,
    reload,
  } = useChat({
    api: `/api/chat/${companion.id}`,
    initialMessages,
    onResponse(response) {
      console.log(response);
    },
    onFinish(message) {
      console.log(message);
      setInput("");
      router.refresh();
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    },
    onError(error) {
      console.error(error);
    },
  });

  useEffect(() => {
    if (error) {
      console.error(error.message);
    }
  }, [error]);

  const handleReload = (event: React.MouseEvent<HTMLButtonElement>) => {
    reload();
  };

  const handleDelete = (id: string) => {
    console.log("Deleting message with ID:", id);
    if (messages?.length) {
      console.log(messages)
      setMessages((messages as Message[]).filter(message => message.id !== id))
      
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input) {
      console.error("Prompt input is empty");
      return;
    }
    append({ role: Role.user, content: input });
  };
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" }); // Scroll to bottom on messages change
  }, [messages]);
  
  // Transforming messages
  const transformedMessages: ChatClientMessage[] = messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: responseToChatBlocks(message.content),
  }));

  return (
    <div className="flex flex-col h-full">
      <ChatHeader isPro={isPro} companion={companion} />
      <div style={scrollContainerStyle} className="flex-1 overflow-y-auto p-4">
        {transformedMessages.map((message) => (
          <div
            key={message.id}
            className="flex items-center justify-between mb-4"
          >
            <div className="flex-1 mr-4">
              <span className="text-sm text-gray-500">
                {message.role === "user" ? "You" : `${companion.name}`}:
              </span>
              <br />
              <span className="leading-6">
                {message.content}
              </span>
            </div>
            <Button
              onClick={() => handleDelete(message.id)}
              className="opacity-20 group-hover:opacity-100 transition"
              size="icon"
              variant="ghost"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <div ref={bottomRef} /> {/* Add an empty div for scrolling reference */}
        {isLoading ? <div style={{ display: 'flex', alignItems: 'center' }}><BeatLoader color={theme === "light" ? "black" : "white"} size={5} /><Button onClick={stop} disabled={!isLoading} variant="ghost"><X className="w-4 h-4" />
        </Button></div> : null}
        {error ? <p>{error.message}</p> : null}
      </div>
      <form onSubmit={onSubmit} className="border-t border-primary/10 py-4 flex items-center gap-x-0 pr-0 sticky bottom-0">
        <Input
          disabled={isLoading}
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message"
          className="rounded-lg bg-primary/10"
        />
        <Button type="submit" disabled={isLoading} variant="ghost">
          <SendHorizonal className="w-4 h-4" />
        </Button>

        <Button onClick={handleReload} disabled={isLoading} variant="ghost">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </form>
    </div>
    );
};