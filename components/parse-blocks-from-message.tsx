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
    //console.log(message.role)
    // Check if message content is a JSON array and parse the "text" field to message.content for previous message format
    try {
      if (message.content.startsWith("[")){
        const content = JSON.parse(message.content.toString());
        if (Array.isArray(content) && content.length > 0 && content[0].text) {
          message.content = content.map(block => block.text).join("\n");
        } else {
          console.log("Message content is not a JSON array or does not have a 'text' field.");
          message.content = content;
        }
      }
    } catch (error) {
      console.error('Error parsing JSON content', error);
      // Handle error case
      //message.content = '';
    }
    const block: ExtendedBlock = {
      id: message.id,
      text: message.content,
      historical: false,
      streamingUrl: `https://api.steamship.com/api/v1/block/null/raw`,
      messageType: MessageTypes.TEXT,//getMessageType(message.role),
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
    console.log(block)
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
          console.log(block.messageType)
          if (block.messageType === MessageTypes.STREAMING_BLOCK) {
              console.log("Streaming block", block)
          }
          // Use validTypes to determine if the block is visible in chat
          block.isVisibleInChat = validTypes.includes(block.messageType);
          console.log("Visible block: ",block.isVisibleInChat)
          // TODO: Update logic for isInputElement based on your application's needs
          block.isInputElement = false; // Example static assignment

          return block;
        } catch (e) {
          console.error(
            `Error parsing block: ${e}. Block str was: ${blockStr}. Message was: ${message.content}`
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
  console.log("Parse messages ",messages)
  let ret: ExtendedBlock[] = [];
  for (let msg of messages || []) {
    ret = [...ret, ...chatMessageJsonlToBlock(msg, skipIfInputEquals)];
  }
  return ret;
}