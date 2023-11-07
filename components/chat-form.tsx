"use client";
import { ChatRequestOptions } from "ai";
import { SendHorizonal } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
interface ChatFormProps {
    input: string;
    handleInputChange: (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => void;
    onSubmit: (e: FormEvent<HTMLFormElement>, chatRequestOptions?: ChatRequestOptions | undefined) => void;
    isLoading: boolean;
}
export const ChatForm = ({
    input,
    handleInputChange,
    onSubmit,
    isLoading,
}: ChatFormProps) => {
    // Initialize input reference
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        // check if isLoading is false and if inputRef.current is accessible
        if(!isLoading && inputRef.current) {
            // Perform focus when isLoading is changed from true to false
            inputRef.current.focus();
        }
    }, [isLoading]);
    return (
        <form onSubmit={onSubmit} className="border-t border-primary/10 py-4 flex items-center gap-x-2">
            <Input
                ref={inputRef} // Attach the reference to the input element
                disabled={isLoading}
                value={input}
                onChange={handleInputChange}
                placeholder="Type a message"
                className="rounded-lg bg-primary/10"
            />
            <Button disabled={isLoading} variant="ghost">
                <SendHorizonal className="w-6 h-6" />
            </Button>
        </form>
    )
}