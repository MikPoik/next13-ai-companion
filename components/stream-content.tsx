import React, { useEffect, useCallback, useState } from 'react';
import { debounce } from 'lodash';
import useStreamStore from '@/lib/useStreamStore'; // Adjust the import path as necessary

interface StreamContentProps {
  blockId: string;
  onContentUpdate?: (newContent: string) => void;
};

export const StreamContent: React.FC<StreamContentProps> = ({ blockId, onContentUpdate }) => {
  const { content, setContent } = useStreamStore((state) => state);
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
          setContent(accumulatedContent);
          debouncedOnContentUpdate(accumulatedContent);
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

    if (!signal.aborted) {
      streamData();
    }

    return () => controller.abort();
  }, [blockId, setContent, debouncedOnContentUpdate]);

  if (isLoading) {
    return <div></div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <div>{content}</div>;
};