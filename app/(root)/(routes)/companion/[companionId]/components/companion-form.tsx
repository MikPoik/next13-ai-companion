"use client";

import * as z from "zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";
import { Category, Companion } from "@prisma/client";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/image-upload";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from "@/components/ui/select";


const PREAMBLE = `Your personality can be described as ...`;
const PREAMBLE_BEHAVIOUR = `You behave like ...`;
const PREAMBLE_SELFIE_PRE = `describe your character in detail ...`;
const PREAMBLE_SELFIE_POST = `describe image details and effects ...`;


const SEED_CHAT = `Introduction message for bot ...`;

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required.",
  }),
  description: z.string().min(1, {
    message: "Description is required.",
  }),
  personality: z.string().min(1, {
    message: "Personality require at least 200 characters."
  }),
  seed: z.string().min(1, {
    message: "Seed requires at least 200 characters."
  }),
  src: z.string().min(1, {
    message: "Image is required."
  }),
  categoryId: z.string().min(1, {
    message: "Category is required",
  }),
  packageName: z.string().optional(),
  isPublic: z.boolean().optional(),
  createImages: z.boolean().optional(),
  behaviour: z.string().min(0, {
    message: "Behaviour is required",
  }),
  selfiePre: z.string().optional(),
  selfiePost: z.string().optional(),
  model: z.string().min(1,{
    message: "model is required",
  })  
});

interface CompanionFormProps {
  categories: Category[];
  initialData: Companion | null;
};

export const CompanionForm = ({
  categories,
  initialData
}: CompanionFormProps) => {
  const { toast } = useToast();
  const router = useRouter();

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
      behaviour:"",
      selfiePre:"",
      selfiePost:"",
      model: "",
      createImages:true


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
                  <ImageUpload disabled={isLoading} onChange={field.onChange} value={field.value} />
                </FormControl>
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

                        <SelectItem key="Llama2" value="Llama2">Llama2 (NSFW content)</SelectItem>
                        <SelectItem key="GPT3.5" value="GPT3.5">GPT-3.5</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the model for your AI, for NSFW content use LLama2
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
                  <Textarea disabled={isLoading} rows={5} className="bg-background resize-none" placeholder={PREAMBLE} {...field} />
                </FormControl>
                <FormDescription>
                  Describe in detail your companion&apos;s personality and relevant details.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="behaviour"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Behaviour</FormLabel>
                <FormControl>
                  <Textarea disabled={isLoading} rows={5} className="bg-background resize-none" placeholder={PREAMBLE_BEHAVIOUR} {...field} />
                </FormControl>
                <FormDescription>
                  Describe in detail your companion&apos;s behaviour.
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
                <FormLabel>First chat message</FormLabel>
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
                  (Generated images cost extra tokens)
                </FormDescription>                  
                  <FormMessage />
                </FormItem>
              );
            }}
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
