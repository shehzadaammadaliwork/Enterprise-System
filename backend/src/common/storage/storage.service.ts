import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { mkdir, readFile, stat, unlink, writeFile } from 'fs/promises';
import { extname, join, resolve, sep } from 'path';
import { AppException } from '../filters/app-exception';
import { HttpStatus } from '@nestjs/common';

export interface StoredFile {
  /// Relative key under the storage root — persist this, not an absolute path.
  key: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
}

export interface SaveFileOptions {
  /// Logical folder, e.g. "employees/<employeeId>" or "documents/<documentId>".
  folder: string;
  fileName: string;
  buffer: Buffer;
  mimeType: string;
  allowedMimeTypes?: string[];
  maxSizeBytes?: number;
}

const DEFAULT_MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

/// The single shared local-disk storage abstraction (Architecture Rule,
/// Section 2). No module writes to disk directly — everything goes through
/// `save`/`read`/`delete` here, which enforces type/size limits and keeps
/// every stored file under one root so access checks have one place to live.
/// Versioning (Module 13) is layered on top by storing each re-upload under
/// a new key and letting the calling module keep its own version history rows.
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly root = resolve(
    process.env.STORAGE_ROOT ?? join(process.cwd(), 'storage'),
  );

  async save(options: SaveFileOptions): Promise<StoredFile> {
    const { folder, fileName, buffer, mimeType } = options;
    const maxSize = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;

    if (buffer.length > maxSize) {
      throw new AppException(
        'FILE_TOO_LARGE',
        `File exceeds maximum size of ${maxSize} bytes.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      options.allowedMimeTypes &&
      !options.allowedMimeTypes.includes(mimeType)
    ) {
      throw new AppException(
        'FILE_TYPE_NOT_ALLOWED',
        `File type ${mimeType} is not allowed.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const safeFolder = this.sanitizeSegment(folder);
    const ext = extname(fileName);
    const key = join(safeFolder, `${randomUUID()}${ext}`);
    const absolutePath = this.resolveWithinRoot(key);

    await mkdir(join(absolutePath, '..'), { recursive: true });
    await writeFile(absolutePath, buffer);

    const checksum = createHash('sha256').update(buffer).digest('hex');
    this.logger.log(`Saved file ${key} (${buffer.length} bytes)`);

    return {
      key: key.split(sep).join('/'),
      originalName: fileName,
      mimeType,
      sizeBytes: buffer.length,
      checksum,
    };
  }

  async read(key: string): Promise<Buffer> {
    return readFile(this.resolveWithinRoot(key));
  }

  createReadStream(key: string) {
    return createReadStream(this.resolveWithinRoot(key));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await stat(this.resolveWithinRoot(key));
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    await unlink(this.resolveWithinRoot(key)).catch(() => {
      // Already gone — deleting is idempotent.
    });
  }

  /// Exported for Module 18's BackupService, which needs to snapshot/restore
  /// the whole storage tree rather than one key at a time — the only
  /// legitimate reason to know the root path itself instead of going through
  /// save/read/delete like every other caller.
  getRootPath(): string {
    return this.root;
  }

  /// Prevents path traversal (`../../etc/passwd`) from ever escaping the
  /// configured storage root, since `folder`/`key` values can originate from
  /// user-controlled record names.
  private resolveWithinRoot(key: string): string {
    const absolute = resolve(this.root, key);
    if (!absolute.startsWith(this.root + sep) && absolute !== this.root) {
      throw new AppException(
        'INVALID_PATH',
        'Resolved path escapes storage root.',
        HttpStatus.BAD_REQUEST,
      );
    }
    return absolute;
  }

  private sanitizeSegment(segment: string): string {
    return segment
      .split('/')
      .map((part) => part.replace(/[^a-zA-Z0-9_.-]/g, '_'))
      .filter((part) => part && part !== '.' && part !== '..')
      .join('/');
  }
}
