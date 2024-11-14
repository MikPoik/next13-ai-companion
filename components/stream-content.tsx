import React, { useEffect, useState, useCallback } from 'react';
import { debounce } from 'lodash';
import useStreamStore from "@/lib/use-stream-store";

interface StreamContentProps {
  blockId: string;
  onContentUpdate?: (newContent: string) => void;
}

const formatText = (text: string): (string | JSX.Element)[] => {
  return text.split(/([*[\]].*?[*\[\]])/).map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <i key={index} style={{ color: 'rgba(255,255,255,0.6)' }}>{part.slice(1, -1)}</i>;
    }
    if (part.startsWith('(') && part.endsWith(')')) {
      return <i key={index} style={{ color: 'rgba(255,255,255,0.6)' }}>{part.slice(1, -1)}</i>;
    }
    if (part.startsWith('[') && part.endsWith(']')) {
      return <i key={index} style={{ color: 'rgba(255,255,255,0.6)' }}>{part.slice(1, -1)}</i>;
    }
    if (part.startsWith('"') && part.endsWith('"')) {
      return <i key={index} style={{ color: 'rgba(255,255,255,0.9)' }}>{part}</i>;
    }
    return part;
  });
};

export const StreamContent: React.FC<StreamContentProps> = ({ blockId, onContentUpdate }) => {
  const [error, setError] = useState<string | null>(null);
  const { content: streamContent } = useStreamStore();
  // Change to inline function and add all dependencies
  const debouncedOnContentUpdate = useCallback((content: string) => {
    if (onContentUpdate) {
      onContentUpdate(content);
    }
  }, [onContentUpdate]);
  useEffect(() => {
    if (streamContent) {
      debouncedOnContentUpdate(streamContent);
    }
  }, [streamContent, debouncedOnContentUpdate]);
  if (error) {
    return <div>Error: {error}</div>;
  }
  const formattedContent = formatText(streamContent);
  return <div>{formattedContent}</div>;
};