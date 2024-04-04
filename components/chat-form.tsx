"use client";
import { ChatRequestOptions } from "ai";
import { ChangeEvent, FormEvent, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendHorizonal } from "lucide-react";
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
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
        if (!isLoading && inputRef.current && !isMobile) {
            inputRef.current.focus();
        }
    }, [isLoading]);

    const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(e);
    };

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
            <Button type="submit" disabled={isLoading} variant="ghost">
                <SendHorizonal className="w-6 h-6" />
            </Button>
        </form>
    );
};