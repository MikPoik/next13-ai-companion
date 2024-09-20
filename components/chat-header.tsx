"use client";
import axios from "axios";
import { ChevronLeft, Edit, MessagesSquare, MoreVertical, Trash, PhoneCall } from "lucide-react";
import { useRouter } from "next/navigation";
import { Companion, Message } from "@prisma/client";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { BotAvatar } from "@/components/bot-avatar";
import { useSearchParams } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { CallModal } from "./call-modal"; // Import CallModal component
import { useProModal } from "@/hooks/use-pro-modal";
import React, { useState } from "react"; // Import useState for managing CallModal visibility
import {MobileSidebar} from "@/components/mobile-sidebar";

interface ChatHeaderProps {
    isPro: boolean
    companion: Companion & {
        messages: Message[];
        _count: {
            messages: number;
        };
    };
};

export const ChatHeader = ({
    isPro,
    companion,
}: ChatHeaderProps) => {
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();
    const [isCallModalOpen, setIsCallModalOpen] = useState(false); // State hook for CallModal visibility
    const searchParams = useSearchParams();
    const proModal = useProModal(); // Use the useProModal hook
    const onDelete = async () => {
        try {
            await axios.delete(`/api/companion/${companion.id}`);
            toast({
                description: "Success."
            });
            router.refresh();
            router.push("/");
        } catch (error) {
            toast({
                variant: "destructive",
                description: "Something went wrong."
            })
        }
    }
    const onDeleteChatHistory = async () => {
        try {
            await axios.delete(`/api/companion/${companion.id}/chat-history`);
            toast({
                description: "Chat history deleted successfully."
            });
            window.location.reload(); 
            // You can perform any additional actions here after chat history deletion.
        } catch (error) {
            //console.log(error);
            toast({
                variant: "destructive",
                description: "Something went wrong while deleting chat history."
            });
        }
    }
    const handlePhoneCallClick = () => {
                setIsCallModalOpen(true);
    };

    const preserveQueryParams = (path: string) => {
        const params = new URLSearchParams(searchParams.toString());
        //console.log(params.toString());
        return `${path}${params.toString() ? `?${params.toString()}` : ''}`;
    };
    
    return (
        <div className="flex w-full justify-between items-center border-b border-primary/10 pb-1 py-1">
            <MobileSidebar isPro={isPro} />
            <div className="flex gap-x-2 items-center">

                <BotAvatar src={companion.src} />
                <div className="flex flex-col gap-y-1">
                    <div className="flex items-center gap-x-2">
                        <p className="font-bold">{companion.name}</p>
                        <div className="flex items-center text-xs text-muted-foreground">

                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        <span className="text-xs text-muted-foreground">{companion.description}</span>
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-x-2">                
            {/* Button to open CallModal */}
                <Button onClick={handlePhoneCallClick} variant="secondary" size="icon">
                    <PhoneCall />
                </Button>
            {user?.id === companion.userId ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon">
                            <MoreVertical />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push((preserveQueryParams(`/companion/${companion.id}`)))} className="mb-2">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onDeleteChatHistory} className="mb-2">
                            <Trash className="w-4 h-4 mr-2" />
                            Delete Chat history
                        </DropdownMenuItem>

                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon">
                            <MoreVertical />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onDeleteChatHistory}>
                            <Trash className="w-4 h-4 mr-2" />
                            Delete Chat history
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
            </div>
            {/* Call Modal */}
            <CallModal isOpen={isCallModalOpen} onClose={() => setIsCallModalOpen(false)} companionId={companion.id} companionName={companion.name} />

            
        </div>
        
    );
};
