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
    width: "100%",
    transform: "translateZ(0)",    // Force GPU acceleration
    WebkitFontSmoothing: "antialiased",
    overflow: "hidden",
  },
  loadedWrapper: {  // Add this missing style
    backgroundColor: "transparent",
    transition: "background-color 0.3s ease",
  },
  loadedImg: {
    opacity: 1,
    objectFit: "cover",
    width: "100%",
    height: "100%",
    imageRendering: "high-quality",  // Modern browsers
    WebkitImageRendering: "crisp-edges", // Webkit
  }
};
function applyLoadedStyles(wrapperElement: HTMLDivElement, imgElement: HTMLImageElement) {
  Object.assign(wrapperElement.style, imageStyles.loadedWrapper);
  Object.assign(imgElement.style, imageStyles.loadedImg);
}

export const messageStyles = {
  other: "text-white-200 dark:text-gray-100", // default text
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
    let formatted = text;
    let elements: JSX.Element[] = [];
    let lastIndex = 0;

    // Find all formatting patterns in order of priority
    const matches = [
      ...text.matchAll(/\*([^*]+)\*|"([^"]+)"|(\([^)]+\))/g)
    ].sort((a, b) => (a.index || 0) - (b.index || 0));

    matches.forEach((match, idx) => {
      if (match.index !== undefined) {
        // Add any plain text before this match
        if (match.index > lastIndex) {
          elements.push(
            <span key={`text-${lastIndex}`} className={messageStyles.other}>
              {text.slice(lastIndex, match.index)}
            </span>
          );
        }

        const content = match[0];
        if (content.startsWith('*') && content.endsWith('*')) {
          elements.push(
            <i key={`action-${match.index}`} className={messageStyles.action}>
              {content.slice(1, -1)}
            </i>
          );
        } else if (content.startsWith('"') && content.endsWith('"')) {
          elements.push(
            <span key={`speech-${match.index}`} className={messageStyles.speech}>
              {content}
            </span>
          );
        } else if (content.startsWith('(') && content.endsWith(')')) {
          elements.push(
            <span key={`internal-${match.index}`} className={messageStyles.internal}>
              {content}
            </span>
          );
        }

        lastIndex = match.index + content.length;
      }
    });

    // Add any remaining text after the last match
    if (lastIndex < text.length) {
      elements.push(
        <span key={`text-${lastIndex}`} className={messageStyles.other}>
          {text.slice(lastIndex)}
        </span>
      );
    }

    return elements;
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
      // Split blocks into separate messages
      return content.map((block, index) => {
        if (!block.id) {
          block.id = uuidv4();
        }

        // Create a wrapper for each message type
        const messageWrapper = (messageContent: JSX.Element) => (
          <div key={block.id} className="flex flex-col gap-2">
            <span className="text-sm text-gray-500">
              {role === "user" ? "You" : companionName}:
            </span>
            {messageContent}
          </div>
        );
        if ('text' in block && typeof block.text === 'string' && validTypes.includes(block.messageType!) && block.messageType === MessageTypes.TEXT && (block.role === 'user' || block.role === 'assistant' || block.role === 'system') && !/!\[.*?\]\(.*?\)/.test(block.text)) {
          //console.log("Text block detected:", block)
          return messageWrapper(
            <div className="leading-6 text-sm">
              {formatText(block.text)}
            </div>
          );
        }
        if (block.streamState === 'started' && block.messageType !== MessageTypes.IMAGE && block.messageType !== MessageTypes.VOICE && block.mimeType != "image/png") {
          //console.log("Stream block detected:", block)
           return <StreamContent blockId={block.id} onContentUpdate={accumulatedContentRef?.current ? (newContent: string) => accumulatedContentRef.current = newContent : undefined} key={block.id} />;
        }
        if (block.messageType === MessageTypes.VOICE) {
          console.log("Audio block detected:", block.text)
          const parseVoiceUrlFromMarkdown = (text: string) => {
            const regex = /\!\[voice]\((.*?)\)/;
            const matches = text.match(regex);
            const strippedText = text.replace(/\!\[.*?\]\(.*?\)/g, '').trim();
            
            return {
              audioUrl: matches ? matches[1] : null,
              cleanText: strippedText
            };
          };

          const { audioUrl, cleanText } = parseVoiceUrlFromMarkdown(block.text);
          
          return messageWrapper(
            <div className="leading-6 text-sm">
              {cleanText && cleanText !== "" && (
                <p className="mb-2">{formatText(cleanText)}</p>
              )}
              <div className="audio-player-wrapper">
                <audio controls className="w-full max-w-md">
                  <source src={audioUrl || undefined} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          );
        }
        
        if (block.messageType === MessageTypes.IMAGE) {
          //console.log("Image block detected:", block.text)
          const parseImageUrlFromMarkdown = (text: string) => {
            // Extract URL
            const regex = /\!\[(?!voice).*?\]\((.*?)\)/;
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
          return messageWrapper(
            <div className="leading-6 text-sm">
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
                                 fill
                                 quality={100}                    // Increase from default 75
                                 sizes="(max-width: 768px) 100vw, 768px"
                                 className="object-cover"         // Change from object-contain for sharper images
                                 placeholder="empty"              // Remove blur placeholder
                                 loading="eager" 
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
                               />
                             </div>)}
              </div>
            </div>
          );
        }


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
        "group flex flex-col gap-4 py-2 w-full",
        role === "user" && "justify-end"
      )}>
        {renderContent()}
      </div>
    </>
  );
}