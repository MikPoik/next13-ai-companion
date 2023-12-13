"use client";
import Image from "next/image"
import Link from "next/link"
import { Companion } from "@prisma/client"
import { MessagesSquare, ImagePlus, ImageOff, Camera, CameraOff, EyeOff, Eye, ShieldOff, Shield, VolumeX, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardFooter, CardHeader } from "@/components/ui/card"
interface CompanionsProps {
    data: (Companion & {
        _count: {
            messages: number
        },
    })[];
}
export const Companions = ({
    data
}: CompanionsProps) => {
    const [ageVerificationState, setAgeVerificationState] = useState<string | null>(null);
    useEffect(() => {
        setAgeVerificationState(localStorage.getItem('age-verification-state'));
    }, []); 
    if (data.length === 0) {
        return (
            <div className="pt-10 flex flex-col items-center justify-center space-y-3">
                <div className="relative w-60 h-60">
                    <Image
                        fill
                        className="grayscale"
                        src="/empty.png"
                        alt="Empty"
                    />
                </div>
                <p className="text-sm text-muted-foreground">No companions found.</p>
            </div>
        )
    }
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 pb-10">
            {ageVerificationState === 'true' &&
                data.map((item) => (
                    <Card key={item.name} className="bg-primary/10 rounded-xl cursor-pointer hover:opacity-75 transition border-0">
                        <Link href={`/chat/${item.id}`}>
                            <CardHeader className="flex items-center justify-center text-center text-muted-foreground">
                                <div className="relative w-32 h-32">
                                    <Image
                                        src={item.src}
                                        fill
                                        className="rounded-xl object-cover"
                                        alt="Character"
                                    />
                                </div>
                                <p className="font-bold">
                                        {item.name}
                                </p>
                                <p className="text-xs">
                                    {item.description}
                                </p>
                                <p>
                                    <div className="flex items-center">
                                        <span className="mr-2" title="Total messages">
                                            <MessagesSquare className="w-3 h-3" />
                                        </span>
                                        <span className="text-xs font-normal">{ item._count?.messages ?? 0}</span>  
                                    </div>

                                </p>
                            </CardHeader>
                            <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                                {item.model !== 'gpt-3.5-turbo-0613' && item.model !== 'zephyr-chat' && (
                                    <span title="Pro plan required"><div className="flex items-center"><Sparkles className="h-4 w-4 fill-white text-white ml-2 mr-2 opacity-70" /><span className="text-xs"></span>|</div></span>
                                )}
                                
                                {item.model === 'gpt-3.5-turbo-0613' ? (
                                    <span title="NSFW content disabled" ><Shield size={16} /></span>
                                ) : (
                                    <span title="NSFW content enabled" ><ShieldOff size={16} /></span>
                                )
                                }
                                |
                                {item.isPublic ? (
                                    <span title="Bot is public"><Eye size={16} /></span>
                                ) : (
                                    <span title="Bot is private"><EyeOff size={16} /></span>
                                )}
                                |
                                {item.createImages ? (
                                    <span title="Image generation enabled"><ImagePlus size={16} /></span>
                                ) : (<span title="Image generation disabled" ><ImageOff size={16} /></span>)}
                                |
                                {item.voiceId === 'none' ? (
                                    <span title="Voice disabled"><VolumeX size={16} /></span>
                                ) : (<span title="Voice enabled" ><Volume2 size={16} /></span>)}

                            </CardFooter>
                        </Link>
                    </Card>
                ))
            }
        </div >
    )
}