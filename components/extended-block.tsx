import { SteamshipBlock as Block } from "@/components/SteamShipBlock";

export type ExtendedBlock = Block & {
  /**
   * Used to indicate the block is from a prior chat history session. Important because we
   * choose to show or hide user input blocks depending on whether they are historical
   */
  historical?: boolean;

  /**
   * The url where the contents cen be streamed from.
   */
  streamingUrl?: string;

  /**
   * Is this block a visible artifact in the chat?
   */
  isVisibleInChat?: boolean;

  /**
   * Is this block an input element?
   */
  isInputElement?: boolean;

  /**
   * What is the message type of this block?
   */
  messageType?: string;

  role?: string;

  createdAt?: string;
  workspaceId?:string;
  userId?: string;
  contentURL: null,
  uploadBytes: null,
  uploadType: null,
  mimeType: null,
  url: null,
  fileId: string | null,
  index: number | null
};
