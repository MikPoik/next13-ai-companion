"use client";
import { useChat, Message as ChatMessage } from "ai/react";
import { FormEvent, useEffect, useRef, ElementRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Companion, Message as PrismaMessage, Role } from "@prisma/client";
import { ChatForm } from "@/components/chat-form";
import { ChatHeader } from "@/components/chat-header";
import { responseToChatBlocks } from "@/components/ChatBlock";
import { BeatLoader } from "react-spinners";
import { SendHorizonal, X, RotateCcw, Trash2 } from "lucide-react";
import { useProModal } from "@/hooks/use-pro-modal";
import { userAgent } from "next/server";
import { useToast } from "@/components/ui/use-toast";

interface ChatClientProps {
  isPro: boolean;
  companion: Companion & {
    messages: PrismaMessage[];
    _count: {
      messages: number;
    };
  };
}
interface ChatClientDisplayMessage {
  id: string;
  role: Role;
  content: JSX.Element[];
}
const scrollContainerStyle: React.CSSProperties = {
  msOverflowStyle: "none",
  scrollbarWidth: "none",
};
const transformChatMessageToPrismaMessage = (
  message: ChatMessage,
  companionId: string
): PrismaMessage => {
  return {
    id: message.id,
    role: message.role as Role,
    content: message.content,
    createdAt: message.createdAt ?? new Date(),
    updatedAt: new Date(), // Always use current date for updatedAt
    companionId: companionId,
    userId: "", // Check if userId exists
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

  const initialMessages: PrismaMessage[] = [
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
      updatedAt: message.updatedAt ?? new Date(),
      companionId: message.companionId ?? companion.id,
      userId: message.userId ?? "",
    })),
  ];

  const {
    messages, // This will be ChatMessage[]
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
    initialMessages: initialMessages as unknown as ChatMessage[], // Type cast
    
    onResponse(response) {
      //console.log("Messages length in onResponse:", messagesRef.current.length);
      const lastUserMessage = messagesRef.current[messagesRef.current.length - 1];
      
      fetch(`/api/chat/${companion.id}/save-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: lastUserMessage.content, id: lastUserMessage.id})
      }); 

    },
    onFinish() {
      //console.log("Messages length in onFinish:", messagesRef.current.length);
      const lastUserMessage = messagesRef.current[messagesRef.current.length - 2];
      const lastAssistantMessage = messagesRef.current[messagesRef.current.length - 1];
      setInput("");
      fetch(`/api/chat/${companion.id}/save-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: lastAssistantMessage.content, id: lastAssistantMessage.id })
      }); 
      router.refresh();
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });

    },
    onError(error) {
      console.error(error);
    },
    sendExtraMessageFields: true,
  });

  const messagesRef = useRef<PrismaMessage[]>(initialMessages);
  
  
  useEffect(() => {
    messagesRef.current = messages.map(message =>
      transformChatMessageToPrismaMessage(message, companion.id)
    );
  }, [messages, companion.id]);

  /*
  //for debug
  useEffect(() => {
    if (messages.length > initialMessages.length) {
      console.log("Messages updated in transformedMessages useEffect:", transformedMessages.length);
    }
  }, [messages]);
  */

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
        console.error('Failed to check balance:', await response.text());
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
    const lastAssistantMessage = messagesRef.current[messagesRef.current.length - 1];

    fetch(`/api/chat/${companion.id}/delete-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: lastAssistantMessage.content, id: lastAssistantMessage.id })
    }); 
    reload();
  };

  const handleDelete = (id: string) => {
    fetch(`/api/chat/${companion.id}/delete-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id })
    }); 
    setMessages((messages as PrismaMessage[]).filter(message => message.id !== id));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
    
    if (!input) {
      console.error("Prompt input is empty");
      return;
    }
    append({ role: 'user', content: input });
  };

  // Transforming messages
  const transformedMessages: ChatClientDisplayMessage[] = messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: responseToChatBlocks(message.content),
  }));

  return (
    <div className="flex flex-col h-full">
      <ChatHeader isPro={isPro} companion={companion} />
      <div style={scrollContainerStyle} className="flex-1 overflow-y-auto p-4">
        {transformedMessages.map((message) => (
          <div key={message.id} className="flex items-center justify-between mb-4">
            <div className="flex-1 mr-4">
              <span className="text-sm text-gray-500">
                {message.role === "user" ? "You" : `${companion.name}`}:
              </span>
              <br />
              <span className="leading-6">
                {message.content}
              </span>
            </div>
            <Button onClick={() => handleDelete(message.id)} className="opacity-20 group-hover:opacity-100 transition" size="icon" variant="ghost">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <div ref={bottomRef} />
        {isLoading ? <div style={{ display: 'flex', alignItems: 'center' }}><BeatLoader color={theme === "light" ? "black" : "white"} size={5} /><Button onClick={stop} disabled={!isLoading} variant="ghost"><X className="w-4 h-4" /></Button></div> : null}
        {error ? <p>{error.message}</p> : null}
      </div>
      <form onSubmit={onSubmit} className="border-t border-primary/10 py-4 flex items-center gap-x-0 pr-0 sticky bottom-0">
        <Input disabled={isLoading} value={input} onChange={handleInputChange} placeholder="Type a message" className="rounded-lg bg-primary/10" />
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