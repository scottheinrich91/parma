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
  createdAt?: string;
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

export type BookmarkType = 'file' | 'folder' | 'group' | 'search' | 'url';

export interface BookmarkItem {
  type: BookmarkType;
  title?: string;
  path?: string;
  query?: string;
  url?: string;
  ctime?: number;
  items?: BookmarkItem[];
}

export interface BookmarksData {
  items: BookmarkItem[];
}

const IGNORED_NAMES = new Set([
  '.git',
  '.obsidian',
  '.parma',
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
        const stat = await fs.stat(fullPath);
        const children = await walk(fullPath, relativePath);
        nodes.push({
          id: relativePath,
          name: entry.name,
          path: relativePath,
          type: 'directory',
          updatedAt: stat.mtime.toISOString(),
          createdAt: (stat.birthtime || stat.ctime || stat.mtime).toISOString(),
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
          createdAt: (stat.birthtime || stat.ctime || stat.mtime).toISOString(),
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

export async function createDirectory(
  relativePath: string,
  vaultPath: string
): Promise<{ path: string; success: boolean }> {
  const cleanRelPath = sanitizeRelativePath(relativePath);
  if (!cleanRelPath) {
    throw new Error('Folder path cannot be empty');
  }
  const fullPath = resolveVaultPath(cleanRelPath, vaultPath);
  await fs.mkdir(fullPath, { recursive: true });
  return { path: cleanRelPath, success: true };
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

export async function renamePath(
  oldRelativePath: string,
  newRelativePath: string,
  vaultPath: string
): Promise<{ success: boolean; oldPath: string; newPath: string }> {
  const cleanOld = sanitizeRelativePath(oldRelativePath);
  const cleanNew = sanitizeRelativePath(newRelativePath);

  if (!cleanOld) throw new Error('Source path cannot be empty');
  if (!cleanNew) throw new Error('Target path cannot be empty');
  if (cleanOld === cleanNew) {
    return { success: true, oldPath: cleanOld, newPath: cleanNew };
  }

  const fullOld = resolveVaultPath(cleanOld, vaultPath);
  const fullNew = resolveVaultPath(cleanNew, vaultPath);

  if (!fsSync.existsSync(fullOld)) {
    throw new Error(`File or directory not found: ${cleanOld}`);
  }

  const targetParent = path.dirname(fullNew);
  await fs.mkdir(targetParent, { recursive: true });

  await fs.rename(fullOld, fullNew);
  return { success: true, oldPath: cleanOld, newPath: cleanNew };
}

export async function duplicatePath(
  sourceRelativePath: string,
  vaultPath: string
): Promise<{ success: boolean; path: string }> {
  const cleanSource = sanitizeRelativePath(sourceRelativePath);
  if (!cleanSource) throw new Error('Source path cannot be empty');

  const fullSource = resolveVaultPath(cleanSource, vaultPath);
  if (!fsSync.existsSync(fullSource)) {
    throw new Error(`Source not found: ${cleanSource}`);
  }

  const stat = await fs.stat(fullSource);
  const isDir = stat.isDirectory();
  const parentDir = path.dirname(cleanSource);
  const baseParent = parentDir === '.' ? '' : parentDir;

  let candidateRelPath = '';
  let candidateFullPath = '';

  if (isDir) {
    const baseName = path.basename(cleanSource);
    let counter = 1;
    while (true) {
      const suffix = counter === 1 ? ' (copy)' : ` (copy ${counter})`;
      const targetName = `${baseName}${suffix}`;
      candidateRelPath = baseParent ? `${baseParent}/${targetName}` : targetName;
      candidateFullPath = resolveVaultPath(candidateRelPath, vaultPath);
      if (!fsSync.existsSync(candidateFullPath)) {
        break;
      }
      counter++;
    }
    await fs.cp(fullSource, candidateFullPath, { recursive: true });
  } else {
    const ext = path.extname(cleanSource);
    const baseName = path.basename(cleanSource, ext);
    let counter = 1;
    while (true) {
      const suffix = counter === 1 ? ' (copy)' : ` (copy ${counter})`;
      const targetName = `${baseName}${suffix}${ext}`;
      candidateRelPath = baseParent ? `${baseParent}/${targetName}` : targetName;
      candidateFullPath = resolveVaultPath(candidateRelPath, vaultPath);
      if (!fsSync.existsSync(candidateFullPath)) {
        break;
      }
      counter++;
    }
    await fs.copyFile(fullSource, candidateFullPath);
  }

  return { success: true, path: candidateRelPath };
}

export async function movePath(
  sourceRelativePath: string,
  targetFolderRelativePath: string,
  vaultPath: string
): Promise<{ success: boolean; oldPath: string; newPath: string }> {
  const cleanSource = sanitizeRelativePath(sourceRelativePath);
  if (!cleanSource) throw new Error('Source path cannot be empty');

  const cleanTargetFolder = sanitizeRelativePath(targetFolderRelativePath);
  const fullSource = resolveVaultPath(cleanSource, vaultPath);

  if (!fsSync.existsSync(fullSource)) {
    throw new Error(`Source not found: ${cleanSource}`);
  }

  const fileName = path.basename(cleanSource);
  const newRelPath = cleanTargetFolder ? `${cleanTargetFolder}/${fileName}` : fileName;

  if (newRelPath === cleanSource) {
    return { success: true, oldPath: cleanSource, newPath: newRelPath };
  }

  const fullNew = resolveVaultPath(newRelPath, vaultPath);
  const targetParent = path.dirname(fullNew);
  await fs.mkdir(targetParent, { recursive: true });

  await fs.rename(fullSource, fullNew);
  return { success: true, oldPath: cleanSource, newPath: newRelPath };
}

/**
 * Ensures the configuration directory (.obsidian or .parma) exists.
 * If .obsidian exists, returns its path.
 * If not, checks for .parma; if missing, automatically creates .parma with default JSON files:
 *   - app.json ({ "legacyEditor": false })
 *   - appearance.json ({ "cssTheme": "", "theme": "obsidian", "accentColor": "" })
 *   - core-plugins.json (["file-explorer", "global-search", "bookmarks"])
 *   - workspace.json ({ "main": {} })
 *   - bookmarks.json ({ "items": [] })
 */
export async function ensureConfigDir(vaultPath: string): Promise<string> {
  if (!vaultPath) {
    throw new Error('Vault path is required');
  }

  const obsidianDir = path.join(vaultPath, '.obsidian');
  if (fsSync.existsSync(obsidianDir)) {
    return obsidianDir;
  }

  const parmaDir = path.join(vaultPath, '.parma');
  if (!fsSync.existsSync(parmaDir)) {
    await fs.mkdir(parmaDir, { recursive: true });

    const defaultFiles: Record<string, any> = {
      'app.json': { legacyEditor: false },
      'appearance.json': { cssTheme: '', theme: 'obsidian', accentColor: '' },
      'core-plugins.json': ['file-explorer', 'global-search', 'bookmarks'],
      'workspace.json': { main: {} },
      'bookmarks.json': { items: [] },
    };

    for (const [fileName, data] of Object.entries(defaultFiles)) {
      const filePath = path.join(parmaDir, fileName);
      if (!fsSync.existsSync(filePath)) {
        await atomicWriteFile(filePath, JSON.stringify(data, null, 2));
      }
    }
  }

  return parmaDir;
}

export async function getBookmarks(vaultPath: string): Promise<BookmarksData> {
  if (!vaultPath || !fsSync.existsSync(vaultPath)) {
    return { items: [] };
  }

  const obsidianDir = path.join(vaultPath, '.obsidian');
  let configDir: string;
  if (fsSync.existsSync(obsidianDir)) {
    configDir = obsidianDir;
  } else {
    configDir = await ensureConfigDir(vaultPath);
  }

  const bookmarksFile = path.join(configDir, 'bookmarks.json');
  if (!fsSync.existsSync(bookmarksFile)) {
    return { items: [] };
  }

  try {
    const raw = await fs.readFile(bookmarksFile, 'utf-8');
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.items)) {
      return data;
    }
    return { items: [] };
  } catch (err) {
    console.warn('Failed to read or parse bookmarks.json:', err);
    return { items: [] };
  }
}

export async function saveBookmarks(
  vaultPath: string,
  bookmarks: BookmarksData
): Promise<BookmarksData> {
  if (!vaultPath) {
    throw new Error('Vault path is required');
  }

  const obsidianDir = path.join(vaultPath, '.obsidian');
  let configDir: string;
  if (fsSync.existsSync(obsidianDir)) {
    configDir = obsidianDir;
  } else {
    configDir = await ensureConfigDir(vaultPath);
  }

  const bookmarksFile = path.join(configDir, 'bookmarks.json');
  const safeData: BookmarksData = {
    items: Array.isArray(bookmarks?.items) ? bookmarks.items : [],
  };

  await atomicWriteFile(bookmarksFile, JSON.stringify(safeData, null, 2));
  return safeData;
}

export function addOrUpdateBookmark(
  items: BookmarkItem[],
  newItem: BookmarkItem,
  groupTitle?: string
): BookmarkItem[] {
  if (groupTitle && groupTitle.trim()) {
    const cleanGroup = groupTitle.trim();
    let groupFound = false;

    const updated = items.map((item) => {
      if (item.type === 'group' && item.title?.toLowerCase() === cleanGroup.toLowerCase()) {
        groupFound = true;
        const currentSubs = Array.isArray(item.items) ? [...item.items] : [];
        const existingIdx = currentSubs.findIndex(
          (sub) =>
            (newItem.path && sub.path === newItem.path) ||
            (newItem.title && sub.title === newItem.title && sub.type === newItem.type)
        );
        if (existingIdx >= 0) {
          currentSubs[existingIdx] = { ...currentSubs[existingIdx], ...newItem };
        } else {
          currentSubs.push(newItem);
        }
        return { ...item, items: currentSubs };
      }
      return item;
    });

    if (!groupFound) {
      updated.push({
        type: 'group',
        title: cleanGroup,
        items: [newItem],
      });
    }
    return updated;
  }

  const result = [...items];
  const existingIdx = result.findIndex((item) => {
    if (newItem.type === 'group' && item.type === 'group') {
      return item.title?.toLowerCase() === newItem.title?.toLowerCase();
    }
    if (newItem.path && item.path) {
      return item.path === newItem.path;
    }
    if (newItem.title && item.title && item.type === newItem.type) {
      return item.title === newItem.title;
    }
    return false;
  });

  if (existingIdx >= 0) {
    result[existingIdx] = { ...result[existingIdx], ...newItem };
  } else {
    result.push(newItem);
  }

  return result;
}

export function removeBookmark(
  items: BookmarkItem[],
  filter: { path?: string; title?: string; type?: string; groupTitle?: string }
): BookmarkItem[] {
  const cleanPath = filter.path?.trim();
  const cleanTitle = filter.title?.trim();
  const cleanType = filter.type?.trim();
  const cleanGroup = filter.groupTitle?.trim();

  if (cleanGroup) {
    return items.map((item) => {
      if (item.type === 'group' && item.title?.toLowerCase() === cleanGroup.toLowerCase()) {
        const subItems = Array.isArray(item.items) ? item.items : [];
        const filteredSubs = subItems.filter((sub) => {
          if (cleanPath && sub.path === cleanPath) return false;
          if (cleanTitle && sub.title === cleanTitle) return false;
          return true;
        });
        return { ...item, items: filteredSubs };
      }
      return item;
    });
  }

  function filterList(list: BookmarkItem[]): BookmarkItem[] {
    const nextList: BookmarkItem[] = [];
    for (const item of list) {
      let shouldRemove = false;

      if (cleanType === 'group' && item.type === 'group') {
        if (cleanTitle && item.title?.toLowerCase() === cleanTitle.toLowerCase()) {
          shouldRemove = true;
        }
      } else if (cleanPath && item.path === cleanPath) {
        shouldRemove = true;
      } else if (cleanTitle && item.title === cleanTitle && (!cleanPath || !item.path)) {
        shouldRemove = true;
      }

      if (!shouldRemove) {
        if (item.type === 'group' && Array.isArray(item.items)) {
          nextList.push({
            ...item,
            items: filterList(item.items),
          });
        } else {
          nextList.push(item);
        }
      }
    }
    return nextList;
  }

  return filterList(items);
}



