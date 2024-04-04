"use client";
import Image from "next/image";
import Link from "next/link";
import { Companion } from "@prisma/client";
import {
  MessagesSquare,
  ShieldOff,
  Shield,
  EyeOff,
  Eye,
  ImagePlus,
  ImageOff,
  VolumeX,
  Volume2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardFooter, CardHeader, CardContent } from "@/components/ui/card";

interface CompanionsProps {
  data: (Companion & {
    _count: {
      messages: number;
    };
  })[];
}

export const Companions = ({ data }: CompanionsProps) => {
  const [ageVerificationState, setAgeVerificationState] = useState<string | null>(null);

  useEffect(() => {
    setAgeVerificationState(localStorage.getItem('age-verification-state'));
  }, []);

  if (data.length === 0) {
    return (
      <div className="pt-10 flex flex-col items-center justify-center space-y-3">
        <div className="relative w-60 h-60">
          <Image fill className="grayscale" src="/empty.png" alt="Empty" />
        </div>
        <p className="text-sm text-muted-foreground">No companions found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-6 pb-10">
      {ageVerificationState === 'true' &&
        data.map((item) => (
          <Card key={item.id} className="bg-primary/10 rounded-xl cursor-pointer hover:opacity-75 transition border-0 flex flex-col h-full relative"
          style={{aspectRatio: '3 / 4'}}>
            <div className="absolute inset-0 z-0">
              <Image src={item.src} fill className="rounded-xl object-cover" alt="Character" />
            </div>
              <Link href={`/chat/${item.id}`} className="flex flex-col h-full z-10 relative">
              <CardHeader className="flex flex-col items-center justify-center text-center text-white">

              </CardHeader>
              <CardContent className="text-white">

              </CardContent>
                        <div className="mt-auto w-full absolute bottom-0 left-0 bg-[rgba(0,0,0,0.4)] rounded-b-xl hover:bg-[rgba(0,0,0,0.8)]">
                          <div className="flex flex-row items-center justify-between text-white">
                            <span className="flex-grow text-center">{item.name}</span>
                          </div>
                              <div className="flex flex-row items-center justify-between text-xs text-white">
                                <span className="flex-grow text-center">{item.description}</span>
                              </div>
                          <div className="flex items-center justify-center gap-2 my-1">
                            <span title="Total messages"><MessagesSquare size={15} /></span>
                            <span className="text-xs font-normal mr-2">{item._count.messages ?? 0}</span>
                            {/*item.model === 'gpt-3.5-turbo-0613' ? (
                              <span title="NSFW content disabled"><Shield size={16} /></span>
                            ) : (
                              <span title="NSFW content enabled"><ShieldOff size={16} /></span>
                            )*/}
                              {!item.isPublic && (
                                <span title="Bot is private"><EyeOff size={16} /></span>
                              )}
                            {item.createImages ? (
                              <span title="Image generation enabled"><ImagePlus size={16} /></span>
                            ) : (
                              <span title="Image generation disabled"><ImageOff size={16} /></span>
                            )}
                            {/*item.voiceId === 'none' ? (
                              <span title="Voice disabled"><VolumeX size={16} /></span>
                            ) : (
                              <span title="Voice enabled"><Volume2 size={16} /></span>
                            )*/}
                          </div>
                          <div className="text-white text-xs text-center">{item.model.split('/').pop()?.toLowerCase().replace('nous-','') ?? ''}</div>
              </div>
            </Link>
          </Card>
        ))
      }
    </div>
  );
}