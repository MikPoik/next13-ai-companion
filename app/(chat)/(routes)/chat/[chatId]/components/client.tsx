"use client";
import { useChat, Message as ChatMessageType } from "ai/react";
import { FormEvent, useEffect, useRef, ElementRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChatMessage as ChatMessageComponent, ChatMessageProps } from "@/components/chat-message";
import { Companion, Message as PrismaMessage, Role } from "@prisma/client";
import { ChatForm } from "@/components/chat-form";
import { ChatHeader } from "@/components/chat-header";
import { responseToChatBlocks } from "@/components/ChatBlock";
import { BeatLoader } from "react-spinners";
import { SendHorizonal, X, RotateCcw, Trash2,MoveDown } from "lucide-react";
import { useProModal } from "@/hooks/use-pro-modal";
import { userAgent } from "next/server";
import { useToast } from "@/components/ui/use-toast";
import { chatMessagesJsonlToBlocks } from "@/components/parse-blocks-from-message";


interface ChatClientProps {
  isPro: boolean;
  companion: Companion & {
    messages: PrismaMessage[];
    _count: {
      messages: number;
    };
  };
}
interface ChatMessageType {
  id: string;
  role: Role;
  content: string; // Update based on your actual structure
  blockId: string; // Add blockId here
  createdAt:Date,
  // Include any other fields that are necessary
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
  message: ChatMessageType,
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

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
    initialMessages: initialMessages.map((message) => ({
      ...message,
      content: chatMessagesJsonlToBlocks([message], ""), // Transform content here
    })) as unknown as ChatMessageType[], // Type cast
    
    onResponse:async (response) => {
      //console.log("Messages length in onResponse:", messagesRef.current.length);
      const lastUserMessage = messagesRef.current[messagesRef.current.length - 1];
      

      fetch(`/api/chat/${companion.id}/save-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: lastUserMessage.content, id: lastUserMessage.id })
      }); 
      
    },
    onFinish: (message) => {
      //console.log("Messages length in onFinish:", messagesRef.current.length);
      const lastUserMessage = messagesRef.current[messagesRef.current.length - 2];
      const lastAssistantMessage = messagesRef.current[messagesRef.current.length - 1];
      
      setInput("");
      if (!lastAssistantMessage.content.includes("I'm sorry, I had an error when generating response")){
        fetch(`/api/chat/${companion.id}/save-response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: lastAssistantMessage.content, id: lastAssistantMessage.id })
        }); 
      }
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
    }); 
    
    setMessages((messages as PrismaMessage[]).filter(message => message.id !== id && message.id !== id2));
    setIsDeleting(false);
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
  const transformedMessages: ChatMessageProps[] = messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: chatMessagesJsonlToBlocks([message], ""), // Ensure transformation is applied for rendering
    isLoading: false,
    src: "",
    blockId: message.blockId,
    streamState: message.streamState,
  }));

  //console.log(transformedMessages.length)
  return (
    <div className="flex flex-col h-full">
      <ChatHeader isPro={isPro} companion={companion} />
      <div style={scrollContainerStyle} className="flex-1 overflow-y-auto p-4">
        {transformedMessages.map((message, index) => (
          <div key={message.id} className="flex items-center">
            <ChatMessageComponent
              id={message.id}
              role={message.role}
              content={message.content}
              isLoading={message.isLoading}
              src={message.src}
              blockId={message.blockId}
              streamState={message.streamState}
              companionName={companion.name}
            />
            {transformedMessages.length >= 2 && index === transformedMessages.length - 2 && !isLoading && message.role === "user" && (
              <Button onClick={() => handleDelete(transformedMessages[transformedMessages.length - 1].id, transformedMessages[transformedMessages.length - 2].id)} disabled={isDeleting} className="opacity-20 group-hover:opacity-100 transition hover:bg-red-500" size="icon" variant="ghost" title="Delete message pair">
                <Trash2 className="w-4 h-4" /><MoveDown className="w-3 h-3" />
              </Button>
            )}
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
        {transformedMessages.length >= 2 && (
          <Button onClick={handleReload} disabled={isReloading} variant="ghost">
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </form>
    </div>
    );
};