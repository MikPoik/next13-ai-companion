// In components/use-block-stream.tsx (based on provided context)
import { useState, useEffect } from "react";

export function useBlockStream(blockId: string) {
  const [streamContent, setStreamContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      //console.log("start fetch")
      try {
        const response = await fetch(`/api/block/${blockId}`);
        const textStream = await response.text();
        setStreamContent(textStream);
      } catch (error) {
        console.error("Error fetching block stream:", error);
        setStreamContent("Error loading content.");
      } finally {
        setIsLoading(false);
      }
    };

    if (blockId) fetchData();
  }, [blockId]);

  return { isLoading, streamContent };
}