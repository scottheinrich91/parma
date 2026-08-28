import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { resolveVaultPath, sanitizeRelativePath } from '../utils/security.js';
import { atomicWriteFile } from '../utils/atomic.js';

export interface VaultNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  size?: number;
  updatedAt?: string;
  children?: VaultNode[];
}

export interface NoteData {
  path: string;
  title: string;
  content: string;
  raw: string;
  frontmatter: Record<string, any>;
  stats: {
    size: number;
    mtime: string;
    birthtime: string;
  };
}

const IGNORED_NAMES = new Set([
  '.git',
  '.obsidian',
  '.DS_Store',
  'Thumbs.db',
  'node_modules',
]);

export async function getDirectoryTree(vaultPath: string): Promise<{ root: string; tree: VaultNode[] }> {
  async function walk(currentDir: string, relativeDir: string = ''): Promise<VaultNode[]> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    const nodes: VaultNode[] = [];

    // Sort folders first, then alphabetical
    const sorted = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    for (const entry of sorted) {
      if (IGNORED_NAMES.has(entry.name) || entry.name.startsWith('.tmp.')) {
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.join(relativeDir, entry.name).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        const children = await walk(fullPath, relativePath);
        nodes.push({
          id: relativePath,
          name: entry.name,
          path: relativePath,
          type: 'directory',
          children,
        });
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        // Include markdown files and common media files
        const stat = await fs.stat(fullPath);
        nodes.push({
          id: relativePath,
          name: entry.name,
          path: relativePath,
          type: 'file',
          extension: ext,
          size: stat.size,
          updatedAt: stat.mtime.toISOString(),
        });
      }
    }

    return nodes;
  }

  const tree = await walk(vaultPath);
  return { root: path.basename(vaultPath), tree };
}

export async function getAllNotePaths(vaultPath: string): Promise<string[]> {
  const notePaths: string[] = [];

  async function walk(currentDir: string, relativeDir: string = '') {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORED_NAMES.has(entry.name) || entry.name.startsWith('.tmp.')) continue;
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.join(relativeDir, entry.name).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        await walk(fullPath, relPath);
      } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.markdown'))) {
        notePaths.push(relPath);
      }
    }
  }

  if (fsSync.existsSync(vaultPath)) {
    await walk(vaultPath);
  }
  return notePaths;
}

export async function readNote(relativePath: string, vaultPath: string): Promise<NoteData> {
  const fullPath = resolveVaultPath(relativePath, vaultPath);
  const stat = await fs.stat(fullPath);
  const rawContent = await fs.readFile(fullPath, 'utf-8');
  
  const parsed = matter(rawContent);
  const title = (parsed.data.title as string) || 
    (parsed.content.match(/^#\s+(.+)$/m)?.[1]?.trim()) || 
    path.basename(relativePath, path.extname(relativePath));

  return {
    path: sanitizeRelativePath(relativePath),
    title,
    content: parsed.content,
    raw: rawContent,
    frontmatter: parsed.data,
    stats: {
      size: stat.size,
      mtime: stat.mtime.toISOString(),
      birthtime: stat.birthtime.toISOString(),
    },
  };
}

export async function writeNote(
  relativePath: string,
  content: string,
  vaultPath: string,
  frontmatter?: Record<string, any>
): Promise<{ path: string; success: boolean }> {
  const cleanRelPath = sanitizeRelativePath(relativePath);
  const finalRelPath = cleanRelPath.endsWith('.md') ? cleanRelPath : `${cleanRelPath}.md`;
  const fullPath = resolveVaultPath(finalRelPath, vaultPath);

  let fileContent = content;
  if (frontmatter && Object.keys(frontmatter).length > 0) {
    fileContent = matter.stringify(content, frontmatter);
  }

  await atomicWriteFile(fullPath, fileContent);
  return { path: finalRelPath, success: true };
}

export async function deleteFileOrFolder(relativePath: string, vaultPath: string): Promise<{ success: boolean }> {
  const fullPath = resolveVaultPath(relativePath, vaultPath);
  const stat = await fs.stat(fullPath);
  
  if (stat.isDirectory()) {
    await fs.rm(fullPath, { recursive: true, force: true });
  } else {
    await fs.unlink(fullPath);
  }

  return { success: true };
}
