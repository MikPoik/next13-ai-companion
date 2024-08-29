"use client";
import React, { FormEvent, useEffect, useRef, ElementRef, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ChatMessage as ChatMessageComponent } from "@/components/chat-message";
import { Companion, Message as PrismaMessage, Role } from "@prisma/client";
import { ChatHeader } from "@/components/chat-header";
import { chatMessagesJsonlToBlocks } from "@/components/parse-blocks-from-message";
import { BeatLoader } from "react-spinners";
import { SendHorizonal, X, RotateCcw, Trash2, MoveDown } from "lucide-react";
import { useProModal } from "@/hooks/use-pro-modal";
import { useToast } from "@/components/ui/use-toast";
import { useChat, Message as ChatMessageType } from "ai/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useStreamStore from '@/lib/use-stream-store';

interface ChatClientProps {
  isPro: boolean;
  companion: Companion & {
    messages: PrismaMessage[];
    _count: {
      messages: number;
    };
  };
}

interface LocalChatMessageType {
  id: string;
  role: Role;
  content: string;
  createdAt: Date;
}

const scrollContainerStyle: React.CSSProperties = {
  msOverflowStyle: "none",
  scrollbarWidth: "none",
};

const transformChatMessageToPrismaMessage = (
  message: LocalChatMessageType,
  companionId: string
): PrismaMessage => {
  return {
    id: message.id,
    role: message.role as Role,
    content: message.content,
    createdAt: message.createdAt ?? new Date(),
    updatedAt: new Date(),
    companionId: companionId,
    userId: "", // Add validation and checks as necessary here
  };
};

export const ChatClient = ({ isPro, companion }: ChatClientProps) => {
  const { toast } = useToast(); 
  const [messageId, setMessageId] = useState<string | null>(null);
  const { theme } = useTheme();
  const bottomRef = useRef<HTMLDivElement>(null);
  const proModal = useProModal();
  const router = useRouter();
  const scrollRef = useRef<ElementRef<"div">>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const accumulatedContentRef = useRef<string | "">("");
  const { content: streamedContent, setContent: setStreamedContent } = useStreamStore();

  const initialMessages: PrismaMessage[] = [
    {
      id: "seed",
      role: Role.assistant,
      content: companion.seed,
      createdAt: new Date(),
      updatedAt: new Date(),
      companionId: companion.id,
      userId: "",
    },
    ...companion.messages.map((message) => ({
      ...message,
      role: message.role,
      updatedAt: message.updatedAt ?? new Date(),
      companionId: message.companionId ?? companion.id,
      userId: message.userId ?? "",
    })),
  ];

  useEffect(() => {
    // Scroll to bottom on initial load
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const {
    messages, 
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
    initialMessages: initialMessages as unknown as ChatMessageType[], 
    body: {
      chatId: `${companion.id}`,
    },
    onResponse(response) {
      const lastUserMessage = messagesRef.current[messagesRef.current.length - 1];
      fetch(`/api/chat/${companion.id}/save-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: lastUserMessage.content, id: lastUserMessage.id })
      }); 
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    },
    onFinish(message){
      const finalStreamedContent = useStreamStore.getState().content;
      console.log("Streamed content from Zustand:", finalStreamedContent);
      const finalContent = accumulatedContentRef.current;
      const lastUserMessage = messagesRef.current[messagesRef.current.length - 2];
      const lastAssistantMessage = messagesRef.current[messagesRef.current.length - 1];
      setInput("");
      if (!lastAssistantMessage.content.includes("I'm sorry, I had an error when generating response")){
        fetch(`/api/chat/${companion.id}/save-response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: finalContent, id: lastAssistantMessage.id, blockList: lastAssistantMessage.content })
        }); 
      }
      //setStreamedContent(""); // Reset streamedContent
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    },
    onError(error) {
      console.error(error);
    },
    sendExtraMessageFields: true,
  });

  const messagesRef = useRef<PrismaMessage[]>(initialMessages);

  useEffect(() => {
    messagesRef.current = messages.map(message => ({
      ...message,
      createdAt: new Date(message.createdAt || Date.now())
    })).map(message =>
      transformChatMessageToPrismaMessage(message, companion.id)
    );
  }, [messages, companion.id]);

  useEffect(() => {
    if (error) {
      console.error(error.message);
    }
  }, [error]);

  const checkBalance = async (companionId: string) => {
    try {
      const response = await fetch(`/api/chat/${companionId}/check-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorMsg = await response.text();
        console.error('Failed to check balance:', errorMsg);
        return { status: 'error', message: 'Failed to check balance.' };
      }
      const { status } = await response.json();
      return { status };
    } catch (error) {
      console.error('An error occurred:', error);
      return { status: 'error', message: 'An unexpected error occurred.' };
    }
  };

  const handleReload = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsReloading(true);
    const { status, message } = await checkBalance(companion.id);
    if (status === 'error' && message) {
      toast({
        description: message,
        variant: 'destructive',
      });
      setIsReloading(false);
      return;
    }
    if (status === "NoBalance") {
      toast({
        description: "Not enough balance, top up your balance.",
        variant: "destructive",
      });
      setIsReloading(false);
      return;
    }
    const lastAssistantMessage = messagesRef.current[messagesRef.current.length - 1];
    if (lastAssistantMessage.id.length > 7) {
      toast({
        description: "Legacy chat history format, delete chat history to use updated feature",
        variant: "destructive",
      });
      setIsReloading(false);
      return;
    }
    await fetch(`/api/chat/${companion.id}/delete-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({id: lastAssistantMessage.id,chatId: companion.id })
    }).catch(error => {
      console.error('Failed to reload chat:', error);
      toast({
        description: 'Failed to reload chat.',
        variant: 'destructive',
      });
    });
    reload();
    setIsReloading(false);
  };

  const handleDelete = async (id: string, id2:string) => {
    setIsDeleting(true);
    if (id.length > 7) {
      toast({
        description: "Legacy chat history format, delete chat history to use updated feature",
        variant: "destructive",
      });
      return;
    }

    await fetch(`/api/chat/${companion.id}/delete-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, id2: id2, chatId: companion.id })
    }).catch(error => {
      console.error('Failed to delete message:', error);
      toast({
        description: 'Failed to delete message.',
        variant: 'destructive',
      });
      setIsDeleting(false);
    });

    setMessages((messages as PrismaMessage[]).filter(message => message.id !== id && message.id !== id2));
    setIsDeleting(false);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input) {
      toast({
        description: "Input cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    const { status, message } = await checkBalance(companion.id);
    if (status === 'error' && message) {
      toast({
        description: message,
        variant: 'destructive',
      });
      return;
    }
    if (status === "NoBalance") {
      toast({
        description: "Not enough balance, top up your balance.",
        variant: "destructive",
      });
      return;
    }

    append({ role: 'user', content: input });
  };

  const transformedMessages = messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: chatMessagesJsonlToBlocks([message], ""), 
    isLoading: false,
    src: ""
  }));
  //console.log(transformedMessages)
  return (
    <div className="flex flex-col h-full">
      <ChatHeader isPro={isPro} companion={companion} />
      <div style={scrollContainerStyle} className="flex-1 overflow-y-auto py-2 pb-0">
        {transformedMessages.map((message, index) => (
          <div key={message.id} className="flex items-center">
            <ChatMessageComponent
              id={message.id}
              role={message.role}
              content={message.content}
              isLoading={message.isLoading}
              src={message.src}
              blockId={message.id}

              companionName={companion.name}
              accumulatedContentRef={accumulatedContentRef}
            />
            {transformedMessages.length >= 2 && index === transformedMessages.length - 2 && !isLoading && message.role === "user" && (
              <Button onClick={() => handleDelete(transformedMessages[transformedMessages.length - 1].id, transformedMessages[transformedMessages.length - 2].id)} disabled={isDeleting} className="opacity-20 group-hover:opacity-100 transition hover:bg-red-500" size="icon" variant="ghost" title="Delete message pair">
                <Trash2 className="w-4 h-4" /><MoveDown className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
        {streamedContent && <div>{streamedContent}</div>}
        <div ref={bottomRef} />
        {isLoading ? <div style={{ display: 'flex', alignItems: 'center' }} ref={bottomRef}><BeatLoader color={theme === "light" ? "black" : "white"} size={5} /><Button onClick={stop} disabled={!isLoading} variant="ghost"><X className="w-4 h-4" /></Button></div> : null}
        {error ? <p>{error.message}</p> : null}
      </div>
      <form onSubmit={onSubmit} className="border-t border-primary/10 py-1 pb-0 flex items-center gap-x-0 pr-0 sticky bottom-0">
        <Input disabled={isLoading} value={input} onChange={handleInputChange} placeholder="Type a message" className="rounded-lg bg-primary/10" />
        <Button type="submit" disabled={isLoading} variant="ghost">
          <SendHorizonal className="w-4 h-4" />
        </Button>
        {transformedMessages.length >= 2 && (
          <Button onClick={handleReload} disabled={isReloading} variant="ghost">
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </form>
    </div>
  );
};