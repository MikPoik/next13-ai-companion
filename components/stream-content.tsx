import React, { useEffect, useState, useCallback } from 'react';
import { debounce } from 'lodash';

interface StreamContentProps {
  blockId: string;
  onContentUpdate?: (newContent: string) => void;
  accumulatedContentRef?: React.MutableRefObject<string>;
};

export const StreamContent: React.FC<StreamContentProps> = ({ blockId, onContentUpdate, accumulatedContentRef }) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedOnContentUpdate = useCallback(
    debounce((updatedContent) => {
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
          if (accumulatedContentRef) accumulatedContentRef.current = accumulatedContent;

          // Update to set content in chunks as received without waiting for the entire message.
          setContent((prevContent) => {
            const updatedContent = prevContent + decoder.decode(value, { stream: true });
            debouncedOnContentUpdate(updatedContent); // Notify parent component of new content
            return updatedContent;
          });
        }
        console.log("Stream content finished, final content: ", accumulatedContent);
      } catch (err) {
        if (signal.aborted) {
          console.log("Fetch aborted due to unmount or navigation");
        } else {
          console.error("Error during fetching:", err);
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (signal.aborted) {
      // If the signal is already aborted, just log and return
      console.log("Fetch aborted, not initiating due to signal already aborted");
      return;
    }

    if (blockId) {
      streamData();
    }

    return () => controller.abort();
  }, [blockId, onContentUpdate, accumulatedContentRef, debouncedOnContentUpdate]);

  if (isLoading) {
    return <div></div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }
  return <div>{content}</div>;
};