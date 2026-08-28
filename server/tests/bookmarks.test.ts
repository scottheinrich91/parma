import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  ensureConfigDir,
  getBookmarks,
  saveBookmarks,
  addOrUpdateBookmark,
  removeBookmark,
  BookmarkItem,
} from '../src/services/vault.js';
import { createApp } from '../src/app.js';
import { config } from '../src/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLE_VAULT = path.resolve(__dirname, '../../sample-vault');
const TEMP_VAULT = path.resolve(__dirname, '../../test-temp-vault');

describe('Bookmarks Storage & Configuration Fallback (.obsidian vs .parma)', () => {
  const originalVault = config.vaultPath;

  beforeEach(async () => {
    // Setup fresh temp vault without .obsidian or .parma
    if (fsSync.existsSync(TEMP_VAULT)) {
      await fs.rm(TEMP_VAULT, { recursive: true, force: true });
    }
    await fs.mkdir(TEMP_VAULT, { recursive: true });
    await fs.writeFile(path.join(TEMP_VAULT, 'TestNote.md'), '# Test Note\nHello world');
  });

  afterEach(async () => {
    config.vaultPath = originalVault;
    if (fsSync.existsSync(TEMP_VAULT)) {
      await fs.rm(TEMP_VAULT, { recursive: true, force: true });
    }
    // Clean up any temporary bookmarks in sample-vault if created
    const sampleBookmarks = path.join(SAMPLE_VAULT, '.obsidian', 'bookmarks.json');
    if (fsSync.existsSync(sampleBookmarks)) {
      await fs.unlink(sampleBookmarks).catch(() => {});
    }
  });

  it('uses existing .obsidian folder without creating .parma', async () => {
    const configDir = await ensureConfigDir(SAMPLE_VAULT);
    expect(configDir).toBe(path.join(SAMPLE_VAULT, '.obsidian'));
    expect(fsSync.existsSync(path.join(SAMPLE_VAULT, '.parma'))).toBe(false);

    // Save bookmarks to sample-vault
    const sampleItems: BookmarkItem[] = [
      { type: 'file', path: 'Home.md', title: 'Home Page' },
    ];
    await saveBookmarks(SAMPLE_VAULT, { items: sampleItems });

    const bookmarksObsidianPath = path.join(SAMPLE_VAULT, '.obsidian', 'bookmarks.json');
    expect(fsSync.existsSync(bookmarksObsidianPath)).toBe(true);

    const loaded = await getBookmarks(SAMPLE_VAULT);
    expect(loaded.items).toHaveLength(1);
    expect(loaded.items[0].path).toBe('Home.md');
  });

  it('automatically creates .parma directory with default JSON files when .obsidian is missing', async () => {
    expect(fsSync.existsSync(path.join(TEMP_VAULT, '.obsidian'))).toBe(false);
    expect(fsSync.existsSync(path.join(TEMP_VAULT, '.parma'))).toBe(false);

    const configDir = await ensureConfigDir(TEMP_VAULT);
    expect(configDir).toBe(path.join(TEMP_VAULT, '.parma'));
    expect(fsSync.existsSync(path.join(TEMP_VAULT, '.parma'))).toBe(true);

    // Verify all 5 required default JSON files exist and have valid structure
    const appJsonPath = path.join(TEMP_VAULT, '.parma', 'app.json');
    const appearanceJsonPath = path.join(TEMP_VAULT, '.parma', 'appearance.json');
    const corePluginsPath = path.join(TEMP_VAULT, '.parma', 'core-plugins.json');
    const workspaceJsonPath = path.join(TEMP_VAULT, '.parma', 'workspace.json');
    const bookmarksJsonPath = path.join(TEMP_VAULT, '.parma', 'bookmarks.json');

    expect(fsSync.existsSync(appJsonPath)).toBe(true);
    expect(fsSync.existsSync(appearanceJsonPath)).toBe(true);
    expect(fsSync.existsSync(corePluginsPath)).toBe(true);
    expect(fsSync.existsSync(workspaceJsonPath)).toBe(true);
    expect(fsSync.existsSync(bookmarksJsonPath)).toBe(true);

    const appJson = JSON.parse(await fs.readFile(appJsonPath, 'utf-8'));
    expect(appJson.legacyEditor).toBe(false);

    const appearanceJson = JSON.parse(await fs.readFile(appearanceJsonPath, 'utf-8'));
    expect(appearanceJson.theme).toBe('obsidian');

    const corePlugins = JSON.parse(await fs.readFile(corePluginsPath, 'utf-8'));
    expect(corePlugins).toEqual(['file-explorer', 'global-search', 'bookmarks']);

    const workspaceJson = JSON.parse(await fs.readFile(workspaceJsonPath, 'utf-8'));
    expect(workspaceJson.main).toBeDefined();

    const bookmarksJson = JSON.parse(await fs.readFile(bookmarksJsonPath, 'utf-8'));
    expect(bookmarksJson.items).toEqual([]);
  });

  it('correctly adds, updates, and removes bookmarks and groups', () => {
    let items: BookmarkItem[] = [];

    // Add note
    items = addOrUpdateBookmark(items, { type: 'file', path: 'Guide.md', title: 'User Guide' });
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('User Guide');

    // Update existing note title
    items = addOrUpdateBookmark(items, { type: 'file', path: 'Guide.md', title: 'Updated Guide' });
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Updated Guide');

    // Add into group (auto-creates group)
    items = addOrUpdateBookmark(
      items,
      { type: 'file', path: 'Recipes/Pasta.md', title: 'Fresh Pasta' },
      'Cooking'
    );
    expect(items).toHaveLength(2);
    const group = items.find((i) => i.type === 'group');
    expect(group).toBeDefined();
    expect(group?.title).toBe('Cooking');
    expect(group?.items).toHaveLength(1);
    expect(group?.items?.[0].path).toBe('Recipes/Pasta.md');

    // Remove nested bookmark
    items = removeBookmark(items, { path: 'Recipes/Pasta.md' });
    const groupAfter = items.find((i) => i.type === 'group');
    expect(groupAfter?.items).toHaveLength(0);

    // Remove group
    items = removeBookmark(items, { title: 'Cooking', type: 'group' });
    expect(items.some((i) => i.title === 'Cooking')).toBe(false);
  });
});

describe('Bookmarks API Endpoints (/api/bookmarks)', () => {
  const originalVault = config.vaultPath;

  beforeEach(async () => {
    if (fsSync.existsSync(TEMP_VAULT)) {
      await fs.rm(TEMP_VAULT, { recursive: true, force: true });
    }
    await fs.mkdir(TEMP_VAULT, { recursive: true });
    config.vaultPath = TEMP_VAULT;
  });

  afterEach(async () => {
    config.vaultPath = originalVault;
    if (fsSync.existsSync(TEMP_VAULT)) {
      await fs.rm(TEMP_VAULT, { recursive: true, force: true });
    }
  });

  it('serves GET /api/bookmarks with default empty items', async () => {
    const { app } = createApp();
    const res = await app.request('/api/bookmarks');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toBeDefined();
    expect(Array.isArray(json.items)).toBe(true);
  });

  it('handles POST /api/bookmarks to add bookmark and saves to disk', async () => {
    const { app } = createApp();

    const postRes = await app.request('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'Notes/Test.md',
        title: 'Test Bookmark',
      }),
    });

    expect(postRes.status).toBe(200);
    const postJson = await postRes.json();
    expect(postJson.success).toBe(true);
    expect(postJson.items).toHaveLength(1);
    expect(postJson.items[0].path).toBe('Notes/Test.md');

    // Verify GET returns saved bookmark
    const getRes = await app.request('/api/bookmarks');
    const getJson = await getRes.json();
    expect(getJson.items).toHaveLength(1);
    expect(getJson.items[0].title).toBe('Test Bookmark');
  });

  it('handles POST /api/bookmarks with groupTitle to nest bookmarks', async () => {
    const { app } = createApp();

    await app.request('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'Recipes/Pizza.md',
        title: 'Neapolitan Pizza',
        groupTitle: 'Favorites',
      }),
    });

    const getRes = await app.request('/api/bookmarks');
    const getJson = await getRes.json();
    expect(getJson.items).toHaveLength(1);
    expect(getJson.items[0].type).toBe('group');
    expect(getJson.items[0].title).toBe('Favorites');
    expect(getJson.items[0].items).toHaveLength(1);
    expect(getJson.items[0].items[0].path).toBe('Recipes/Pizza.md');
  });

  it('handles DELETE /api/bookmarks to remove a bookmark', async () => {
    const { app } = createApp();

    // Add two bookmarks
    await app.request('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'Note1.md', title: 'Note 1' }),
    });
    await app.request('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'Note2.md', title: 'Note 2' }),
    });

    // Delete Note1.md
    const delRes = await app.request('/api/bookmarks?path=Note1.md', {
      method: 'DELETE',
    });
    expect(delRes.status).toBe(200);
    const delJson = await delRes.json();
    expect(delJson.success).toBe(true);
    expect(delJson.items).toHaveLength(1);
    expect(delJson.items[0].path).toBe('Note2.md');
  });
});
