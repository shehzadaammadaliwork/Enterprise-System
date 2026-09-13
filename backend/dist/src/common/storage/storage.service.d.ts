export interface StoredFile {
    key: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    checksum: string;
}
export interface SaveFileOptions {
    folder: string;
    fileName: string;
    buffer: Buffer;
    mimeType: string;
    allowedMimeTypes?: string[];
    maxSizeBytes?: number;
}
export declare class StorageService {
    private readonly logger;
    private readonly root;
    save(options: SaveFileOptions): Promise<StoredFile>;
    read(key: string): Promise<Buffer>;
    createReadStream(key: string): import("fs").ReadStream;
    exists(key: string): Promise<boolean>;
    delete(key: string): Promise<void>;
    getRootPath(): string;
    private resolveWithinRoot;
    private sanitizeSegment;
}
