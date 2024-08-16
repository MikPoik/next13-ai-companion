import React, { useState } from "react";
import { BeatLoader } from "react-spinners";
import { useTheme } from "next-themes";
import { useToast } from "@/components/ui/use-toast";
import { validTypes, MessageTypes } from "@/components/block-chat-types";
import { StreamContent } from "@/components/stream-content";
import useStreamStore from "@/lib/useStreamStore"; // Import Zustand store
export interface ChatMessageProps {
  id: string;
  role: "system" | "user" | "function" | "assistant";
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
    minWidth: "512px",
    minHeight: "686px",
    maxWidth: "512px",
    transition: "background-color 0.5s ease-in-out",
    animation: "fadeInOut 2s infinite",
  },
  img: {
    maxWidth: "512px",
    display: "block",
    opacity: 0,
    transition: "opacity 0.5s ease-in-out",
  },
  loadedWrapper: {
    backgroundColor: "transparent",
    animation: "none",
  },
  loadedImg: {
    opacity: 1,
  },
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
  const handleImageLoad = (wrapperElement: HTMLDivElement, imgElement: HTMLImageElement) => {
    setImageLoaded(true);
    applyLoadedStyles(wrapperElement, imgElement);
  };
  if (isLoading || (streamState === "started" && !streamedContent)) {
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
  const renderContent = () => {
    if (streamState === "started" && streamedContent) {
      return <div>{streamedContent}</div>;
    }
    if (Array.isArray(content)) {
      return content.map((block, index) => {
        console.log("Map block ", block)
        // Render different types of blocks here
        if ('text' in block && typeof block.text === 'string' && validTypes.includes(block.messageType!) && block.messageType === MessageTypes.TEXT &&
            (block.role === 'user' || block.role === 'assistant' || block.role === 'system')) {
          return <p key={block.id}>{formatText(block.text)}</p>;
        }
        if (block.streamState === 'started' && block.messageType !== MessageTypes.IMAGE && block.mimeType != "image/png") {
          return <StreamContent blockId={block.id} onContentUpdate={accumulatedContentRef?.current ? (newContent: string) => accumulatedContentRef.current = newContent : undefined} key={block.id} />;
        }
        if (block.messageType === MessageTypes.IMAGE || block.mimeType == "image/png") {
          return <div key={block.id}>
            <div className={`image-placeholder-wrapper ${imageLoaded ? 'loaded' : ''}`} style={imageStyles.wrapper}>
              <img
                src={block.streamingUrl}
                alt={block.src}
                style={imageStyles.img}
                onLoad={(e) => handleImageLoad(e.currentTarget.parentElement as HTMLDivElement, e.currentTarget)}
              />
            </div>
            {block.text && block.text !== "" && <span> {formatText(block.text)}</span>}
          </div>;
        }
        return null;
      }).filter(Boolean);
    } else if (typeof content === "string") {
      return <p>{formatText(content)}</p>;
    }
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
      <div className={`group flex items-start gap-x-3 py-2 w-full ${role === "user" ? "justify-end" : ""}`}>
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
};