import {
  VaultNode,
  NoteData,
  GraphData,
  BacklinkItem,
  SearchResult,
  UploadResponse,
  BookmarkItem,
  BookmarksResponse,
  BookmarkType,
} from './types';

const API_BASE = '/api';

export async function fetchVaultTree(): Promise<{ root: string; vaultPath?: string; tree: VaultNode[] }> {
  const res = await fetch(`${API_BASE}/tree`);
  if (!res.ok) throw new Error('Failed to load vault tree');
  return res.json();
}

export async function fetchNote(path: string): Promise<NoteData> {
  const res = await fetch(`${API_BASE}/note?path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load note');
  }
  return res.json();
}

export async function saveNote(
  path: string,
  content: string,
  frontmatter?: Record<string, any>
): Promise<{ success: boolean; path: string }> {
  const res = await fetch(`${API_BASE}/note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content, frontmatter }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to save note');
  }
  return res.json();
}

export async function deleteItem(path: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/note?path=${encodeURIComponent(path)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete item');
  return res.json();
}

export async function uploadImage(
  file: File,
  notePath: string,
  customName?: string,
  caption?: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('notePath', notePath);
  if (customName) formData.append('customName', customName);
  if (caption) formData.append('caption', caption);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to upload image');
  }
  return res.json();
}

export async function fetchGraph(): Promise<GraphData> {
  const res = await fetch(`${API_BASE}/graph`);
  if (!res.ok) throw new Error('Failed to load knowledge graph');
  return res.json();
}

export async function fetchBacklinks(path: string): Promise<BacklinkItem[]> {
  const res = await fetch(`${API_BASE}/backlinks?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error('Failed to load backlinks');
  const data = await res.json();
  return data.backlinks || [];
}

export async function searchNotes(query: string, matchCase: boolean = false): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({ q: query });
  if (matchCase) params.set('matchCase', 'true');
  const res = await fetch(`${API_BASE}/search?${params.toString()}`);
  if (!res.ok) throw new Error('Search failed');
  const data = await res.json();
  return data.results || [];
}

export interface VaultOption {
  id: string;
  name: string;
  path: string;
  exists: boolean;
  description: string;
}

export async function fetchVaults(): Promise<{ active: string; activeName: string; vaults: VaultOption[] }> {
  const res = await fetch(`${API_BASE}/vaults`);
  if (!res.ok) throw new Error('Failed to load vaults list');
  return res.json();
}

export async function switchVault(targetPath: string): Promise<{ success: boolean; active: string }> {
  const res = await fetch(`${API_BASE}/vaults/switch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: targetPath }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to switch vault');
  }
  return res.json();
}

export interface FsEntry {
  name: string;
  path: string;
  relativePath: string;
  isDirectory: boolean;
  extension: string;
  size: number;
}

export interface FsBrowseResult {
  currentPath: string;
  relativePath: string;
  parentPath: string | null;
  entries: FsEntry[];
  vaultRoot: string;
}

export async function browseFilesystem(
  path: string = '',
  filter: 'all' | 'notes' | 'images' | 'folders' = 'all',
  scope?: string
): Promise<FsBrowseResult> {
  const params = new URLSearchParams();
  if (path) params.set('path', path);
  if (filter !== 'all') params.set('filter', filter);
  if (scope) params.set('scope', scope);
  const res = await fetch(`${API_BASE}/fs/browse?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to browse directory');
  return res.json();
}

export async function createFolder(folderPath: string): Promise<{ success: boolean; path: string }> {
  const res = await fetch(`${API_BASE}/fs/folder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderPath, path: folderPath }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create folder');
  }
  return res.json();
}

export async function renamePath(
  oldPath: string,
  newPath: string
): Promise<{ success: boolean; oldPath: string; newPath: string }> {
  const res = await fetch(`${API_BASE}/fs/rename`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPath, newPath }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to rename path');
  }
  return res.json();
}

export async function duplicatePath(
  sourcePath: string
): Promise<{ success: boolean; path: string }> {
  const res = await fetch(`${API_BASE}/fs/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: sourcePath }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to duplicate path');
  }
  return res.json();
}

export async function movePath(
  sourcePath: string,
  targetFolder: string
): Promise<{ success: boolean; oldPath: string; newPath: string }> {
  const res = await fetch(`${API_BASE}/fs/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourcePath, targetFolder }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to move path');
  }
  return res.json();
}

export interface VaultThemeResponse {
  hasObsidianConfig: boolean;
  vaultThemeName?: string | null;
  baseTheme?: string | null;
  accentColor?: string | null;
  themeCss?: string;
  snippetsCss?: string;
  availableVaultThemes: string[];
  enabledCssSnippets?: string[];
}

export async function fetchThemeConfig(): Promise<VaultThemeResponse> {
  const res = await fetch(`${API_BASE}/theme`);
  if (!res.ok) throw new Error('Failed to load theme configuration');
  return res.json();
}

// Bookmarks API
export async function fetchBookmarks(): Promise<BookmarksResponse> {
  const res = await fetch(`${API_BASE}/bookmarks`);
  if (!res.ok) throw new Error('Failed to load bookmarks');
  return res.json();
}

export async function saveBookmarkItem(payload: {
  path?: string;
  title?: string;
  type?: BookmarkType;
  groupTitle?: string;
  query?: string;
  url?: string;
  items?: BookmarkItem[];
}): Promise<{ success: boolean; items: BookmarkItem[]; item?: BookmarkItem }> {
  const res = await fetch(`${API_BASE}/bookmarks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save bookmark');
  return res.json();
}

export async function saveAllBookmarks(
  items: BookmarkItem[]
): Promise<{ success: boolean; items: BookmarkItem[] }> {
  const res = await fetch(`${API_BASE}/bookmarks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error('Failed to save bookmarks');
  return res.json();
}

export async function deleteBookmark(params: {
  path?: string;
  title?: string;
  type?: string;
  groupTitle?: string;
}): Promise<{ success: boolean; items: BookmarkItem[] }> {
  const query = new URLSearchParams();
  if (params.path) query.set('path', params.path);
  if (params.title) query.set('title', params.title);
  if (params.type) query.set('type', params.type);
  if (params.groupTitle) query.set('groupTitle', params.groupTitle);

  const res = await fetch(`${API_BASE}/bookmarks?${query.toString()}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete bookmark');
  return res.json();
}
