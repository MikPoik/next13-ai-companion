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

const imageStyles = {
  wrapper: {
    backgroundColor: "rgb(50, 50, 50)",
    minWidth: "512px", // or any appropriate value
    minHeight: "768px", // ensures height is set so placeholder is visible
    maxWidth: "512px", // or any appropriate value
    transition: "background-color 0.5s ease-in-out",
    animation: "fadeInOut 2s infinite"
  },
  img: {
    maxWidth: "512px",
    display: "block",
    opacity: 0, // Hide the image initially
    transition: "opacity 0.5s ease-in-out"
  },
  loadedWrapper: {
    backgroundColor: "transparent", // Changes background color to transparent
    animation: "none"
  },
  loadedImg: {
    opacity: 1 // Show the image once it has loaded
  }
};

function applyLoadedStyles(wrapperElement: HTMLDivElement, imgElement: HTMLImageElement) {
  Object.assign(wrapperElement.style, imageStyles.loadedWrapper);
  Object.assign(imgElement.style, imageStyles.loadedImg);
}

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const handleImageLoad = (wrapperElement: HTMLDivElement, imgElement: HTMLImageElement) => {
    setImageLoaded(true);
    applyLoadedStyles(wrapperElement, imgElement);
  };
  useEffect(() => {
    //console.log("streamedContent updated: ", streamedContent);
  }, [streamedContent]);

  if (isLoading || (streamState === 'started' && !streamedContent)) {
    return <BeatLoader color={theme === "light" ? "black" : "white"} size={5} />;
  }
  const formatText = (text: string) => {
    return text.split(/([*"].*?[*"])/).map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return <i key={index} style={{ color: "rgba(255,255,255,0.6)" }}>{part.slice(1, -1)}</i>;
      }
      if (part.startsWith('"') && part.endsWith('"')) {
        return <i key={index} style={{ color: "rgba(255,255,255,0.9)" }}>{part.slice(1, -1)}</i>;
      }
      return part;
    });
  };
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
    //console.log("Message Content ",content)
    if (streamState === 'started' && streamedContent) {
      //console.log("update stream div")
      return <div>{streamedContent}</div>;
    } 
    else if (Array.isArray(content)) {
      //console.log("Message is array")
      return content.map((block, index) => {
        //console.log("block ",block,"Type ",block.messageType,"Role: ",block.role, "MimeType",block.mimeType)
        
        if ('text' in block && typeof block.text === 'string' && validTypes.includes(block.messageType!) && block.messageType === MessageTypes.TEXT && (block.role === 'user' || block.role === 'assistant' || block.role === 'system')) {
          return <p key={block.id}>{formatText(block.text)}</p>;
        }

        if (block.streamState === 'started' && block.messageType !== MessageTypes.IMAGE && block.mimeType != "image/png") {
          //console.log("start streaming ",block, block.messageType, block.mimeType);
          return <StreamContent blockId={block.id} onContentUpdate={setStreamedContent} accumulatedContentRef={accumulatedContentRef} key={block.id} />;
        }
        if (block.messageType === MessageTypes.IMAGE ||block.mimeType == "image/png") {
          let message_text = "";
          if (block.text && block.text !== "") {
            message_text = block.text;
          }
          return <div key={block.id}>{block.text && block.text !== "" && <span> {formatText(block.text)}</span>}<div className={`image-placeholder-wrapper ${imageLoaded ? 'loaded' : ''}`} style={imageStyles.wrapper}>
            <img 
              src={block.streamingUrl} 
              alt={block.src} 
              style={imageStyles.img}
              onLoad={(e) => handleImageLoad(e.currentTarget.parentElement as HTMLDivElement, e.currentTarget)}
            />
            
          </div></div>;
        }
        //console.log("could not determine message type")
        return null;
      }).filter(Boolean);
    } else if (typeof content === 'string') {
      console.log("string content")
    }
    console.log("Message content string, omitting",content)
    return null;
  };

  return (
    <>
      <style jsx>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .image-placeholder-wrapper {
          animation: fadeInOut 2s infinite;
        }
      `}</style>
    <div className={cn(
      "group flex items-start gap-x-3 py-2 w-full",
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
    </>
  );
}