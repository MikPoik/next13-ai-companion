import React, { useEffect, useState, useCallback } from 'react';
import { debounce } from 'lodash';

import useStreamStore from "@/lib/use-stream-store";

interface StreamContentProps {
  blockId: string;
  onContentUpdate?: (newContent: string) => void;
  
}

const formatText = (text: string): (string | JSX.Element)[] => {
  return text.split(/([*"].*?[*"])/).map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <i key={index} style={{ color: 'rgba(255,255,255,0.6)' }}>{part.slice(1, -1)}</i>;
    }
    if (part.startsWith('"') && part.endsWith('"')) {
      return <i key={index} style={{ color: 'rgba(255,255,255,0.9)' }}>{part.slice(1, -1)}</i>;
    }
    return part;
  });
};

export const StreamContent: React.FC<StreamContentProps> = ({ blockId, onContentUpdate }) => {
  const { content, setContent } = useStreamStore((state) => state);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { content: streamContent, setContent: setContentStore } = useStreamStore();
  
  const debouncedOnContentUpdate = useCallback(
    debounce((updatedContent: string) => {
      if (onContentUpdate) {
        onContentUpdate(updatedContent);
      }
    }, 300),
    [onContentUpdate]
  );

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const controller = new AbortController();
    const { signal } = controller;

    const streamData = async () => {
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
          

          // Update to set content in chunks as received without waiting for the entire message.
          const plainTextUpdate = accumulatedContent;
          const formattedContent = formatText(plainTextUpdate);
          
          setContentStore(accumulatedContent);
          //console.log("Updated store with:", plainTextUpdate); // Add this log
          debouncedOnContentUpdate(plainTextUpdate); // Notify parent component of new content
        }
        //console.log('Stream content finished, final content: ', accumulatedContent);
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
    };

    if (signal.aborted) {
      // If the signal is already aborted, just log and return
      console.log('Fetch aborted, not initiating due to signal already aborted');
      return;
    }

    if (blockId) {
      streamData();
    }

    return () => controller.abort();
  }, [blockId, setContent, debouncedOnContentUpdate]);

  //if (isLoading) {
  //  return <div>Loading...</div>;
  //}
  if (error) {
    return <div>Error: {error}</div>;
  }
  const formattedContent = formatText(streamContent);
  return <div>{content}</div>;
};