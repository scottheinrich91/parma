import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import mime from 'mime-types';
import { isSafeMediaExtension, resolveVaultPath } from '../utils/security.js';

export interface MediaFileResponse {
  stream: fsSync.ReadStream;
  contentType: string;
  contentLength: number;
  etag: string;
  lastModified: string;
}

export async function getMediaFile(relativePath: string, vaultPath: string): Promise<MediaFileResponse> {
  if (!isSafeMediaExtension(relativePath)) {
    throw new Error('Unsupported or prohibited media file type');
  }

  const fullPath = resolveVaultPath(relativePath, vaultPath);
  const stat = await fs.stat(fullPath);

  if (!stat.isFile()) {
    throw new Error('Requested asset is not a regular file');
  }

  const mimeType = mime.lookup(fullPath) || 'application/octet-stream';
  const etag = `W/"${stat.size}-${stat.mtime.getTime()}"`;
  const stream = fsSync.createReadStream(fullPath);

  return {
    stream,
    contentType: mimeType,
    contentLength: stat.size,
    etag,
    lastModified: stat.mtime.toUTCString(),
  };
}
