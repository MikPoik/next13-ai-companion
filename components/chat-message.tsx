"use client";
import { useState, useEffect } from "react";
import React from "react";
import { BeatLoader } from "react-spinners";
import { Copy } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { BotAvatar } from "@/components/bot-avatar";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { responseToChatBlocks } from "@/components/ChatBlock";
import { chatMessagesJsonlToBlocks } from "@/components/parse-blocks-from-message";
import { MessageTypes, validTypes } from "@/components/block-chat-types";
import { StreamContent } from "@/components/stream-content";
import { Message } from "ai";
const { v4: uuidv4 } = require('uuid');

export interface ChatMessageProps {
  id: string;
  role: "system" | "user" | "function" | "assistant",
  content?: React.ReactNode | string | any[];
  isLoading?: boolean;
  src?: string;
  blockId?: string;
  streamState?: string;
  companionName?: string; 
  accumulatedContentRef?: React.MutableRefObject<string>;
}

export const ChatMessage = ({
  id,
  role,
  content,
  isLoading,
  src,
  blockId,
  streamState,
  companionName,
  accumulatedContentRef
}: ChatMessageProps) => {

  const { toast } = useToast();
  const { theme } = useTheme();
  const [streamedContent, setStreamedContent] = useState("");

  useEffect(() => {
    //console.log("streamedContent updated: ", streamedContent);
  }, [streamedContent]);

  if (isLoading || (streamState === 'started' && !streamedContent)) {
    return <BeatLoader color={theme === "light" ? "black" : "white"} size={5} />;
  }

  // Function to copy message content to clipboard
  const onCopy = () => {
    if (content) {
      navigator.clipboard.writeText(typeof content === "string" ? content : "");
      toast({
        description: "Message copied to clipboard.",
        duration: 3000,
      });
    }
  };

  const renderContent = () => {
    console.log("Message Content ",content)
    if (streamState === 'started' && streamedContent) {
      console.log("update stream div")
      return <div>{streamedContent}</div>;
    } 
    else if (Array.isArray(content)) {
      console.log("Message is array")
      return content.map((block, index) => {
        console.log("block ",block,"Type ",block.messageType,"Role: ",block.role)
        
        if ('text' in block && typeof block.text === 'string' && validTypes.includes(block.messageType!) && block.messageType === MessageTypes.TEXT && block.role === 'user') {
          console.log("user message")
          return <p key={index}>{block.text}</p>;
        }
        if ('text' in block && typeof block.text === 'string' && validTypes.includes(block.messageType!) && block.messageType === MessageTypes.TEXT && (block.role === 'assistant' || block.role === 'system')) {
          console.log("assistant/system message")
          return <p key={index}>{block.text}</p>;
        }
        if (block.streamState === 'started' && block.messageType !== MessageTypes.IMAGE) {
          console.log("start streaming ",block.id);
          return <StreamContent blockId={block.id} onContentUpdate={setStreamedContent} accumulatedContentRef={accumulatedContentRef} key={index} />;
        }
        if (block.messageType === MessageTypes.IMAGE) {
          console.log("image message")
          return <img key={index} src={block.streamingUrl} alt={block.src} />;
        }
        console.log("could not determine message type")
        return null;
      }).filter(Boolean);
    } else if (typeof content === 'string') {
      //Obsolete?
      /*
      try {
        console.log("Trying to parse string")
        console.log("String content: ",content)
        const parsedContent = JSON.parse(content);
        const message: Message = {
          id: uuidv4(), // Generate a unique id
          role: "user", // Set an appropriate role, or determine it dynamically if needed
          content: parsedContent
        };
        if (Array.isArray(parsedContent)) {
          console.log("Is array")
          // It's a JSON array
          return parsedContent.map((block, index) => {
            return (
              <React.Fragment key={index}>
                {responseToChatBlocks(block)}
              </React.Fragment>
            );
          });
        } else {
          // Single JSON object
          console.log("Is object")
          const blocks = chatMessagesJsonlToBlocks([message], null);
          return blocks
            .filter(block => validTypes.includes(block.messageType!))
            .map((block, index) => (
              <React.Fragment key={index}>
                {responseToChatBlocks({
                  text: block.text,
                  mimeType: block.mimeType,
                  url: block.streamingUrl,
                  id: block.id,
                })}
              </React.Fragment>
            ));
        
      
        
      } catch {
        console.log("Couldn't parse")
        if (typeof content === 'string') {
          console.log("Plain string")
          return <p>{content}</p>;
        }
        console.log("Json")
        return typeof content === 'object' && content !== null
          ? <p>{JSON.stringify(content, null, 2)}</p>
          : <p>{String(content)}</p>;
      }
      */
    }
    console.log("Message content string, omitting",content)
    return null;
  };

  return (
    <div className={cn(
      "group flex items-start gap-x-3 py-4 w-full",
      role === "user" && "justify-end"
    )}>
      <div className="flex-1 mr-4">
        <span className="text-sm text-gray-500">
          {role === "user" ? "You" : companionName}:
        </span>
        <br />
        <span className="leading-6 text-sm">
          {renderContent()}
        </span>
      </div>

    </div>
  );
}