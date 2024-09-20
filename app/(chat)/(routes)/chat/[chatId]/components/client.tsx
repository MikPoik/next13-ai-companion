  "use client";
  import React, { FormEvent, useEffect, useRef, ElementRef, useState, ReactNode } from "react";
  import { useRouter } from "next/navigation";
  import { useTheme } from "next-themes";
  import { ChatMessage as ChatMessageComponent, ChatMessageProps } from "@/components/chat-message";
  import { Companion, Message as PrismaMessage, Role } from "@prisma/client";
  import { ChatHeader } from "@/components/chat-header";
  import { chatMessagesJsonlToBlocks } from "@/components/parse-blocks-from-message";
  import { BeatLoader } from "react-spinners";
  import { MoonLoader } from "react-spinners";
  import { SendHorizonal, X, RotateCcw, Trash2, MoveDown } from "lucide-react";
  import { useProModal } from "@/hooks/use-pro-modal";
  import { useToast } from "@/components/ui/use-toast";
  import { useChat, Message as ChatMessageType } from "ai/react";
  import { Input } from "@/components/ui/input";
  import { Button } from "@/components/ui/button";
  import useStreamStore from "@/lib/use-stream-store";
  import {parseImageFromBlocks} from "@/lib/utils";
  import { useIsMobile } from '@/lib/is-mobile';
  import { Sidebar } from "@/components/sidebar";

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

  interface ChatClientDisplayMessage {
    id: string;
    role: Role;
    content: ReactNode;
  }

  const scrollContainerStyle: React.CSSProperties = {
    msOverflowStyle: "none", 
    scrollbarWidth: "none" 
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
    const streamContent = useStreamStore((state) => state.content);
    const inputRef = useRef<HTMLInputElement>(null);
    const isMobile = useIsMobile();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
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
        //console.log(response)
        const lastUserMessage = messagesRef.current[messagesRef.current.length - 1];
        //console.log(lastUserMessage)

        fetch(`/api/chat/${companion.id}/save-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: lastUserMessage.content, id: lastUserMessage.id })
        }); 
        //console.log(messagesRef)
        //console.log(messages)
        
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      },
      onFinish(message){
        const finalStreamedContent = useStreamStore.getState().content;
        //console.log("Streamed content from Zustand:", finalStreamedContent);
      


        const lastUserMessage = messagesRef.current[messagesRef.current.length - 2];
        const lastAssistantMessage = messagesRef.current[messagesRef.current.length - 1];
        //console.log(lastUserMessage)
        //console.log(lastAssistantMessage)
        setInput("");
        if (!lastAssistantMessage.content.includes("I'm sorry, I had an error when generating response")){
          fetch(`/api/chat/${companion.id}/save-response`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: finalStreamedContent, id: lastAssistantMessage.id, blockList: lastAssistantMessage.content })
          }); 
        }
        //console.log(messages)
        //console.log(messagesRef)
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        const parsedContent = parseImageFromBlocks(lastAssistantMessage.content,finalStreamedContent)
        //Loop messages here, check for last message and set the finalStreamedContent to the last message.content
        const updatedMessages = (prevMessages: ChatMessageType[]): ChatMessageType[] => {
          const updatedMessages = [...prevMessages];
          if (updatedMessages.length > 0) {
            const lastIndex = updatedMessages.length - 1;
            updatedMessages[lastIndex] = {
              ...updatedMessages[lastIndex],
              content: parsedContent
            };
          }
          return updatedMessages;
        };
        //console.log(updatedMessages)
        setMessages(updatedMessages as unknown as ChatMessageType[]);
        //console.log(messages)
        //console.log(messagesRef)
        // Clear the streaming message ID when the response is finished

        // Clear the content in the store
        useStreamStore.getState().setContent("");

        setTimeout(() => {
          if (!isMobile && inputRef.current && !isLoading) {
            inputRef.current.focus();
          } 
        },50); 
        setIsSubmitting(false);
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
    
    const submitWithRetry = async (input: string, maxRetries = 3, delay = 1000) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          await append({ role: 'user', content: input });
          return true; // Successful submission
        } catch (error) {
          console.error(`Submission attempt ${i + 1} failed:`, error);
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      return false; // All attempts failed
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
      setIsSubmitting(true);
      const success = await submitWithRetry(input);

      if (success) {
        setInput(""); // Clear input on successful submission
      } else {
        if (inputRef.current) {
          setTimeout(() => {
          }, 1000);
        }
      }
     
    };

    const transformedMessages: ChatMessageProps[] = messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: chatMessagesJsonlToBlocks([message], ""), 
      isLoading: false,
      src: ""
    }));

    useEffect(() => {
      const scrollToBottom = () => {
        if (!scrollRef.current && !isLoading) return;
        if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

        if (isAtBottom && messages.length > 4) {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        }
      };
      // Scroll on new messages or when loading starts/stops
      scrollToBottom();
      // Set up an interval to check for scrolling only while loading
      let scrollInterval: NodeJS.Timeout | null = null;
      if (isLoading) {
        scrollInterval = setInterval(scrollToBottom, 500);
      }
      // Cleanup function
      return () => {
        if (scrollInterval) clearInterval(scrollInterval);
      };
    }, [messages, streamContent, isLoading]);
    
    return (
      <div className="flex h-full">
        <div className="hidden md:flex  h-full w-20 flex-col fixed inset-y-0">
        <Sidebar isPro={isPro} />
        </div>
        <div className="flex flex-col h-full flex-grow md:pl-20">
        <ChatHeader isPro={isPro} companion={companion} />
        <div ref={scrollRef} style={scrollContainerStyle} className="flex-1 overflow-y-auto py-2 pb-5 pl-1">
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
                accumulatedContentRef={accumulatedContentRef}
              />
              {transformedMessages.length >= 2 && index === transformedMessages.length - 2 && !isLoading && message.role === "user" && (
                <Button onClick={() => handleDelete(transformedMessages[transformedMessages.length - 1].id, transformedMessages[transformedMessages.length - 2].id)} disabled={isDeleting} className="opacity-20 group-hover:opacity-100 transition hover:bg-red-500" size="icon" variant="ghost" title="Delete message pair">
                  <Trash2 className="w-4 h-4" /><MoveDown className="w-3 h-3" />
                </Button>
              )}
              
            </div>
          ))}
          <div ref={bottomRef} />

          
        </div>
        <form onSubmit={onSubmit} className="border-t border-primary/10 py-1 pb-1 flex items-center gap-x-0 pl-1 sticky bottom-0">
          <Input disabled={isLoading || isSubmitting} value={input} onChange={handleInputChange} placeholder="Type a message" className="rounded-lg bg-primary/10" ref={inputRef} />
          <Button type="submit" disabled={isLoading || isSubmitting} variant="ghost">
                {isLoading || isSubmitting ? (
             <MoonLoader size={20} color={theme === 'light' ? 'black' : 'white'} loading={isLoading} />
                ) : (
                  <SendHorizonal className="w-4 h-4" />
                )}
          </Button>
          {transformedMessages.length >= 2 && (
            <Button onClick={handleReload} disabled={isReloading} variant="ghost">
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </form>
      </div>
      </div>
    );
  };