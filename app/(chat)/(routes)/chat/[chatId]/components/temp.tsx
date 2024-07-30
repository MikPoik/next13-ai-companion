import { useChat, Message as ChatMessageType } from "ai/react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Companion, Message as PrismaMessage, Role } from "@prisma/client";
import { ChatForm } from "@/components/chat-form";
import { ChatHeader } from "@/components/chat-header";
import { ChatMessage } from "@/components/chat-message";
import { BeatLoader } from "react-spinners";
import { SendHorizonal, X, RotateCcw, Trash2, MoveDown } from "lucide-react";
import { useProModal } from "@/hooks/use-pro-modal";
import { useToast } from "@/components/ui/use-toast";
import { responseToChatBlocks } from "@/components/ChatBlock";

interface ChatClientProps {
  isPro: boolean;
  companion: Companion & {
    messages: PrismaMessage[];
    _count: {
      messages: number;
    };
  };
}

export const ChatClient = ({ isPro, companion }: ChatClientProps) => {
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const proModal = useProModal();
  const [isReloading, setIsReloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const initialMessages: PrismaMessage[] = [
    {
      id: "seed",
      role: Role.system,
      content: companion.seed,
      createdAt: new Date(),
      updatedAt: new Date(),
      companionId: companion.id,
      userId: "",
    },
    ...companion.messages.map((message) => ({
      ...message,
      role: message.role,
      updatedAt: message.updatedAt ?? new Date(),
      companionId: message.companionId ?? companion.id,
      userId: message.userId ?? "",
    })),
  ];

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setInput,
    append,
    isLoading,
    error,
    stop,
    reload,
  } = useChat({
    api: `/api/chat/${companion.id}`,
    initialMessages: initialMessages as unknown as ChatMessageType[],
    onFinish() {
      setInput("");
      router.refresh();
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    },
  });

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    append({ role: "user", content: input });
  };

  const renderedMessages = messages.map((message) => (
    <ChatMessage
      key={message.id}
      id={message.id}
      role={message.role}
      content={message.content}
      isLoading={message.isLoading}
    />
  ));

  return (
    <div className="flex flex-col h-full">
      <ChatHeader isPro={isPro} companion={companion} />
      <div className="flex-1 overflow-y-auto p-4">
        {renderedMessages}
        <div ref={bottomRef} />
        {isLoading && <BeatLoader color="black" size={5} />}
        {error && <p>{error.message}</p>}
      </div>
      <ChatForm
        isPro={isPro}
        isLoading={isLoading}
        input={input}
        handleInputChange={handleInputChange}
        companion={companion}
        onSubmit={onSubmit}
      />
    </div>
  );
};

export default ChatClient;