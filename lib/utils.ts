import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`
}

interface Block {
  text?: string;
  publicData?: boolean;
  streamState?: string;
  requestId?: string;
  index?: number;
  tags?: Array<any>;
  mimeType?: string;
  createdAt?: string;
  id?: string;
  fileId?: string;
  workspaceId?: string;
}

export function parseImageFromBlocks(
  blockListStr: string, 
  prompt: string = "", 
  userId: string = "", 
  chatId: string = "", 
  id: string = ""
): string {  // Explicitly define the return type as string
  try {
    // Fix the input blockList string into JSON
    const blockList: Block[] = JSON.parse(`[${blockListStr.split('\n').join(',')}]`.replace(/,(\s*[\]}])/g, '$1'));
    for (const block of blockList) {
      if (block.mimeType && block.mimeType.startsWith("image")) {
        const imageId = block.id || null;
        //console.log(`Found image block: ${imageId}`);
        // Return Image Id
        const finalContent = `[{"requestId":null,"text":"${prompt}","mimeType":"image/png","streamState":null,"url":null,"contentURL":null,"fileId":null,"id":"${imageId}","index":null,"publicData":true,"tags":[],"uploadBytes":null,"uploadType":null}]`;
        return finalContent;
      }
    }
    return prompt; // No image block found
  } catch (error) {
    console.error("Error parsing or saving image block ids:", error);
    console.error("Block list string causing error:", blockListStr);
    return prompt; // In case of error, return prompt
  }
}