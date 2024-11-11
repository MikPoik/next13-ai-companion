// components/parse-blocks-from-message.tsx
import { Message } from "ai";
import { getMessageType, validTypes,MessageTypes } from "@/components/block-chat-types";
import { ExtendedBlock } from "@/components//extended-block"; // Import ExtendedBlock type
const { v4: uuidv4 } = require('uuid');
/**
 * Parses a single message string into an ExtendedBlock.
 * @param message Message object containing the content to parse.
 * @param skipIfInputEquals Optional string to skip if input matches.
 * @returns Array of ExtendedBlock objects.
 */
function replaceQuotesInText(text: string): string {
  const regex = /("text":\s*")((?:\\.|[^"\\])*)("(?=\s*,\s*"mimeType"))/;
  
  const match = text.match(regex);
if (match) {
  const [fullMatch, textStart, originalText, textEnd] = match;
  const escapedText = originalText.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return text.replace(fullMatch, `${textStart}${escapedText}${textEnd}`);
} else {
  return text;
}
}

function sanitizeJSONString(content: string): string {
  return content.replace(/\n/g, "\\n");
}
function parseMessageContent(messageContent: string): any {
  messageContent = replaceQuotesInText(messageContent);
  const sanitizedContent = sanitizeJSONString(messageContent);
  return JSON.parse(sanitizedContent);
}
export function chatMessageJsonlToBlock(
  message: Message,
  skipIfInputEquals: string | null
): ExtendedBlock[] {
  const applySkipIfInput =
    skipIfInputEquals != null && skipIfInputEquals.trim().length > 0;
  //console.log("Process message ",message)
  //console.log("Process message content",message.content)
  
  if (typeof message === 'object' && message.content !== null && !message.content.toString().includes("workspaceId")) {
    //console.log("Processing JSON object message.content");
    //console.log(message.content)
    // Check if message content is a JSON array and parse the "text" field to message.content for previous message format
    try {
      if (message.content.startsWith("[") && message.content.endsWith("]")){
        //console.log("JSON array detected")
       
        
        const content = parseMessageContent(message.content.toString());
        if (Array.isArray(content) && content.length > 0 && content[0].text && !/!\[.*?\]\(.*?\)/.test(content[0].text)) {
         console.log("JSON array detected and text field exists");
          message.content = content.map(block => block.text).join("\n");
        } else if (Array.isArray(content) && content.length > 0 && /!\[.*?\]\(.*?\)/.test(content[0].text))  {
          console.log("Message content is not a JSON array or does not have a 'text' field. It is an image", content);
          const block: ExtendedBlock = {
            id: message.id,
            text: content[0].text.replace(/\\"/g, '"') || '', // Use the content if available
            historical: false,
            streamingUrl: `https://api.steamship.com/api/v1/block/${content[0].id}/raw`,
            messageType: MessageTypes.IMAGE,
            isVisibleInChat: validTypes.includes("IMAGE"),
            isInputElement: false,
            role: message.role,
            createdAt: typeof message.createdAt === 'string' 
              ? message.createdAt 
              : (new Date().toString()),
            workspaceId: uuidv4(),
            userId: "default",
            fileId: "default",
            index: 0,
            publicData: true,
          };

          //console.log(block);
          return [block];
          
          //How to create an ExtendBlock object from a JSON object?
        }
      }
    } catch (error) {
      console.error('Error parsing JSON content', error,message.content);
      // Handle error case
      //message.content = '';
    }

    let messageType: "TEXT" | "IMAGE" = MessageTypes.TEXT;
    if (/!\[.*?\]\(.*?\)/.test(message.content)) {
      
      messageType = MessageTypes.IMAGE
      
    }
      
    const block: ExtendedBlock = {
      id: message.id,
      text: message.content,
      historical: false,
      streamingUrl: `https://api.steamship.com/api/v1/block/null/raw`,
      messageType: messageType,//MessageTypes.TEXT,//getMessageType(message.role),
      isVisibleInChat: validTypes.includes("TEXT"),
      isInputElement: false,
      role: message.role,
      createdAt:   typeof message.createdAt === 'string' 
        ? message.createdAt 
        : (new Date().toString()),
      workspaceId: uuidv4(),
      userId:"default",
      fileId: "default",
      index: 0,
      publicData: true,
    };
    //console.log(block)
    return [block];
  }

    
    if (typeof message.content !== 'string') {
      console.error('Expected message.content to be a string', message.content,message);
      return []; // Return an empty array or fallback logic here
    }
  const blocks = message.content
    .split(/\r?\n|\r|\n/g)
    .map((blockStr) => {
      if (blockStr) {
        try {
          const block: ExtendedBlock = JSON.parse(blockStr);
          if (!block.streamingUrl && block.id) {
            block.streamingUrl = `https://api.steamship.com/api/v1/block/${block.id}/raw`;
          }
          block.historical = false; // Set historical flag to false for new blocks
          block.messageType = getMessageType(block); // Determine the message type
          //console.log(block.messageType)
          //if (block.messageType === MessageTypes.STREAMING_BLOCK) {
          //    console.log("Streaming block", block)
          //}
          // Use validTypes to determine if the block is visible in chat
          block.isVisibleInChat = validTypes.includes(block.messageType);
          //console.log("Visible block: ",block.isVisibleInChat)
          // TODO: Update logic for isInputElement based on your application's needs
          block.isInputElement = false; // Example static assignment

          return block;
        } catch (e) {
          console.error(
            `Error parsing block: ${e}.`
          );
          // In case of error, return null and filter it out later
          return null;
        }
      }
      return null;
    })
    .filter((block): block is ExtendedBlock => block !== null && (!applySkipIfInput || block.text !== skipIfInputEquals));
  // Fallback check to attempt parsing as JSON if blocks array is empty or initial parsing failed

 
    
  return blocks;
}

/**
 * Converts chat messages into an array of ExtendedBlocks.
 * @param messages Array of Message objects.
 * @param skipIfInputEquals Optional string to skip if input matches.
 * @returns Array of ExtendedBlock objects.
 */
export function chatMessagesJsonlToBlocks(
  messages: Message[],
  skipIfInputEquals: string | null
): ExtendedBlock[] {
  //console.log("Parse messages ",messages)
  let ret: ExtendedBlock[] = [];
  for (let msg of messages || []) {
    ret = [...ret, ...chatMessageJsonlToBlock(msg, skipIfInputEquals)];
  }
  return ret;
}