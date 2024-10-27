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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { content: streamContent, setContent: setContentStore } = useStreamStore();

  const debouncedOnContentUpdate = useCallback((updatedContent: string) => {
    const debouncedUpdate = debounce((content: string) => {
      if (onContentUpdate) {
        onContentUpdate(content);
      }
    }, 300);
    debouncedUpdate(updatedContent);
  }, [onContentUpdate]);

  const streamData = useCallback(async () => {
    const controller = new AbortController();
    const { signal } = controller;
    try {
      const response = await fetch(`/api/block/${blockId}`, { signal });
      if (!response.body) throw new Error('No response body');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulatedContent += decoder.decode(value, { stream: true });
        const plainTextUpdate = accumulatedContent;
        setContentStore(accumulatedContent);
        debouncedOnContentUpdate(plainTextUpdate);
      }
    } catch (err) {
      if (signal.aborted) {
        console.log('Fetch aborted due to unmount or navigation');
      } else {
        console.error('Error during fetching:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, [blockId, setContentStore, debouncedOnContentUpdate]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const controller = new AbortController();
    const { signal } = controller;

    if (signal.aborted) {
      console.log('Fetch aborted, not initiating due to signal already aborted');
      return;
    }

    if (blockId) {
      streamData();
    }

    return () => controller.abort();
  }, [blockId, streamData]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  const formattedContent = formatText(streamContent);
  return <div>{formattedContent}</div>;
};