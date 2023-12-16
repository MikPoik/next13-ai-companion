"use client";
import { ChatRequestOptions } from "ai";
import { ChangeEvent, FormEvent, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendHorizonal, Sparkles } from "lucide-react";
import { useProModal } from "@/hooks/use-pro-modal";

interface ChatFormProps {
    input: string;
    handleInputChange: (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => void;
    onSubmit: (e: FormEvent<HTMLFormElement>, chatRequestOptions?: ChatRequestOptions | undefined) => void;
    isLoading: boolean;
    isPro: boolean;
    companion: {
        model: string;
        voiceId: string; 
        imageModel: string;
        // ... other companion properties
    };
}

export const ChatForm = ({
    input,
    handleInputChange,
    onSubmit,
    isLoading,
    isPro,
    companion
}: ChatFormProps) => {

    const inputRef = useRef<HTMLInputElement>(null);
    const { onOpen } = useProModal();
    useEffect(() => {
        if(!isLoading && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isLoading]);

    const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (canSendMessage) {
            onSubmit(e);
        }
    };



    const handleProModalOpen = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        if (!isPro) {
            onOpen();
        }
    };


    const canSendMessage =  isPro || (companion.model === 'zephyr-chat' && companion.voiceId === 'none' && (companion.imageModel === 'realistic-vision-v3' || companion.imageModel === 'dark-sushi-mix-v2-25'));
    const SubmitButtonIcon = canSendMessage ? SendHorizonal : Sparkles;

    return (
        <form onSubmit={handleFormSubmit} className="border-t border-primary/10 py-4 flex items-center gap-x-2">
            <Input
                ref={inputRef}
                disabled={isLoading}
                value={input}
                onChange={handleInputChange}
                placeholder="Type a message"
                className="rounded-lg bg-primary/10"
            />
            {
                canSendMessage ?
                <Button type="submit" disabled={isLoading} variant="ghost">
                    <SendHorizonal className="w-6 h-6" />
                </Button>
                :
                <Button onClick={handleProModalOpen} disabled={isLoading} variant="ghost">
                    <Sparkles className="w-6 h-6" />
                </Button>
            }
        </form>
    );
};