import { Steamship } from '@steamship/client';
// Exporting the interfaces
export interface SteamshipApiResponse {
    data: SteamshipBlock[];
}
export interface SteamshipBlock {
    contentURL: string | null;
    index: number | null;
    text: string;
    id: string | null;
    uploadBytes: number | null;
    publicData: boolean;
    uploadType: string | null;
    tags: string[];
    fileId: string | null;
    mimeType: string | null;
    url: string | null;
}
