"use client";
import React, { useState } from "react"; // Import React and useState
import * as z from "zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";
import { Category, Companion, Voice } from "@prisma/client";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
//import { ImageUpload } from "@/components/image-upload";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from "@/components/ui/select";
import { BotAvatarForm } from "@/components/bot-avatar-form";


const PREAMBLE = `Your personality can be described as ...`;
const PREAMBLE_BEHAVIOUR = `You behave like ...`;
const PREAMBLE_BACKSTORY = `relevant details and facts for bot ...`;
const PREAMBLE_SELFIE_PRE = `describe your character in detail ...`;
const PREAMBLE_SELFIE_POST = `describe image details and effects ...`;


const SEED_CHAT = `Introduction message for bot ...`;

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
    src: z.string().optional(),
    categoryId: z.string().min(1, {
        message: "Category is required",
    }),
    packageName: z.string().optional(),
    isPublic: z.boolean().optional(),
    createImages: z.boolean().optional(),
    behaviour: z.string().optional(),
    backstory: z.string().transform((value: string) => value.trim()) // Custom validation function to trim the string
        .refine((value: string) => value.length <= 3000, {
            message: "Backstory is too long",
        })
        .optional(),
    selfiePre: z.string().optional(),
    selfiePost: z.string().optional(),
    model: z.string().min(1, {
        message: "model is required",
    }),
    imageModel: z.string().min(1, {
        message: "imageModel is required",
    }),
    voiceId: z.string().optional(),
    regenerateImage: z.boolean().optional()
});

interface CompanionFormProps {
    categories: Category[];
    voices: Voice[];
    initialData: Companion | null;
};

export const CompanionForm = ({
    categories,
    voices,
    initialData
}: CompanionFormProps) => {
    const { toast } = useToast();
    const router = useRouter();
    const [selectedVoiceId, setSelectedVoiceId] = useState(initialData?.voiceId || 'none');
    const [sampleUrl, setSampleUrl] = useState(""); // State variable to store the sample URL

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


        },
    });

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
    return (
        <div className="h-full p-4 space-y-2 max-w-3xl mx-auto">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">
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
                        name="src"
                        render={({ field }) => (
                            <FormItem className="flex flex-col items-center justify-center space-y-4 col-span-2">
                                <FormControl>
                                    <BotAvatarForm disabled={isLoading} onChange={field.onChange} value={field.value} />
                                </FormControl>
                                <FormDescription>
                                    Image is generated from pre/post-selfie prompts.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
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

                                            <SelectItem key="NousResearch/Nous-Hermes-Llama2-13b" value="NousResearch/Nous-Hermes-Llama2-13b">Llama2 (NSFW content)</SelectItem>
                                            <SelectItem key="gpt-3.5-turbo-0613" value="gpt-3.5-turbo-0613">GPT-3.5</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Select the model for your AI, for NSFW content use LLama2. (Model version cannot be changed after creation)
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
                                    <Input disabled={isLoading} placeholder={PREAMBLE} {...field} />
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
                                    <Textarea disabled={isLoading} rows={4} className="bg-background resize-none" placeholder={PREAMBLE_BACKSTORY} {...field} />
                                </FormControl>
                                <FormDescription>
                                    Describe relevant facts and details, bot will dynamically use these with similarity search.
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
                    <div className="space-y-2 w-full">
                        <div>
                            <h3 className="text-lg font-medium">Image generation settings</h3>
                        </div>
                        <Separator className="bg-primary/10" />
                    </div>
                    <FormField
                        name="createImages"
                        control={form.control}
                        render={({ field }) => {
                            // Remove the value property from the field object
                            const { value, ...rest } = field;

                            return (
                                <FormItem>

                                    <FormControl>
                                        <label>Enable Image generation &nbsp;
                                            <input
                                                type="checkbox"
                                                {...rest} // Spread the rest of the field object into the input element's props
                                                checked={value} // Use the value property to set the checked property
                                                style={{ width: '14px', height: '14px' }}
                                            />
                                        </label>
                                    </FormControl>
                                    <FormDescription>
                                        Generated images cost extra tokens. This option cannot be edited after creation.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />
                    <FormField
                        control={form.control}
                        name="imageModel"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Image style</FormLabel>
                                <Select disabled={isLoading} onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-background">
                                            <SelectValue defaultValue={field.value} placeholder="Select a image style" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem key="realistic-vision-v3" value="realistic-vision-v3">Realistic-Vision-v3</SelectItem>
                                        <SelectItem key="absolute-reality-v1-8-1" value="absolute-reality-v1-8-1">Absolute-Reality-v1-8-1</SelectItem>
                                        <SelectItem key="dark-sushi-mix-v2-25" value="dark-sushi-mix-v2-25">Dark-Sushi-mix-v2-25</SelectItem>
                                        <SelectItem key="arcane-diffusion" value="arcane-diffusion">Arcane-Diffusion</SelectItem>
                                        <SelectItem key="van-gogh-diffusion" value="van-gogh-diffusion">Van Gogh Diffusion</SelectItem>
                                        <SelectItem key="neverending-dream" value="neverending-dream">Neverending Dream</SelectItem>
                                        <SelectItem key="mo-di-diffusion" value="mo-di-diffusion">Modern Disney Diffusion</SelectItem>
                                        <SelectItem key="synthwave-punk-v2" value="synthwave-punk-v2">Synthwave Punk V2</SelectItem>
                                        <SelectItem key="dream-shaper-v8" value="dream-shaper-v8">Dream Shaper V8</SelectItem>

                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Select the style for generated images.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        name="selfiePre"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Pre-selfie prompt</FormLabel>
                                <FormControl>
                                    <Input disabled={isLoading} className="bg-background resize-none" placeholder={PREAMBLE_SELFIE_PRE} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        name="selfiePost"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Post-selfie prompt</FormLabel>
                                <FormControl>
                                    <Input disabled={isLoading} className="bg-background resize-none" placeholder={PREAMBLE_SELFIE_POST} {...field} />
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
                                    <button // Use a plain HTML button with type="button"
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
                        <FormField
                            name="regenerateImage"
                            control={form.control}
                            render={({ field }) => {
                                // Remove the value property from the field object
                                const { value, ...rest } = field;

                                return (
                                    <FormItem>

                                        <FormControl>
                                            <label>Regenerate bot image  &nbsp;
                                                <input
                                                    type="checkbox"
                                                    {...rest} // Spread the rest of the field object into the input element's props
                                                    checked={value} // Use the value property to set the checked property
                                                    style={{ width: '14px', height: '14px' }}
                                                />
                                            </label>
                                        </FormControl>
                                        <FormDescription>
                                            (Regenerate the bot image from selfie prompt)
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
                    </div>
                </form>
            </Form>
        </div>
    );
};
