import React, { useEffect, useState } from 'react';


interface StreamContentProps {
    blockId: string;
    onContentUpdate?: (newContent: string) => void;
}

export const StreamContent: React.FC<StreamContentProps> = ({ blockId, onContentUpdate }) => {
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(false);
        setError(null);
        const controller = new AbortController();
        const streamData = async () => {
            try {
                console.log("start fetch");
                const response = await fetch(`/api/block/${blockId}`, {
                    signal: controller.signal
                });
                if (!response.body) throw new Error('No response body');

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let accumulatedContent = ''; // Local variable to accumulate content
                console.log("start read");
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    console.log(decoder.decode(value))
                    accumulatedContent += decoder.decode(value, { stream: true });
                    // Update to set content in chunks as received without waiting for the entire message.
                    // For each chunk received, concatenate with existing content and update state.
                    
                    setContent((prevContent) => {
                        const updatedContent = prevContent + decoder.decode(value, { stream: true });
                        // Call onContentUpdate with the updated content
                        
                        if (onContentUpdate) onContentUpdate(updatedContent);
                        return updatedContent;
                    });
                }
                console.log("Stream content finished, final content: ", accumulatedContent);
            } catch (err) {
                if (err instanceof Error) setError(err.message);
                else setError('An unknown error occurred');
            } finally {
                console.log("Stream content finished, result: ", content)
                setIsLoading(false);
            }
        };

        if (blockId) {
            streamData();
        }

        return () => controller.abort(); // Clean up by aborting fetch if component unmounts
    }, [blockId]);

    if (isLoading) {
        return <div>Loading... Test very long string lorem ipsum lorem ipsumlorem ipsumlorem ipsumlorem ipsumlorem ipsumlorem ipsumlorem ipsum</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return <div>{content}</div>;
};