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

export interface ChatMessageProps {
  id: string;
  role: "system" | "user" | "function" | "assistant",
  content?: React.ReactNode | string | any[];
  isLoading?: boolean;
  src?: string;
  blockId?: string;
  streamState?: string;
  companionName: string; 
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
    if (streamState === 'started' && streamedContent) {
      console.log("update stream div")
      return <div>{streamedContent}</div>;
    } 
    else if (Array.isArray(content)) {
      return content.map((block, index) => {
        if ('text' in block && typeof block.text === 'string' && validTypes.includes(block.messageType) && block.messageType === MessageTypes.USER_MESSAGE) {
          return <p key={index}>{block.text}</p>;
        }

        if (block.streamState === 'started') {
          console.log("start streaming ",block.id);
          return <StreamContent blockId={block.id} onContentUpdate={setStreamedContent} key={index} />;
        }

        return null;
      }).filter(Boolean);
    } else if (typeof content === 'string') {
      try {
        console.log("Trying to parse string")
        console.log(content)
        const parsedContent = JSON.parse(content);
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
          const blocks = chatMessagesJsonlToBlocks([{ content: parsedContent }], null);
          return blocks
            .filter(block => validTypes.includes(block.messageType))
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
        }
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
    }
    return content;
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