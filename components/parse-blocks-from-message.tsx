// components/parse-blocks-from-message.tsx
import { Message } from "ai";
import { getMessageType, validTypes,MessageTypes } from "@/components/block-chat-types";
import { ExtendedBlock } from "@/components//extended-block"; // Import ExtendedBlock type

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
          console.log(block.isVisibleInChat)
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
    .filter((block) => block !== null && (!applySkipIfInput || block.text !== skipIfInputEquals));

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
  let ret: ExtendedBlock[] = [];
  for (let msg of messages || []) {
    ret = [...ret, ...chatMessageJsonlToBlock(msg, skipIfInputEquals)];
  }
  return ret;
}