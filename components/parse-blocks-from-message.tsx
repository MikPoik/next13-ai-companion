  // components/parse-blocks-from-message.tsx
  import { Message } from "ai";
  import { getMessageType, validTypes, MessageTypes } from "@/components/block-chat-types";
  import { ExtendedBlock } from "@/components/extended-block"; // Import ExtendedBlock type
  const { v4: uuidv4 } = require('uuid');

  /**
   * Replaces escaped quotes in a JSON-like string.
   */
  function replaceQuotesInText(text: string): string {
    const regex = /("text":\s*")((?:\\.|[^"\\])*)("(?=\s*,\s*"mimeType"))/;
    const match = text.match(regex);
    if (match) {
      const [fullMatch, textStart, originalText, textEnd] = match;
      const escapedText = originalText.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return text.replace(fullMatch, `${textStart}${escapedText}${textEnd}`);
    }
    return text;
  }

  /**
   * Sanitizes a JSON string by replacing newlines with escaped newlines.
   */
  function sanitizeJSONString(content: string): string {
    return content.replace(/\n/g, "\\n");
  }

  /**
   * Parses message content into a JavaScript object.
   */
  function parseMessageContent(messageContent: string): any {
    messageContent = replaceQuotesInText(messageContent);
    const sanitizedContent = sanitizeJSONString(messageContent);
    try {
      return JSON.parse(sanitizedContent);
    } catch (error) {
      console.error("Error parsing JSON content:", error, messageContent);
      throw error; // Rethrow to handle upstream
    }
  }

  /**
   * Converts a single chat message into an array of ExtendedBlocks.
   */
  export function chatMessageJsonlToBlock(
    message: Message,
    skipIfInputEquals: string | null
  ): ExtendedBlock[] {
    const applySkipIfInput =
      skipIfInputEquals != null && skipIfInputEquals.trim().length > 0;

    if (typeof message !== 'object' || message.content == null) {
      console.error("Invalid message object:", message);
      return [];
    }

    let content = message.content.toString();
    //console.log(content)
    // Handle text inside brackets (e.g., "[Caroline says hi]")
    if (/^\[.*\]$/.test(content)) {
      console.log("Detected text inside brackets:", content);
      content = content.slice(1, -1); // Remove brackets
    }

    // Handle JSON array content
    if (content.startsWith("[") && content.endsWith("]")) {
      try {
        const parsedContent = parseMessageContent(content);
        if (Array.isArray(parsedContent) && parsedContent.length > 0) {
          if (parsedContent[0].text && !/!\[.*?\]\(.*?\)/.test(parsedContent[0].text)) {
            console.log("JSON array detected with 'text' field.");
            content = parsedContent.map(block => block.text).join("\n");
          } else if (/!\[.*?\]\(.*?\)/.test(parsedContent[0].text)) {
            console.log("Detected image content in JSON array.");
            const block: ExtendedBlock = {
              id: message.id,
              text: parsedContent[0].text.replace(/\\"/g, '"') || '',
              historical: false,
              streamingUrl: ``,
              messageType: MessageTypes.IMAGE,
              isVisibleInChat: validTypes.includes("IMAGE"),
              isInputElement: false,
              role: message.role,
              createdAt: typeof message.createdAt === 'string'
                ? message.createdAt
                : new Date().toString(),
              workspaceId: uuidv4(),
              userId: "default",
              fileId: "default",
              index: 0,
              publicData: true,
              contentURL: null,
              uploadBytes: null,
              uploadType: null,
              mimeType: null,
              url: null,
            };
            return [block];
          }
        }
      } catch (error) {
        console.error("Error processing JSON content:", error, content);
      }
    }

    // Determine message type based on content
    let messageType: "TEXT" | "IMAGE" | "VOICE" = MessageTypes.TEXT;
    if (/!\[(?!voice).*?\]\(.*?\)/.test(content)) {
      console.log("IMAGE")
      console.log(content)
      messageType = MessageTypes.IMAGE;
    } else if (/!\[voice]\(.*?\)/.test(content)) {
      console.log("VOICE")
      console.log(content)
        messageType = MessageTypes.VOICE;
    }

    // Create and return the ExtendedBlock
    const block: ExtendedBlock = {
      id: message.id,
      text: content, // Use the processed content
      historical: false,
      streamingUrl: ``,
      messageType: messageType,
      isVisibleInChat: validTypes.includes(messageType),
      isInputElement: false,
      role: message.role,
      createdAt: typeof message.createdAt === 'string'
        ? message.createdAt
        : new Date().toString(),
      workspaceId: uuidv4(),
      userId: "default",
      fileId: "default",
      index: 0,
      publicData: true,
      contentURL: null,
      uploadBytes: null,
      uploadType: null,
      mimeType: null,
      url: null,
    };

    return [block];
  }

  /**
   * Converts an array of chat messages into an array of ExtendedBlocks.
   */
  export function chatMessagesJsonlToBlocks(
    messages: Message[],
    skipIfInputEquals: string | null
  ): ExtendedBlock[] {
    let result: ExtendedBlock[] = [];
    for (const message of messages || []) {
      result = [...result, ...chatMessageJsonlToBlock(message, skipIfInputEquals)];
    }
    return result;
  }

