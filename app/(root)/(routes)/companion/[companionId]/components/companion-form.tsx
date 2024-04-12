"use client";
import React, { useState, useEffect } from "react"; // Import React and useState
import * as z from "zod";
import axios, { AxiosResponse } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Wand2, Trash2 } from "lucide-react";
import { Category, Companion, Voice, PhoneVoice } from "@prisma/client";
//import { BotAvatarForm } from "@/components/bot-avatar-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/image-upload";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from "@/components/ui/select";
import dotenv from "dotenv";
dotenv.config({ path: `.env` });
import Image from 'next/image'

//Steamship bot handle for generating avatars
const STEAMSHIP_IMG_BOT_URL = "https://mpoikkilehto.steamship.run/avatar-gen-dev/backend-test-bot-ad1e44c62e699fda311a8365b6193913/generate_avatar";

const PREAMBLE = `Your personality can be described as ...`;
const PREAMBLE_BEHAVIOUR = `You behave like ...`;
const PREAMBLE_BACKSTORY = `relevant details and facts about the character ...`;
const PREAMBLE_SELFIE_PRE = `Keywords to describe your character appearance in detail: keyword, keyword...`;
const PREAMBLE_SELFIE_POST = `describe image details and effects ...`;
const SEED_CHAT = `Introduction message for the character ...`;

const formSchema = z.object({
    name: z.string().min(1, {
        message: "Name is required.",
    }),
    description: z.string()
        .min(1, {
            message: "Description is required.",
        })
        .max(50, { message: "Description is too long" }),
    personality: z.string().min(1, {
        message: "Personality require at least 200 characters."
    }),
    seed: z.string().min(1, {
        message: "Seed requires at least 200 characters."
    }),
    src: z.string().min(1, { message: "image is required" }),
    categoryId: z.string().min(1, {
        message: "Category is required",
    }),
    packageName: z.string().optional(),
    isPublic: z.boolean().optional(),
    createImages: z.boolean().optional(),
    behaviour: z.string().optional(),
    backstory: z.string().optional(),
    selfiePre: z.string().optional(),
    selfiePost: z.string().optional(),
    model: z.string().min(1, {
        message: "model is required",
    }),
    imageModel: z.string().min(1, {
        message: "imageModel is required",
    }),
    voiceId: z.string().optional(),
    regenerateImage: z.boolean().optional(),
    phoneVoiceId: z.string().optional(),
});

interface CompanionFormProps {
    categories: Category[];
    voices: Voice[];
    phoneVoices: PhoneVoice[];
    initialData: Companion | null;
};

export const CompanionForm = ({
    categories,
    voices,
    phoneVoices,
    initialData
}: CompanionFormProps) => {
    const { toast } = useToast();
    const router = useRouter();
    const [isImgLoading, setIsImgLoading] = useState(false);
    const [selectedVoiceId, setSelectedVoiceId] = useState(initialData?.voiceId || 'none');
    const [sampleUrl, setSampleUrl] = useState(""); // State variable to store the sample URL
    const [imageUrl, setImageUrl] = useState(initialData?.src || "/placeholder.svg");
    //const [newImageUrl, setNewImageUrl] = useState('');

    const onDelete = async () => {
        try {
            await axios.delete(`/api/companion/${initialData?.id}`);
            //toast({
            //    description: "Success."
            //});
            router.refresh();
            router.push("/");
        } catch (error) {
            toast({
                variant: "destructive",
                description: "Something went wrong."
            })
        }
    }


    const handleImageUpdate = async (value: string) => {
        if (isImgLoading) return;
        setIsImgLoading(true);
        const characterAppearance = value || characterAppearanceWatch || characterAppearanceGetValues;
        const imageModel = value || imageModelWatch || imageModelGetValues;


        const data = { // Preparing data to be sent with POST request 
            "prompt": characterAppearance,
            "image_model": imageModel,
        };

        // Sending POST request 

        axios.post(process.env.NEXT_PUBLIC_IMG_BOT_URL || STEAMSHIP_IMG_BOT_URL, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': ''
            }
        }).then((response: AxiosResponse) => {
            //console.log('Response:', response);
            const responseBlocks = JSON.stringify(response.data);
            const parsedResponseBlocks = JSON.parse(responseBlocks);
            const imgBlockId = parsedResponseBlocks[0].id;
            const imgSrc = `https://api.steamship.com/api/v1/block/${imgBlockId}/raw`;
            //console.log(imgSrc);

            setImageUrl(imgSrc);
            setIsImgLoading(false);
        }).catch((error) => {
            console.log('Error', error);
            setIsImgLoading(false);
            // handle error
        });

    };

    const handleVoiceChange = (value: string) => {
        setSelectedVoiceId(value);
        // Find the selected voice by ID
        const selectedVoice = voices.find((voice) => voice.voice_id === value);
        if (selectedVoice) {
            setSampleUrl(selectedVoice.sample_url); // Update the sample URL
        }
    };

    const playAudio = () => {
        if (sampleUrl) {
            const audio = new Audio(sampleUrl);
            audio.play();
        }
    };;
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            name: "",
            description: "",
            personality: "",
            seed: "",
            src: "",
            categoryId: undefined,
            packageName: "backend-test-bot",  //steamship package name
            isPublic: true,
            behaviour: "",
            selfiePre: "",
            selfiePost: "",
            model: "",
            createImages: true,
            imageModel: "realistic",
            voiceId: 'none',
            backstory: "",
            regenerateImage: false,
            phoneVoiceId: '94880846-c333-433a-ae5c-ca1cb2776387',


        },
    });
    const { watch, getValues } = form;
    const characterAppearanceWatch = watch("selfiePre");  // Watching specific input
    const characterAppearanceGetValues = getValues("selfiePre");  // Get value of specific input
    const imageModelWatch = watch("imageModel");  // Watching specific input
    const imageModelGetValues = getValues("imageModel");  // Get value of specific input

    const isLoading = form.formState.isSubmitting;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            if (initialData) {
                await axios.patch(`/api/companion/${initialData.id}`, values);
            } else {
                await axios.post("/api/companion", values);
            }

            toast({
                description: "Success.",
                duration: 3000,
            });

            router.refresh();
            router.push("/");
        } catch (error) {
            //console.log(error);
            toast({
                variant: "destructive",
                description: "Something went wrong.",
                duration: 3000,
            });
        }
    };
    // Define CSS styles for the button
    const buttonStyle = {
        height: "35px",
        fontSize: "0.9em",
        padding: "4px 15px",
        backgroundColor: "#fff",
        color: "#000",
        border: "1px solid #fff",
        borderRadius: "6px",
        cursor: "pointer",
    };
    const avatarButtonStyle = {
        height: "35px",
        fontSize: "0.8em",
        width: "200px",
        padding: "4px 12px",
        backgroundColor: "#fff",
        color: "#000",
        border: "1px solid #fff",
        borderRadius: "6px",
        cursor: "pointer",
    };
    const selectContentStyle: React.CSSProperties = {
        maxHeight: "200px", // Adjust the maximum height as needed
        overflowY: "auto",
    };
    const avatarButtonStyleDimmed = {
        // Include the styles needed for the button
        opacity: 0.5, // Change opacity based on the loading state
        height: "35px",
        fontSize: "0.8em",
        width: "200px",
        padding: "4px 12px",
        backgroundColor: "#fff",
        color: "#000",
        border: "1px solid #fff",
        borderRadius: "6px",
        cursor: "wait",

    };
    const dropdownStyle: React.CSSProperties = {
        maxHeight: "500px", // Limit the dropdown's height
        overflowY: "auto" // Enable vertical scrolling
    };
    return (
        <div className="h-full p-4 space-y-2 max-w-3xl mx-auto">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">
                    <div className="space-y-2 w-full col-span-2">
                        <div>
                            <h3 className="text-lg font-medium">Companion appearance</h3>
                            <p className="text-sm text-muted-foreground">
                                Appearance of your Companion
                            </p>
                        </div>
                        <Separator className="bg-primary/10" />
                    </div>
                    <FormField
                        name="src"
                        render={({ field }) => (

                            <FormItem className="flex flex-col items-center justify-center space-y-4 col-span-2">
                                <FormControl>
                                    <ImageUpload src={imageUrl} value={field.value} onChange={(value) => {
                                        setImageUrl(value);
                                        field.onChange(value);
                                    }} disabled={isLoading} />
                                </FormControl>
                                <FormDescription>
                                    Generate character avatar below or upload your own.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )
                        }
                    />
                    <FormField
                        name="selfiePre"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Character appearance</FormLabel>
                                <FormControl>
                                    <Input disabled={isLoading} className="bg-background resize-none" placeholder={PREAMBLE_SELFIE_PRE} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        <FormField
                            control={form.control}
                            name="imageModel"
                            render={({ field }) => (
                                <FormItem>

                                    <FormLabel>Image generator model</FormLabel>
                                    <div className="flex items-center">
                                        <Select disabled={isLoading} onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-background">
                                                    <SelectValue defaultValue={field.value} placeholder="Select a image style" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent style={dropdownStyle}>
                                                <SelectItem key="realistic-vision-v3" value="realistic-vision-v3">Realistic-Vision-v3</SelectItem>
                                                <SelectItem key="dark-sushi-mix-v2-25" value="dark-sushi-mix-v2-25">Dark-Sushi-mix-v2-25</SelectItem>
                                                <SelectItem key="absolute-reality-v1-8-1" value="absolute-reality-v1-8-1">Absolute-Reality-v1-8-1</SelectItem>
                                                <SelectItem key="arcane-diffusion" value="arcane-diffusion">Arcane-Diffusion</SelectItem>
                                                <SelectItem key="van-gogh-diffusion" value="van-gogh-diffusion">Van Gogh Diffusion</SelectItem>
                                                <SelectItem key="neverending-dream" value="neverending-dream">Neverending Dream</SelectItem>
                                                <SelectItem key="mo-di-diffusion" value="mo-di-diffusion">Modern Disney Diffusion</SelectItem>
                                                <SelectItem key="synthwave-punk-v2" value="synthwave-punk-v2">Synthwave Punk V2</SelectItem>
                                                <SelectItem key="dream-shaper-v8" value="dream-shaper-v8">Dream Shaper V8</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/294706" value="https://civitai.com/api/download/models/294706">iNiverseMix (SDXL)</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/228559?type=Model&format=SafeTensor&size=pruned&fp=fp16" value="https://civitai.com/api/download/models/228559?type=Model&format=SafeTensor&size=pruned&fp=fp16">Omnigen XL (SDXL)</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/281176?type=Model&format=SafeTensor&size=pruned&fp=fp16" value="https://civitai.com/api/download/models/281176?type=Model&format=SafeTensor&size=pruned&fp=fp16">Albedo (SDXL)</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/384264?type=Model&format=SafeTensor&size=full&fp=fp16" value="https://civitai.com/api/download/models/384264?type=Model&format=SafeTensor&size=full&fp=fp16">AnythingXL (SDXL)</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/293564?type=Model&format=SafeTensor&size=full&fp=fp32" value="https://civitai.com/api/download/models/293564?type=Model&format=SafeTensor&size=full&fp=fp32">Animagine (SDXL)</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/156375" value="https://civitai.com/api/download/models/156375">Clearhung Anime (SDXL)</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/378499" value="https://civitai.com/api/download/models/378499">Hassaku (SDXL)</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/303526?type=Model&format=SafeTensor&size=full&fp=fp16" value="https://civitai.com/api/download/models/303526?type=Model&format=SafeTensor&size=full&fp=fp16">Animemix (SDXL)</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/286821" value="https://civitai.com/api/download/models/286821">Deephentai (SDXL)</SelectItem>






                                            </SelectContent>
                                        </Select>
                                        &nbsp;&nbsp;<button // Use a plain HTML button with type="button"
                                            type="button"
                                            className="btn-sm" // Add the appropriate button class
                                            style={isImgLoading ? avatarButtonStyleDimmed : avatarButtonStyle}
                                            onClick={() => handleImageUpdate("")} // Call playAudio directly without arguments // Call playAudio directly
                                            disabled={isImgLoading}
                                        >
                                            Generate avatar
                                        </button>
                                    </div>
                                    <FormDescription>
                                        Select the the model for generated images.
                                    </FormDescription>
                                    <FormMessage />

                                </FormItem>
                            )}
                        />

                        <FormField
                            name="createImages"
                            control={form.control}
                            render={({ field }) => {
                                // Remove the value property from the field object
                                const { value, ...rest } = field;

                                return (
                                    <FormItem>

                                        <FormControl>
                                            <FormLabel>Enable Image generation in chat &nbsp;
                                                <input
                                                    type="checkbox"
                                                    {...rest} // Spread the rest of the field object into the input element's props
                                                    checked={value} // Use the value property to set the checked property
                                                    style={{ width: '16px', height: '16px', cursor: "pointer" }}
                                                />
                                            </FormLabel>
                                        </FormControl>
                                        <FormDescription>
                                            Companion can send selfies based on appearance. Generated images cost extra tokens.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />


                    </div>
                    <div className="space-y-2 w-full col-span-2">
                        <div>
                            <h3 className="text-lg font-medium">General Information</h3>
                            <p className="text-sm text-muted-foreground">
                                General information about your Companion
                            </p>
                        </div>
                        <Separator className="bg-primary/10" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            name="name"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem className="col-span-2 md:col-span-1">
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input disabled={isLoading} placeholder="Name" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        This is how your AI Companion will be named.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="description"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input disabled={isLoading} placeholder="girlfriend, etc.." {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Short description of your AI Companion&apos;s type
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}

                        />
                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select disabled={isLoading} onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-background">
                                                <SelectValue defaultValue={field.value} placeholder="Select a category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Select a category for your AI
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="model"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Model</FormLabel>
                                    <Select disabled={isLoading} onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-background">
                                                <SelectValue defaultValue={field.value} placeholder="Select a llm model" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {/*<SelectItem key="cognitivecomputations/dolphin-2.5-mixtral-8x7b" value="cognitivecomputations/dolphin-2.5-mixtral-8x7b">Dolphin Mixtral 8x7B DPO (NSFW)</SelectItem>*/}
                                            <SelectItem key="NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO" value="NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO">Mixtral 8x7B DPO (NSFW)</SelectItem>
                                            <SelectItem key="NousResearch/Nous-Hermes-2-Mixtral-8x7B-SFT" value="NousResearch/Nous-Hermes-2-Mixtral-8x7B-SFT">Mixtral 8x7B SFT (NSFW)</SelectItem>
                                            <SelectItem key="teknium/OpenHermes-2-Mistral-7B" value="teknium/OpenHermes-2-Mistral-7B">Mistral 7b (NSFW)</SelectItem>
                                            <SelectItem key="Gryphe/MythoMax-L2-13b" value="Gryphe/MythoMax-L2-13b">MythoMax 13b (NSFW)</SelectItem>
                                            <SelectItem key="zephyr-chat" value="zephyr-chat">Zephyr 7b (NSFW)</SelectItem>
                                            <SelectItem key="gpt-3.5-turbo-0613" value="gpt-3.5-turbo-0613">GPT-3.5</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Select the model for your AI.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="space-y-2 w-full">
                        <div>
                            <h3 className="text-lg font-medium">Configuration</h3>
                        </div>
                        <Separator className="bg-primary/10" />
                    </div>
                    <FormField
                        name="personality"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Personality</FormLabel>
                                <FormControl>
                                    <Textarea disabled={isLoading} rows={4} className="bg-background resize-none" placeholder={PREAMBLE} {...field} />
                                </FormControl>
                                <FormDescription>
                                    Describe in detail your companion&apos;s personality and relevant details.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        name="backstory"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Backstory for vector memory</FormLabel>
                                <FormControl>
                                    <Textarea disabled={isLoading} rows={6} className="bg-background resize-none" placeholder={PREAMBLE_BACKSTORY} {...field} />
                                </FormControl>
                                <FormDescription>
                                    Describe relevant facts and details, bot will dynamically use indexed data when responding. Data can be added but not edited.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        name="seed"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Seed chat message</FormLabel>
                                <FormControl>
                                    <Input disabled={isLoading} placeholder={SEED_CHAT} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />



                    <div className="space-y-1 w-full">
                        <div>
                            <h3 className="text-lg font-medium">Other settings</h3>
                        </div>
                        <Separator className="bg-primary/10" />
                    </div>
                    {/*
                    <FormField
                        control={form.control}
                        name="voiceId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Voice</FormLabel>
                                <div className="flex items-center">
                                    <Select
                                        disabled={isLoading}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            handleVoiceChange(value);
                                        }}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-background">
                                                <SelectValue defaultValue={field.value} placeholder="Select a voice to use" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent style={selectContentStyle} >
                                            {voices.map((voice) => (
                                                <SelectItem key={voice.id} value={voice.id}>
                                                    {voice.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    &nbsp;&nbsp;<button // Use a plain HTML button with type="button"
                                        type="button"
                                        className="btn-sm" // Add the appropriate button class
                                        style={buttonStyle}
                                        onClick={() => playAudio()} // Call playAudio directly without arguments // Call playAudio directly
                                        disabled={isLoading || selectedVoiceId === "none" || !sampleUrl}
                                    >
                                        Play
                                    </button>
                                </div>
                                <FormDescription>
                                    Select a voice for your AI (&quot;none&quot; means voice is disabled)
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    /> */}
                    <FormField
                        control={form.control}
                        name="phoneVoiceId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Voice</FormLabel>
                                <div className="flex items-center">
                                    <Select
                                        disabled={isLoading}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            handleVoiceChange(value);
                                        }}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-background">
                                                <SelectValue defaultValue={field.value} placeholder="Select a voice to use for phone calls" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent style={selectContentStyle} >
                                            {phoneVoices.map((phoneVoice) => (
                                                <SelectItem key={phoneVoice.id} value={phoneVoice.id}>
                                                    {phoneVoice.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    &nbsp;&nbsp;
                                </div>
                                <FormDescription>
                                    Select a voice used in phone calls
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            name="isPublic"
                            control={form.control}
                            render={({ field }) => {
                                // Remove the value property from the field object
                                const { value, ...rest } = field;

                                return (
                                    <FormItem>

                                        <FormControl>
                                            <label>Public &nbsp;
                                                <input
                                                    type="checkbox"
                                                    {...rest} // Spread the rest of the field object into the input element's props
                                                    checked={value} // Use the value property to set the checked property
                                                    style={{ width: '14px', height: '14px' }}
                                                />
                                            </label>
                                        </FormControl>
                                        <FormDescription>
                                            (Other users can talk to the bot)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />

                    </div>
                    <div className="w-full flex justify-center">
                        <Button size="lg" disabled={isLoading}>
                            {initialData ? "Edit your companion" : "Create your companion"}
                            <Wand2 className="w-4 h-4 ml-2" />
                        </Button>
                        {
                            initialData ? (
                                <Button size="lg" disabled={isLoading} onClick={onDelete} className="text-red-500 ml-8">
                                    Delete Companion
                                    <Trash2 className="w-4 h-4 ml-2" />
                                </Button>
                            ) : null
                        }
                    </div>
                </form>
            </Form>
        </div>
    );
};
