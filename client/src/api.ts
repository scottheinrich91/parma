import { VaultNode, NoteData, GraphData, BacklinkItem, SearchResult, UploadResponse } from './types';

const API_BASE = '/api';

export async function fetchVaultTree(): Promise<{ root: string; tree: VaultNode[] }> {
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

export async function saveNote(path: string, content: string, frontmatter?: Record<string, any>): Promise<{ success: boolean; path: string }> {
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

export async function searchNotes(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  const data = await res.json();
  return data.results || [];
}
