import { useState, useEffect, useRef } from "react";
import React from "react";
import { BeatLoader } from "react-spinners";
import { Copy } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { BotAvatar } from "@/components/bot-avatar";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { chatMessagesJsonlToBlocks } from "@/components/parse-blocks-from-message";
import { MessageTypes, validTypes } from "@/components/block-chat-types";
import { StreamContent } from "@/components/stream-content"; 
import Image from "next/image";

import useStreamStore from "@/lib/use-stream-store";
const { v4: uuidv4 } = require('uuid');

export interface ChatMessageProps {
  id: string;
  role: "system" | "user" | "function" | "assistant" | "data" | "tool";
  content?: React.ReactNode | string | any[];
  isLoading?: boolean;
  src?: string;
  blockId?: string;
  streamState?: string;
  companionName?: string;
  accumulatedContentRef?: React.MutableRefObject<string>;
}

const imageStyles = {
  wrapper: {
    position: "relative" as const,
    backgroundColor: "#303030",
    maxWidth: "768px",
    aspectRatio: "3/4",
    transition: "all 0.3s ease-in-out",
    overflow: "hidden",
  },
  loadedWrapper: {
    backgroundColor: "transparent",
  },
  loadedImg: {
    opacity: 1,
    objectFit: "cover" as const,
    width: "100%",
    height: "100%",
  }
};
function applyLoadedStyles(wrapperElement: HTMLDivElement, imgElement: HTMLImageElement) {
  Object.assign(wrapperElement.style, imageStyles.loadedWrapper);
  Object.assign(imgElement.style, imageStyles.loadedImg);
}

export const messageStyles = {
  other: "text-white-200", // default text
  action: "italic text-yellow-500 dark:text-yellow-500", // *actions*
  internal: "text-gray-300 dark:text-gray-300", // (thoughts)
  emphasis: "text-blue-400 dark:text-blue-400", // for other emphasized text
  speech: "text-white-200 dark:text-white-200", // for other text
};



export const ChatMessage = ({
  id,
  role,
  content,
  isLoading,
  src,
  blockId,
  streamState,
  companionName,
  accumulatedContentRef,
}: ChatMessageProps) => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { content: streamedContent } = useStreamStore(); // Access streamed content from Zustand
  const [imageLoaded, setImageLoaded] = useState(false);
  const maxRetries = 180;

  useEffect(() => {
    // Logging purpose or other side effects
  }, [streamedContent]);

  const handleImageLoad = (wrapperElement: HTMLDivElement, imgElement: HTMLImageElement) => {

    setImageLoaded(true);
    applyLoadedStyles(wrapperElement, imgElement);

  };

  if (isLoading || (streamState === 'started' && !streamedContent)) {
    return <BeatLoader color={theme === "light" ? "black" : "white"} size={5} />;
  }

  const formatText = (text: string) => {

    const patterns = {
        actions: /(\*[^*]+\*)/g,         // Matches *actions*
        quotes: /"([^"]+)"/g,            // Matches "quotes"
        internal: /\(([^)]+)\)/g,        // Matches (internal thoughts)
        emphasis: /_([^_]+)_/g           // Matches _emphasis_
    };
    const parts = text.split(/((?:\*[^*]+\*)|(?:"[^"]+")|\([^)]+\)|(?:_[^_]+_))/g);
    return parts.map((part, index) => {
      if (part && part.startsWith('*') && part.endsWith('*')) {
        let remaining_part = part.slice(1, -1);
        if (remaining_part.length > 0) {
          return <i key={index} className={messageStyles.action}>{part.slice(1, -1)}</i>;
        }
      }
      if (part && part.startsWith('(') && part.endsWith(')')) {
        let remaining_part = part.slice(1, -1);
        if (remaining_part.length > 0) {
          return <span key={index} className={messageStyles.internal}>{part}</span>;
        }
      }
      if (part && part.startsWith('[') && part.endsWith(']')) {
        let remaining_part = part.slice(1, -1);
        if (remaining_part.length > 0) {
          return <i key={index} className={messageStyles.action}>{part.slice(1, -1)}</i>;
        }
      }
      if (part && part.startsWith('"') && part.endsWith('"')) {
        let remaining_part = part.slice(1, -1);
        if (remaining_part.length > 0) {
          return <span key={index} className={messageStyles.speech}>{part}</span>;
        }
      }
      return <span key={index} className={messageStyles.other}>{part}</span>;
    });
  };

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
      return <div>{streamedContent}</div>;
    }
    if (Array.isArray(content)) {
      return content.map((block, index) => {
        if (!block.id) {
          block.id = uuidv4();
        }
        if ('text' in block && typeof block.text === 'string' && validTypes.includes(block.messageType!) && block.messageType === MessageTypes.TEXT && (block.role === 'user' || block.role === 'assistant' || block.role === 'system') && !/!\[.*?\]\(.*?\)/.test(block.text)) {
          //console.log("Text block detected:", block)
          return <p key={block.id}>{formatText(block.text)}</p>;
        }
        if (block.streamState === 'started' && block.messageType !== MessageTypes.IMAGE && block.mimeType != "image/png") {
          //console.log("Stream block detected:", block)
           return <StreamContent blockId={block.id} onContentUpdate={accumulatedContentRef?.current ? (newContent: string) => accumulatedContentRef.current = newContent : undefined} key={block.id} />;
        }
        if (block.messageType === MessageTypes.IMAGE) {
          //console.log("Image block detected:", block.text)
          const parseImageUrlFromMarkdown = (text: string) => {
            // Extract URL
            const regex = /\!\[.*?\]\((.*?)\)/;
            const matches = text.match(regex);

            // Strip markdown image syntax from text
            const strippedText = text.replace(/\!\[.*?\]\(.*?\)/g, '').trim();


            // Return both URL and cleaned text
            return {
              imageUrl: matches ? matches[1] : null,
              cleanText: strippedText
            };
          };
          const { imageUrl, cleanText } = parseImageUrlFromMarkdown(block.text);
          
          //console.log("Parsed image url: ", imageUrl)
          return  (
            <div key={block.id}>
              {cleanText && cleanText !== "" && (
                <p className="mb-2">{formatText(cleanText)}</p>
              )}
              <div
                className={`image-placeholder-wrapper ${imageLoaded ? 'loaded' : ''}`}
                style={imageStyles.wrapper}
              >
                {imageUrl && (<div ref={wrapperRef} style={imageStyles.wrapper}>
                               <Image
                                 src={imageUrl}
                                 alt="Generated Image"
                                 fill={true}
                                 onLoad={(event) => {
                                   if (wrapperRef.current) {
                                     handleImageLoad(wrapperRef.current, event.target as HTMLImageElement);
                                   }
                                 }}
                                 onError={(event) => {
                                    /*
                                   const imgElement = event.target as HTMLImageElement;
                                   const retryCount = parseInt(imgElement.dataset.retryCount || '0');

                                   if (retryCount < maxRetries) {
                                     imgElement.dataset.retryCount = (retryCount + 1).toString();
                                     setTimeout(() => {
                                       imgElement.src = imageUrl;
                                     }, 2000);
                                   } else {
                                     console.error(`Failed to load image after ${maxRetries} attempts`);
                                     imgElement.style.display = 'none';
                                   }
                                   */
                                 }}
                                 className="object-contain"
                                 sizes="(max-width: 768px) 100vw, 768px"
                               />
                             </div>)}
              </div>
            </div>
          );
        }
        return null;
      }).filter(Boolean);
    } else if (typeof content === 'string') {
      console.log("string content")
    }
    console.log("Message content string, omitting", content)
    return null;
  };

  return (
    <>
      <style jsx global>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.6; }
        }
        .image-placeholder-wrapper {
          position: relative;
          background-color: rgb(50, 50, 50);
          max-width: 768px;
          aspect-ratio: 3/4;
          transition: background-color 0.5s ease-in-out;
          overflow: hidden;
        }
        .image-placeholder-wrapper:not(.loaded) {
          animation: fadeInOut 2s infinite;
        }
        .image-placeholder-wrapper img {
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
        }
        .image-placeholder-wrapper.loaded img {
          opacity: 1;
        }
      `}</style>
      <div className={cn(
        "group flex items-start gap-x-3 py-2 w-full",
        role === "user" && "justify-end"
      )}>
        <div className="flex-1 mr-4 space-y-2">
          <span className="text-sm text-gray-500">
            {role === "user" ? "You" : companionName}:
          </span>
          <div className="leading-6 text-sm">
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
}