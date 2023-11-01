"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";
interface ImageUploadProps {
  src: string;
  onChange: (src: string) => void;
  disabled?: boolean;
}
export const BotAvatarForm = ({
  src,
  onChange,
  disabled,
}: ImageUploadProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState(src);    // newImageUrl declared and initialized here

  useEffect(() => {
    setIsMounted(true);
  }, []);

    useEffect(() => {
        setNewImageUrl(src);       // sets the newImageUrl when src changes
        onChange(newImageUrl);     // notifies the FormField component about the change
    }, [src]);  // Dependency array changed to src
  useEffect(() => {
    onChange(src);
  }, [src]); // Listen to changes on src and call onChange with new src

  if (!isMounted) {
    return null; 
  }
  return (
        <div className="space-y-4 w-full flex flex-col justify-center items-center">
          <div className="relative h-40 w-40">
            <Image
              fill
              alt="Upload"
              src={newImageUrl || "/placeholder.svg"} // Use the newImageUrl for the Image component
              className="rounded-lg object-cover"
            />
          </div>
        </div>
      );
};