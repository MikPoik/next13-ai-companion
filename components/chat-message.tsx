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
import { responseToChatBlocks } from "@/components/ChatBlock";
import { chatMessagesJsonlToBlocks } from "@/components/parse-blocks-from-message";
import { MessageTypes, validTypes } from "@/components/block-chat-types";
import { StreamContent } from "@/components/stream-content"; 

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
    backgroundColor: "rgb(50, 50, 50)",
    maxWidth: "768px",
    aspectRatio: "3 / 4",
    transition: "background-color 0.5s ease-in-out",
    animation: "fadeInOut 2s infinite",
    overflow: "hidden"
  },
  img: {
    maxWidth: "100%",
    height: "auto",
    display: "block",
    opacity: 0,
    transition: "opacity 0.5s ease-in-out",
    objectFit: "contain" as 'contain',
  },
  loadedWrapper: {
    backgroundColor: "transparent",
    animation: "none",
  },
  loadedImg: {
    opacity: 1,
  },
};

export const messageStyles = {
  other: "text-white-200", // default text
  action: "italic text-yellow-500 dark:text-yellow-500", // *actions*
  internal: "italic text-purple-400 dark:text-purple-400", // (thoughts)
  emphasis: "text-blue-400 dark:text-blue-400", // for other emphasized text
  speech: "text-white-200 dark:text-white-200", // for other text
};


function applyLoadedStyles(wrapperElement: HTMLDivElement, imgElement: HTMLImageElement) {
  Object.assign(wrapperElement.style, imageStyles.loadedWrapper);
  Object.assign(imgElement.style, imageStyles.loadedImg);
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
  accumulatedContentRef,
}: ChatMessageProps) => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const { content: streamedContent } = useStreamStore(); // Access streamed content from Zustand
  const [imageLoaded, setImageLoaded] = useState(false);

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
          return <i key={index} className={messageStyles.action}>{part.slice(1, -1)}</i>;
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
          return <i key={index} className={messageStyles.speech}>{part}</i>;
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
                {imageUrl && (<img 
                  src={imageUrl} 
                  alt="image"
                  style={imageStyles.img}
                  onLoad={(e) => handleImageLoad(e.currentTarget.parentElement as HTMLDivElement, e.currentTarget)}
                  onError={(e) => {
                    const imgElement = e.currentTarget;
                    //Hacky way to trigger image reload before the url is ready
                    setTimeout(() => {
                      //console.log(`Retrying image load for blockId ${imageUrl}`);
                      const newImageUrl = imageUrl;
                      imgElement.src = newImageUrl; // Directly set the src on the img element
                    }, 2000);
                    
                  }}
                />)}
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
      <style jsx>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.6; }
        }
        .image-placeholder-wrapper {
          animation: fadeInOut 2s infinite;
        }
        }
        .image-placeholder-wrapper {
          animation: fadeInOut 2s infinite;
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