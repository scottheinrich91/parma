import path from 'node:path';

const ALLOWED_MEDIA_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.ico',
  '.mp4', '.webm', '.ogg', '.mp3', '.wav', '.pdf'
]);

export function sanitizeRelativePath(rawPath: string): string {
  if (!rawPath) return '';
  // Normalize and remove leading slashes and windows drive letters
  const normalized = path.normalize(rawPath).replace(/^(\.\.[\/\\])+/, '');
  const cleanPath = normalized.replace(/^[\/\\]+/, '').replace(/^[a-zA-Z]:/, '');
  return cleanPath;
}

export function resolveVaultPath(relativePath: string, vaultRoot: string): string {
  const sanitized = sanitizeRelativePath(relativePath);
  const resolved = path.resolve(vaultRoot, sanitized);
  
  // Strict traversal verification
  const normalizedVault = path.resolve(vaultRoot);
  if (!resolved.startsWith(normalizedVault)) {
    throw new Error('Access denied: Path traversal attempt detected');
  }
  
  return resolved;
}

export function isSafeMediaExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_MEDIA_EXTENSIONS.has(ext);
}
