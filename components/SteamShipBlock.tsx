
// Exporting the interfaces
export interface SteamshipApiResponse {
    data: SteamshipBlock[];
}

export interface Tag {
    blockId?: string;
    startIdx?: number;
    endIdx?: number;
    kind: string;
    name?: string;
    value?: Record<string, any>;
    text?: string;
};

export interface SteamshipBlock {
    contentURL: string | null;
    index: number | null;
    text: string;
    id: string | null;
    uploadBytes: number | null;
    publicData: boolean;
    uploadType: string | null;
    tags?: Tag[];
    fileId: string | null;
    mimeType: string | null;
    url: string | null;
    streamState?: "started" | "completed" | "aborted";
    
}

