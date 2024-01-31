                                "use client";
                                import Image from "next/image"
                                import Link from "next/link"
                                import { Companion } from "@prisma/client"
                                import { MessagesSquare, ShieldOff, Shield, EyeOff, Eye, ImagePlus, ImageOff, VolumeX, Volume2 } from "lucide-react";
                                import { useEffect, useState } from "react";
                                import { Card, CardFooter, CardHeader,CardContent } from "@/components/ui/card"

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
                                    useEffect(() => {
                                      // This function will run when `data` prop changes.
                                      //console.log('The companions list has been updated.');
                                      // Add more logic here if necessary.
                                    }, [data]); // Dependency array with `data` means this effect runs when `data` changes.
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
                                                    <Card key={item.id} className="bg-primary/10 rounded-xl cursor-pointer hover:opacity-75 transition border-0 flex flex-col h-full">
                                                        <Link href={`/chat/${item.id}`} className="flex flex-col h-full">
                                                            <CardHeader className="flex flex-col items-center justify-center text-center text-muted-foreground">
                                                                <div className="relative w-32 h-32">
                                                                    <Image
                                                                        src={item.src}
                                                                        fill
                                                                        sizes="512px"
                                                                        className="rounded-xl object-cover"
                                                                        alt="Character"
                                                                    />
                                                                </div>
                                                                <p className="font-bold">
                                                                    <div className="flex items-center justify-center text-muted-foreground mb-0">
                                                                        <span className="ml-2 mr-2">{item.name}</span>
                                                                    </div>    
                                                                </p>

                                                            </CardHeader>
                                                            <CardContent className="flex items-center justify-center text-center text-muted-foreground">
                                                            <div className="mt-auto">
                                                                <p className="text-xs">
                                                                    {item.description}
                                                                </p>
                                                            </div>
                                                            </CardContent>

                                                            <div className="mt-auto">
                                                                <div className="flex items-center justify-center text-muted-foreground mb-2">
                                                                    <span title="Total messages"><MessagesSquare size={15} className="mr-2" /></span>
                                                                    <span className="text-xs font-normal">{item._count.messages ?? 0}</span>
                                                                </div>
                                                                <CardFooter className="flex items-center justify-between text-xs text-muted-foreground mb-0 pb-2">

                                                                    {item.model === 'gpt-3.5-turbo-0613' ? (
                                                                        <span title="NSFW content disabled"><Shield size={16} /></span>
                                                                    ) : (
                                                                        <span title="NSFW content enabled"><ShieldOff size={16} /></span>
                                                                    )}
                                                                    |
                                                                    {item.isPublic ? (
                                                                        <span title="Bot is public"><Eye size={16} /></span>
                                                                    ) : (
                                                                        <span title="Bot is private"><EyeOff size={16} /></span>
                                                                    )}
                                                                    |
                                                                    {item.createImages ? (
                                                                        <span title="Image generation enabled"><ImagePlus size={16} /></span>
                                                                    ) : (<span title="Image generation disabled"><ImageOff size={16} /></span>)}
                                                                    |
                                                                    {item.voiceId === 'none' ? (
                                                                        <span title="Voice disabled"><VolumeX size={16} /></span>
                                                                    ) : (<span title="Voice enabled"><Volume2 size={16} /></span>)}
                                                                </CardFooter>  
                                                                <div className="flex items-center justify-center text-muted-foreground text-xs mt-0 mb-2">{item.model.split('/').pop()?.toLowerCase() ?? ''}</div>
                                                            </div>


                                                        </Link>
                                                    </Card>
                                                ))
                                            }
                                        </div>
                                    )
                                }