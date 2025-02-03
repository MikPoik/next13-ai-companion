import { SteamshipBlock as Block } from '@/components/SteamShipBlock';

export const MessageTypes = {
  STATUS_MESSAGE: "STATUS_MESSAGE",
  SYSTEM_MESSAGE: "SYSTEM_MESSAGE",
  USER_MESSAGE: "USER_MESSAGE",
  STREAMING_BLOCK: "STREAMING_BLOCK",
  IMAGE: "IMAGE",
  VOICE: "VOICE",
  TEXT: "TEXT",
  USER_STATUS_MESSAGE: "USER_STATUS_MESSAGE"
} as const;

export const validTypes = [
  MessageTypes.IMAGE,
  MessageTypes.TEXT,
  MessageTypes.VOICE,
  MessageTypes.STREAMING_BLOCK,
  MessageTypes.USER_MESSAGE
] as string[];


export const getMessageType = (block: Block) => {
      const isNoneUserMessage = block.text === "None" && block.tags?.some(tag => 
        tag.kind === "chat" && tag.value?.["string-value"] === "user"
      );
      if (isNoneUserMessage) {
        // Optionally handle this case differently, e.g., return null or a specific type to ignore
        return MessageTypes.USER_STATUS_MESSAGE; // Or a new type like IGNORED_MESSAGE if you want to handle this explicitly
   }
  if (block.tags?.find((tag) => tag.name === "image")) {
    return MessageTypes.IMAGE;
  }
  if (block.tags?.find((tag) => tag.name === "voice")) {
    return MessageTypes.VOICE;
  }
  if (block?.tags?.find((tag) => tag.kind === "status-message")) {
    return MessageTypes.STATUS_MESSAGE;
  }
  if (
    block?.tags?.find(
      (tag) => tag.kind === "chat" && tag?.value?.["string-value"] === "system"
    )
  ) {
    return MessageTypes.SYSTEM_MESSAGE;
  }
  
  if (
    block?.tags?.find(
      (tag) => tag.kind === "chat" && tag?.value?.["string-value"] === "user"
    )
  ) {
    return MessageTypes.USER_MESSAGE;
  }
  if (block.streamState) {
    return MessageTypes.STREAMING_BLOCK;
  }


  return MessageTypes.TEXT;
};
