"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";

interface ImageUploadProps {
    value: string;
    onChange: (src: string) => void;
    disabled?: boolean;
}

export const BotAvatarForm = ({
    value,
    onChange,
    disabled,
}: ImageUploadProps) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return false;
    }

    return (
        <div className="space-y-4 w-full flex flex-col justify-center items-center">


            <div className="relative h-40 w-40">
                <Image
                    fill
                    alt="Upload"
                    src={value || "/placeholder.svg"}
                    className="rounded-lg object-cover"
                />
            </div>

        </div>
    );
};
