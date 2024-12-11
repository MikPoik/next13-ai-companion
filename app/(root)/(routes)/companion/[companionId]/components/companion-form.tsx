"use client";
import React, { useState, useEffect } from "react"; // Import React and useState
import * as z from "zod";
import axios, { AxiosResponse } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Wand2, Trash2 } from "lucide-react";
import { Category, Companion, Voice, PhoneVoice,Tag } from "@prisma/client";
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
import { useSearchParams } from 'next/navigation';
//Steamship bot handle for generating avatars
const STEAMSHIP_IMG_BOT_URL = "https://mpoikkilehto.steamship.run/avatar-gen-dev/backend-test-bot-ad1e44c62e699fda311a8365b6193913/generate_avatar";

const PREAMBLE = `Your personality can be described as ...`;
const PREAMBLE_BEHAVIOUR = `You behave like ...`;
const PREAMBLE_BACKSTORY = `Story info, events, relevant details and facts about the character ...`;
const PREAMBLE_SELFIE_PRE = `Keywords to describe your character appearance in detail: `;
const PREAMBLE_SELFIE_POST = `describe image details and effects ...`;
const SEED_CHAT = `Dialogue example for the character ...`;

const formSchema = z.object({
    name: z.string().min(1, {
        message: "Name is required.",
    }),
    description: z.string()
        .min(1, {
            message: "Description is required.",
        })
        .max(200, { message: "Description is too long" }),
    personality: z.string().min(1, {
        message: "Personality require at least 200 characters."
    }),
    seed: z.string().min(1, {
        message: "Seed requires at least 1 characters."
    }),
    src: z.string().min(1, { message: "image is required" }),
    packageName: z.string().optional(),
    isPublic: z.boolean().optional(),
    createImages: z.boolean().optional(),
    behaviour: z.string().optional(),
    backstory: z.string().max(10000).optional(),
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
    tags: z.array(z.string()).min(1,{ message: "tags are required" }),
    nsfw: z.boolean().optional()
});


type CompanionWithTags = Companion & {
    tags: Tag[];
}

interface CompanionFormProps {
    categories: Category[];
    voices: Voice[];
    phoneVoices: PhoneVoice[];
    initialData: CompanionWithTags | null;
    tags: Tag[];
};

export const CompanionForm = ({
    categories,
    voices,
    phoneVoices,
    initialData,
    tags
}: CompanionFormProps) => {
    const { toast } = useToast();
    const router = useRouter();
    const [isImgLoading, setIsImgLoading] = useState(false);
    const [selectedVoiceId, setSelectedVoiceId] = useState(initialData?.voiceId || 'none');
    const [sampleUrl, setSampleUrl] = useState(""); // State variable to store the sample URL
    const [imageUrl, setImageUrl] = useState(initialData?.src || "/placeholder.svg");
    const searchParams = useSearchParams();
    // Assuming initialData might have a tags property, but TypeScript isn't aware of it.
    // A helper function to assert the type of `initialData.tags`
    function assertHasTags(data: any): data is Companion {
        return Array.isArray(data?.tags);
    }

    const [selectedTags, setSelectedTags] = useState<string[]>(
        assertHasTags(initialData) ? initialData.tags.map(tag => tag.name) : []
    );
    const [tagInput, setTagInput] = useState("");

    //console.log(initialData)
    //console.log(tags)
    //console.log(selectedTags)
    //const [newImageUrl, setNewImageUrl] = useState('');
    const preserveQueryParams = (path: string) => {
        const params = new URLSearchParams(searchParams.toString());
        //console.log(params.toString());
        return `${path}${params.toString() ? `?${params.toString()}` : ''}`;
    };
    const onDelete = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default form submission
        e.stopPropagation(); // Stop the event from propagating further
        try {
            await axios.delete(`/api/companion/${initialData?.id}`);
            toast({
               description: "Success."
            });
            router.refresh();
            router.push(preserveQueryParams("/"));
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
            prompt: characterAppearance,
            agent_id : "avatar-gen",
            context_id : "avatar-gen",
            workspace_id: "avatars",
            image_config: { 
                image_model: imageModel,
                image_size: '{ "width":512,"height":768}',
                image_width: "512",
                image_height: "768",
                image_api_path: imageModel.includes("flux") ? "fal-ai/flux/dev" : "fal-ai/lora"
            }
            
        };

        // Sending POST request 
        //console.log("image submit details", data)
        axios.post("/api/generate-avatar", data)            
        .then((response: AxiosResponse) => {
            //console.log('Response:', response);
            const imgSrc = response.data;
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
        defaultValues: initialData ? {
            ...initialData,
            tags: initialData.tags?.map(tag => tag.id) || [], // Make sure this matches your actual data structure
        } : {
            name: "",
            description: "",
            personality: "",
            seed: "",
            src: "",
            packageName: "backend-test-bot",  //steamship package name
            isPublic: true,
            behaviour: "",
            selfiePre: "",
            selfiePost: "",
            model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
            createImages: false,
            imageModel: "fal-ai/flux/dev",
            voiceId: 'none',
            backstory: "",
            regenerateImage: false,
            phoneVoiceId: '101',
            tags: [],
            nsfw: false



        },
    });
    const { watch, handleSubmit, register, formState: { errors }, setValue, getValues } = form;
    
    const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTagInput(e.target.value);
    };
    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission on enter
            // Perform type assertion if you need to access specific properties of the input element
            const target = e.target as HTMLInputElement;
            setTagInput(target.value); // <- This line might need to be adjusted depending on your logic
            addTag();
        }
    };
    const addTag = () => {
        let newTag = tagInput.trim();
        if (newTag && !selectedTags.includes(newTag)) {
            const updatedTags = [...selectedTags, newTag];
            setSelectedTags(updatedTags); // Update state
            setValue('tags', updatedTags); // Update form value
            setTagInput(''); // Clear input field
        }
    };
    const removeTag = (tagToRemove: string) => {
        const updatedTags = selectedTags.filter(tag => tag !== tagToRemove);
        setSelectedTags(updatedTags); // Update state
        setValue('tags', updatedTags); // Update form value
    };

    const characterAppearanceWatch = watch("selfiePre");  // Watching specific input
    const characterAppearanceGetValues = getValues("selfiePre");  // Get value of specific input
    const imageModelWatch = watch("imageModel");  // Watching specific input
    const imageModelGetValues = getValues("imageModel");  // Get value of specific input

    const isLoading = form.formState.isSubmitting;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {           
            const submissionData = {
              ...values,
                tags: selectedTags,
            };
            if (initialData) {
                await axios.patch(`/api/companion/${initialData.id}`, submissionData);
            } else {
                await axios.post("/api/companion", submissionData);
            }

            toast({
                description: "Success.",
                duration: 3000,
            });

            router.refresh();
            if(initialData){
                router.push(preserveQueryParams(`/chat/${initialData.id}`));
            }
            else {
                router.push(preserveQueryParams("/"))
            }
        } catch (error) {
            console.log(error);
            if ((error as any).response.status === 406) {
            toast({
                variant: "destructive",
                description: "Illegal content detected in character",
                duration: 3000,
            });
            }
            else {
                toast({
                    variant: "destructive",
                    description: "Something went wrong.",
                    duration: 3000,
                });
            }
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
        maxHeight: "450px", // Limit the dropdown's height
        overflowY: "auto", // Enable vertical scrolling
        WebkitOverflowScrolling: 'touch' // Show scrollbar
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
                                    Generate character avatar below.
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
                                                <SelectItem key="realistic-vision-v5-1" value="realistic-vision-v5-1">Realistic Vision v5</SelectItem>
                                                <SelectItem key="realistic-vision-v3" value="realistic-vision-v3">Realistic Vision v3</SelectItem>
                                                <SelectItem key="dark-sushi-mix-v2-25" value="dark-sushi-mix-v2-25">Dark Sushi mix v2.25</SelectItem>
                                                <SelectItem key="absolute-reality-v1-8-1" value="absolute-reality-v1-8-1">Absolute Reality v1.8.1</SelectItem>
                                                <SelectItem key="dream-shaper-v8" value="dream-shaper-v8">Dream Shaper v8</SelectItem>
                                                <SelectItem key="juggernaut-xl-v10" value="juggernaut-xl-v10">Juggernaut XL (SDXL)</SelectItem>
                                                <SelectItem key="realvis-xl-v4" value="realvis-xl-v4">Realistic Vision v4 (SDXL)</SelectItem>
                                                <SelectItem key="reproduction-v3-31" value="reproduction-v3-31">Reproduction v3 (SDXL) Anime</SelectItem>
                                                <SelectItem key="real-cartoon-xl-v6" value="real-cartoon-xl-v6">Realcartoon v6 (SDXL)</SelectItem>
                                                <SelectItem key="counterfeit-xl-v2-5" value="counterfeit-xl-v2-5">Counterfeit (SDXL) Anime</SelectItem>
                                                <SelectItem key="animagine-xl-v-3-1" value="animagine-xl-v-3-1">Animagine XL (SDXL) Anime</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/926965?type=Model&format=SafeTensor&size=pruned&fp=fp16" value="https://civitai.com/api/download/models/926965?type=Model&format=SafeTensor&size=pruned&fp=fp16">Lustify (SDXL) Realistic</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/233092?type=Model&format=SafeTensor&size=full&fp=fp16" value="https://civitai.com/api/download/models/233092?type=Model&format=SafeTensor&size=full&fp=fp16">Better Than Words (SDXL) Realistic</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/981979?type=Model&format=SafeTensor&size=pruned&fp=fp16" value="https://civitai.com/api/download/models/981979?type=Model&format=SafeTensor&size=pruned&fp=fp16">Suzannes Mix (SDXL) Realistic</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/608842?type=Model&format=SafeTensor&size=full&fp=fp16" value="https://civitai.com/api/download/models/608842?type=Model&format=SafeTensor&size=full&fp=fp16">iNiverseMix (SDXL) Realistic</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/228559?type=Model&format=SafeTensor&size=pruned&fp=fp16" value="https://civitai.com/api/download/models/228559?type=Model&format=SafeTensor&size=pruned&fp=fp16">Omnigen XL (SDXL) Realistic/Anime</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/892880?type=Model&format=SafeTensor&size=pruned&fp=fp16" value="https://civitai.com/api/download/models/892880?type=Model&format=SafeTensor&size=pruned&fp=fp16">Albedo (SDXL) Realistic</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/384264?type=Model&format=SafeTensor&size=full&fp=fp16" value="https://civitai.com/api/download/models/384264?type=Model&format=SafeTensor&size=full&fp=fp16">AnythingXL (SDXL) Realistic/Anime</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/156375" value="https://civitai.com/api/download/models/156375">Clearhung Anime (SDXL)</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/303526?type=Model&format=SafeTensor&size=full&fp=fp16" value="https://civitai.com/api/download/models/303526?type=Model&format=SafeTensor&size=full&fp=fp16">Animemix (SDXL)</SelectItem>
                                                <SelectItem key="https://civitai.com/api/download/models/286821" value="https://civitai.com/api/download/models/286821">Deephentai (SDXL)</SelectItem>
                                                <SelectItem key="fal-ai/flux/dev" value="fal-ai/flux/dev">FLUX.1 (SFW)</SelectItem>
                                                <SelectItem key="fal-ai/stable-diffusion-v35-medium" value="fal-ai/stable-diffusion-v35-medium">StableDiffusion v3.5 (SFW)</SelectItem>






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
                                            Companion can send images based on appearance. Generated images cost extra tokens.
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
                        name="tags"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tags</FormLabel>
                                <FormControl>
                                    <div className="flex flex-col gap-2 mb-2">
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTags.map((tag, index) => (
                                                <div key={index} className="flex items-center gap-1 bg-primary/10 px-1 py-1 text-center text-xs md:text-sm1 md:px-1 md:py-1 rounded-md hover:opacity-75 transition rounded-full">
                                                    {tag}
                                                    <button type="button" onClick={() => removeTag(tag)} className="text-red-500 hover:text-gray-700">
                                                        &times;
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Input 
                                                value={tagInput} 
                                                onChange={handleTagInputChange} 
                                                onKeyDown={handleTagInputKeyDown} 
                                                placeholder="Type tag name" 
                                                disabled={isLoading}
                                                className="flex-grow"
                                            />
                                            <Button type="button" className="h-9 px-2 mx-1 whitespace-nowrap" onClick={addTag} disabled={isLoading}>Add Tag</Button>
                                        </div>
                                    </div>
                                </FormControl>
                                <FormDescription>
                                    Enter descriptive tags here to describe your character.
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

                                            <SelectItem key="NousResearch/Hermes-3-Llama-3.1-405B" value="NousResearch/Hermes-3-Llama-3.1-405B">Hermes-3-Llama-3.1-405B</SelectItem>

                                            <SelectItem key="Sao10K/L3-70B-Euryale-v2.1" value="Sao10K/L3-70B-Euryale-v2.1">Euryale L3 70B</SelectItem>
                                            <SelectItem key="Sao10K/L3.1-70B-Euryale-v2.2" value="Sao10K/L3.1-70B-Euryale-v2.2">Euryale L3.1 70B</SelectItem>

                                            <SelectItem key="NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO" value="NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO">Mixtral 8x7B DPO</SelectItem>
                                            <SelectItem key="mistralai/Mixtral-8x22B-Instruct-v0.1" value="mistralai/Mixtral-8x22B-Instruct-v0.1">Mixtral 8x22B</SelectItem>
                                            <SelectItem key="lizpreciatior/lzlv_70b_fp16_hf" value="lizpreciatior/lzlv_70b_fp16_hf">Lzlv 70B</SelectItem>
                                            <SelectItem key="mistralai/Mistral-Nemo-Instruct-2407" value="mistralai/Mistral-Nemo-Instruct-2407">Mistral Nemo 12B</SelectItem>      

                                            <SelectItem key="nvidia/Llama-3.1-Nemotron-70B-Instruct" value="nvidia/Llama-3.1-Nemotron-70B-Instruct">Nvidia Nemotron 70B</SelectItem>      
                                            <SelectItem key="Gryphe/MythoMax-L2-13b" value="Gryphe/MythoMax-L2-13b">Mythomax 13B</SelectItem>      
                                            <SelectItem key="meta-llama/Meta-Llama-3.1-405B-Instruct" value="meta-llama/Meta-Llama-3.1-405B-Instruct">Meta-Llama-3.1-405B (SFW)</SelectItem>
                                            <SelectItem key="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo" value="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo">Meta Llama 3.1 70B Turbo (SFW)</SelectItem>

                                            <SelectItem key="gpt-4o" value="gpt-4o">GPT-4o (SFW)</SelectItem>

                                            <SelectItem key="gpt-4o-mini" value="gpt-4o-mini">GPT-4o-mini (SFW)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Select the model for your AI.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="nsfw"
                            control={form.control}
                            render={({ field }) => {
                                // Remove the value property from the field object
                                const { value, ...rest } = field;

                                return (
                                    <FormItem>

                                        <FormControl>
                                            <FormLabel>NSFW &nbsp;
                                                <input
                                                    type="checkbox"
                                                    {...rest} // Spread the rest of the field object into the input element's props
                                                    checked={value} // Use the value property to set the checked property
                                                    style={{ width: '16px', height: '16px', cursor: "pointer" }}
                                                />
                                            </FormLabel>
                                        </FormControl>
                                        <FormDescription>
                                            Check if your companion contains or produces nsfw content.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />
                    
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
                                    <Textarea disabled={isLoading} rows={6} className="bg-background resize-none" placeholder={PREAMBLE} {...field} />
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
                                <FormLabel>Companion backstory</FormLabel>
                                <FormControl>
                                    <Textarea disabled={isLoading} rows={20} className="bg-background resize-none" placeholder={PREAMBLE_BACKSTORY} {...field} />
                                </FormControl>
                                <FormDescription>
                                    Describe all relevant facts and details about companion.
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
                                                    style={{ 
                                                        width: '14px', 
                                                        height: '14px',
                                                        backgroundColor: '#2d2d2d',
                                                        border: '2px solid #666',
                                                        borderRadius: '3px',
                                                        opacity: '0.8',
                                                        cursor: 'not-allowed'
                                                    }}
                                                    disabled
                                                />
                                            </label>
                                        </FormControl>
                                        <FormDescription>
                                            (New companions are public, other users can also talk to the character)
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
