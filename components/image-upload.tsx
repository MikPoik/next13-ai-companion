"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CldUploadButton } from "next-cloudinary";

import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";

interface ImageUploadProps {
  src: string;
  value: string;
  onChange: (src: string) => void;
  disabled?: boolean;
}

export const ImageUpload = ({
  src,
  value,
  onChange,
  disabled,
}: ImageUploadProps) => {
  const upload_preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const [isMounted, setIsMounted] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState(src);    // newImageUrl declared and initialized here

  useEffect(() => {
    setIsMounted(true);
  }, []);
    useEffect(() => {
        setNewImageUrl(src);       // sets the newImageUrl when src changes
        onChange(newImageUrl);     // notifies the FormField component about the change
      console.log(newImageUrl)
    }, [src]);  // Dependency array changed to src
    useEffect(() => {
    onChange(src);
    },[src]);
  if (!isMounted) {
    return false;
  }

  return (
    <div className="space-y-4 w-full flex flex-col justify-center items-center">
      
      <CldUploadButton options={{ maxFiles: 1 }} onUpload={(result: any) => onChange(result.info.secure_url)} uploadPreset={upload_preset}>
        <div 
          className="
            p-4 
            border-4 
            border-dashed
            border-primary/10 
            rounded-lg 
            hover:opacity-75 
            transition 
            flex 
            flex-col 
            space-y-2 
            items-center 
            justify-center
          "
        >
          <div className="relative h-40 w-40">
            <Image
              fill
              alt="Upload"
              src={value ||newImageUrl|| "/placeholder.svg"}
              className="rounded-lg object-cover"
            />
          </div>
        </div>
      </CldUploadButton>
    </div>
  );
};
