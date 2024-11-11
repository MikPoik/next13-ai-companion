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
  import { Dictionary } from "lodash";
  const { v4: uuidv4 } = require('uuid');

  interface ChatClientProps {
    isPro: boolean;
    chat_history?: { role: string; content: string; }[]; 
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
      id: uuidv4(),//message.id,
      role: message.role as Role,
      content: message.content,
      createdAt: message.createdAt ?? new Date(),
      updatedAt: new Date(),
      companionId: companionId,
      userId: "", // Add validation and checks as necessary here
    };
  };

  export const ChatClient = ({ isPro, companion,chat_history }: ChatClientProps) => {
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
    const [showInputMsg, setShowInputMsg] = useState("");
    const retryCountRef = useRef(0);
    const maxRetries = 3;

    const [autoMessageSent, setAutoMessageSent] = useState(false);
    const initializingRef = useRef(false);
    const initializedRef = useRef(false);

    const initialMessages: PrismaMessage[] = [

        ...(chat_history || []).map((message,index) => ({
        ...message,
        id: index.toString(), // Generate a unique ID here
        role: message.role as Role,
        updatedAt: new Date(),
        createdAt: new Date(),
        companionId: companion.id,
        userId: "",
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
      streamProtocol: "text",
      api: `/api/chat/${companion.id}`,
      initialMessages: Array.isArray(initialMessages) ? initialMessages : [], 
      body: {
        chatId: `${companion.id}`,
      },

      onResponse: response => {    
        if (!response.ok) {
          console.log("Error on response: ",response.status );
        }
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      },
      onFinish: (message) => {
        
        const finalStreamedContent = useStreamStore.getState().content;
        
      
        const lastUserMessage = messagesRef.current[messagesRef.current.length - 2];
        const lastAssistantMessage = messagesRef.current[messagesRef.current.length - 1];
        //console.log("last user message",lastUserMessage)
        //console.log("last assistant message",lastAssistantMessage)
        setInput("");
        /*
        if (!lastAssistantMessage.content.includes("I'm sorry, I had an error when generating response")){
          fetch(`/api/chat/${companion.id}/save-prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: lastUserMessage.content, id: lastUserMessage.id })
          }); 
          fetch(`/api/chat/${companion.id}/save-response`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: lastAssistantMessage, id: lastAssistantMessage.id, blockList: lastAssistantMessage.content })
          }); 
        }
        */
        //console.log(messages)
        //console.log(messagesRef)
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        //const parsedContent = parseImageFromBlocks(lastAssistantMessage.content,finalStreamedContent)
        //Loop messages here, check for last message and set the finalStreamedContent to the last message.content
        
        const updatedMessages = (prevMessages: ChatMessageType[]): ChatMessageType[] => {
          const updatedMessages = [...prevMessages];
          if (updatedMessages.length > 0) {
            const lastIndex = updatedMessages.length - 1;
            updatedMessages[lastIndex] = {
              ...updatedMessages[lastIndex],
              content: lastAssistantMessage.content
            };
          }
          return updatedMessages;
        };
        //console.log(updatedMessages)
        setMessages(updatedMessages as unknown as ChatMessageType[]);

        //console.log(messages)
        //console.log(messagesRef)

        // Clear the content in the store
        useStreamStore.getState().setContent("");

        setTimeout(() => {
          if (!isMobile && inputRef.current && !isLoading) {
            inputRef.current.focus();
          } 
        },50); 
        setIsSubmitting(false);
      },
      onError: error => {
        console.error("Chat error detected:", error);
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          setIsSubmitting(true);
          setTimeout(() => {
            handleRetry();
          }, 1000 * retryCountRef.current);
        } else {
          setIsSubmitting(false);
          toast({
            description: "Failed to send message after multiple attempts. Please try again.",
            variant: "destructive",
            duration: 3000,
          });
        }
      },
      sendExtraMessageFields: true,
    });

    const messagesRef = useRef<ChatMessageType[]>(Array.isArray(messages) ? messages : []);
    
    // Use refs to prevent double initialization
    useEffect(() => {
      if (initializingRef.current || initializedRef.current) {
        return;
      }
      const autoSubmit = async () => {
        try {
          initializingRef.current = true;

          if (messages.length <= 1) {
            await append({
              content: `As ${companion.name}, narrate the scene for me in this chat.
Narrative Guidelines:
• Format spoken dialogue in quotation marks in first person.
• Show actions between asterisks in third person.
• Express internal thoughts in parentheses.
• Include emotional states and reactions.
• Describe environment and atmosphere when relevant.
• Use third-person narration.

Companion Narration Instructions:
• Narrate ${companion.name}'s perspective in third person.
• Keep responses concise and engaging
• Balance character dialogue, action, and internal monologue
• Use environmental details to enhance immersion
• Maintain consistent character voice and perspective

Start ${companion.name}'s response with a brief description of the setting or an action.`,
              role: "user",
            }, {
              options: {
                body: {
                  chatId: companion.id
                }
              }
            });
          }

          initializedRef.current = true;
        } finally {
          initializingRef.current = false;
        }
      };
      autoSubmit();
    }, [messages, append, companion.id]);
    
    useEffect(() => {
      messagesRef.current = Array.isArray(messages) ? messages.map(message => ({
        ...message,
        createdAt: new Date(message.createdAt || Date.now())
      })).map(message =>
        transformChatMessageToPrismaMessage(message, companion.id)
      ) : [];
    }, [messages]);



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
          duration: 3000,
        });
        setIsReloading(false);
        return;
      }
      if (status === "NoBalance") {
        toast({
          description: "Not enough balance, top up your balance.",
          variant: "destructive",
          duration: 3000,
        });
        setIsReloading(false);
        return;
      }
      const lastAssistantMessage = messagesRef.current[messagesRef.current.length - 1];

      await fetch(`/api/chat/${companion.id}/delete-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({id: lastAssistantMessage.id,chatId: companion.id })
      }).catch(error => {
        console.error('Failed to reload chat:', error);
        toast({
          description: 'Failed to reload chat.',
          variant: 'destructive',
          duration: 3000,
        });
      });
      reload();
      setIsReloading(false);
    };

    const handleDelete = async (id: string, id2:string) => {
      setIsDeleting(true);
      console.log("message id",id,id2)

      await fetch(`/api/chat/${companion.id}/delete-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, id2: id2, chatId: companion.id })
      }).catch(error => {
        console.error('Failed to delete message:', error);
        toast({
          description: 'Failed to delete message.',
          variant: 'destructive',
          duration: 3000,
        });
        setIsDeleting(false);
      });

      setMessages((messages as PrismaMessage[]).filter(message => message.id !== id && message.id !== id2));
      setIsDeleting(false);
    };
    

    
    const handleRetry = () => {
      console.log(`Retrying... Attempt ${retryCountRef.current}`);
      setIsSubmitting(true);
      handleSubmit(new Event('submit') as any, {});
    };
    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      useStreamStore.getState().setContent("");
      if (!input) {
        toast({
          description: "Input cannot be empty.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      // Check if messagesRef.current is a valid array
      if (!Array.isArray(messagesRef.current)) {
        console.error('Error: messagesRef.current is not a valid array');
        messagesRef.current = []; // Initialize it as an empty array if not
      }
      
      const { status, message } = await checkBalance(companion.id);
      if (status === 'error' && message) {
        toast({
          description: message,
          variant: 'destructive',
          duration: 3000,
        });
        return;
      }
      if (status === "NoBalance") {
        toast({
          description: "Not enough balance, top up your balance.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      setIsSubmitting(true);
      retryCountRef.current = 0;
      setShowInputMsg(input)


      try {
        handleSubmit(e as any, {});
      }
      catch (error) {
        console.error('An error occurred:', error);
        setIsSubmitting(false);
        toast({
          description: 'An unexpected error occurred.',
          variant: 'destructive',
          duration: 3000,
        });
  
    };
    }

    const transformedMessages: ChatMessageProps[] = messages.slice(1).map((message) => (
      {

      id: message.id || uuidv4(),

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
          {error && retryCountRef.current > 0 && isSubmitting && (
            <>
              <div className="flex-1 mr-4 space-y-2 py-2">
                <span className="text-sm text-gray-500">
                  {"You"}:
                </span>
                <div className="leading-6 text-sm">
                  {showInputMsg}
                </div>
              </div>
            </>
          )}
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
            <Button onClick={handleReload} disabled={isLoading || isReloading || isSubmitting} variant="ghost">
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </form>
      </div>
      </div>
    );
  };