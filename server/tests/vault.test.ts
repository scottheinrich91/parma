import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import {
  getDirectoryTree,
  readNote,
  writeNote,
  getAllNotePaths,
  createDirectory,
  renamePath,
  duplicatePath,
  movePath,
} from '../src/services/vault.js';
import { extractWikilinks, resolveWikilinkTarget } from '../src/utils/markdown.js';
import { sanitizeRelativePath, resolveVaultPath, isSafeMediaExtension } from '../src/utils/security.js';
import { VaultGraphService } from '../src/services/graph.js';
import { VaultSearchService } from '../src/services/search.js';
import { createApp } from '../src/app.js';
import { config } from '../src/config.js';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_VAULT = path.resolve(__dirname, '../../vault');
process.env.VAULT_PATH = TEST_VAULT;
config.vaultPath = TEST_VAULT;

describe('Security Utilities', () => {
  it('sanitizes relative paths properly', () => {
    expect(sanitizeRelativePath('../../etc/passwd')).toBe('etc/passwd');
    expect(sanitizeRelativePath('Recipes/Pasta.md')).toBe('Recipes/Pasta.md');
    expect(sanitizeRelativePath('/leading/slash/path.md')).toBe('leading/slash/path.md');
  });

  it('rejects path traversal attacks in resolveVaultPath', () => {
    expect(() => resolveVaultPath('../../../etc/passwd', TEST_VAULT)).not.toThrow();
    // After sanitization, path remains strictly inside TEST_VAULT
    const resolved = resolveVaultPath('../../../etc/passwd', TEST_VAULT);
    expect(resolved.startsWith(TEST_VAULT)).toBe(true);
  });

  it('correctly whitelists safe media extensions', () => {
    expect(isSafeMediaExtension('image.png')).toBe(true);
    expect(isSafeMediaExtension('vector.svg')).toBe(true);
    expect(isSafeMediaExtension('clip.mp4')).toBe(true);
    expect(isSafeMediaExtension('document.pdf')).toBe(true);
    expect(isSafeMediaExtension('malicious.exe')).toBe(false);
    expect(isSafeMediaExtension('script.sh')).toBe(false);
  });
});

describe('Wikilink Parsing and Resolution', () => {
  it('extracts standard, aliased, and heading wikilinks', () => {
    const text = `
    Welcome to [[Index]] and check [[Recipes/Pasta|Artisanal Pasta]].
    Also see [[Concepts/Cooking#Gluten Development]].
    `;
    const links = extractWikilinks(text);
    expect(links).toHaveLength(3);
    expect(links[0].target).toBe('Index');
    expect(links[1].target).toBe('Recipes/Pasta');
    expect(links[1].alias).toBe('Artisanal Pasta');
    expect(links[2].target).toBe('Concepts/Cooking');
    expect(links[2].heading).toBe('Gluten Development');
  });

  it('resolves wikilinks with direct and basename matching', async () => {
    const allNotes = await getAllNotePaths(TEST_VAULT);
    
    // Direct match
    const res1 = resolveWikilinkTarget('Recipes/Pasta', 'Index.md', allNotes);
    expect(res1.exists).toBe(true);
    expect(res1.resolvedPath).toBe('Recipes/Pasta.md');

    // Basename match across folder
    const res2 = resolveWikilinkTarget('Cooking', 'Recipes/Pasta.md', allNotes);
    expect(res2.exists).toBe(true);
    expect(res2.resolvedPath).toBe('Concepts/Cooking.md');

    // Non-existent note match
    const res3 = resolveWikilinkTarget('NonExistentGuide', 'Index.md', allNotes);
    expect(res3.exists).toBe(false);
    expect(res3.resolvedPath).toBe('NonExistentGuide.md');
  });
});

describe('Vault Services', () => {
  it('scans directory tree recursively', async () => {
    const { tree } = await getDirectoryTree(TEST_VAULT);
    expect(tree.length).toBeGreaterThan(0);

    const hasIndex = tree.some((node) => node.name === 'Index.md' && node.type === 'file');
    expect(hasIndex).toBe(true);
  });

  it('reads markdown note and extracts title and frontmatter', async () => {
    const note = await readNote('Recipes/Pasta.md', TEST_VAULT);
    expect(note.title).toBe('Artisanal Fresh Pasta');
    expect(note.content).toContain('Tipo 00 flour');
    expect(note.frontmatter.tags).toContain('pasta');
    expect(note.stats.size).toBeGreaterThan(0);
  });

  it('atomically writes and updates a note', async () => {
    const testPath = 'Concepts/TestNote.md';
    const testContent = '# Test Note Title\n\nThis is a test note for atomic write verification.';

    const writeRes = await writeNote(testPath, testContent, TEST_VAULT);
    expect(writeRes.success).toBe(true);

    const readRes = await readNote(testPath, TEST_VAULT);
    expect(readRes.title).toBe('Test Note Title');
    expect(readRes.content).toContain('atomic write verification');

    // Cleanup
    const fullTestPath = resolveVaultPath(testPath, TEST_VAULT);
    await fs.unlink(fullTestPath);
  });

  it('creates directory and subdirectories in vault', async () => {
    const testFolder = 'TestFolder/SubFolder';
    const res = await createDirectory(testFolder, TEST_VAULT);
    expect(res.success).toBe(true);
    expect(res.path).toBe(testFolder);

    const fullFolder = resolveVaultPath(testFolder, TEST_VAULT);
    const stat = await fs.stat(fullFolder);
    expect(stat.isDirectory()).toBe(true);

    // Cleanup
    const topFolder = resolveVaultPath('TestFolder', TEST_VAULT);
    await fs.rm(topFolder, { recursive: true, force: true });
  });

  it('renames a note and folder safely', async () => {
    // 1. Rename a test note
    const srcNote = 'Concepts/RenameSource.md';
    const targetNote = 'Concepts/RenamedTarget.md';
    await writeNote(srcNote, '# Temp Rename Test', TEST_VAULT);

    const renameRes = await renamePath(srcNote, targetNote, TEST_VAULT);
    expect(renameRes.success).toBe(true);
    expect(renameRes.oldPath).toBe(srcNote);
    expect(renameRes.newPath).toBe(targetNote);

    const noteStat = await fs.stat(resolveVaultPath(targetNote, TEST_VAULT));
    expect(noteStat.isFile()).toBe(true);

    // 2. Rename a directory
    const srcFolder = 'RenameFolderSrc';
    const destFolder = 'RenameFolderDest';
    await createDirectory(srcFolder, TEST_VAULT);
    await writeNote(`${srcFolder}/NoteInside.md`, '# Sub Note', TEST_VAULT);

    const folderRenameRes = await renamePath(srcFolder, destFolder, TEST_VAULT);
    expect(folderRenameRes.success).toBe(true);
    const subNoteStat = await fs.stat(resolveVaultPath(`${destFolder}/NoteInside.md`, TEST_VAULT));
    expect(subNoteStat.isFile()).toBe(true);

    // Cleanup
    await fs.unlink(resolveVaultPath(targetNote, TEST_VAULT));
    await fs.rm(resolveVaultPath(destFolder, TEST_VAULT), { recursive: true, force: true });
  });

  it('duplicates files and folders with (copy) suffix', async () => {
    // 1. Duplicate file
    const srcNote = 'Concepts/DupSource.md';
    await writeNote(srcNote, '# Content to duplicate', TEST_VAULT);

    const dupRes1 = await duplicatePath(srcNote, TEST_VAULT);
    expect(dupRes1.success).toBe(true);
    expect(dupRes1.path).toBe('Concepts/DupSource (copy).md');

    // Duplicate again to verify counter increment
    const dupRes2 = await duplicatePath(srcNote, TEST_VAULT);
    expect(dupRes2.success).toBe(true);
    expect(dupRes2.path).toBe('Concepts/DupSource (copy 2).md');

    // 2. Duplicate directory
    const srcDir = 'DupDirSource';
    await createDirectory(srcDir, TEST_VAULT);
    await writeNote(`${srcDir}/Sub.md`, '# Sub File', TEST_VAULT);

    const dupDirRes = await duplicatePath(srcDir, TEST_VAULT);
    expect(dupDirRes.success).toBe(true);
    expect(dupDirRes.path).toBe('DupDirSource (copy)');

    // Cleanup
    await fs.unlink(resolveVaultPath(srcNote, TEST_VAULT));
    await fs.unlink(resolveVaultPath(dupRes1.path, TEST_VAULT));
    await fs.unlink(resolveVaultPath(dupRes2.path, TEST_VAULT));
    await fs.rm(resolveVaultPath(srcDir, TEST_VAULT), { recursive: true, force: true });
    await fs.rm(resolveVaultPath(dupDirRes.path, TEST_VAULT), { recursive: true, force: true });
  });

  it('moves files and folders to destination folder', async () => {
    const srcFile = 'MoveSource.md';
    const targetFolder = 'MoveTargetFolder';
    await writeNote(srcFile, '# Move Me', TEST_VAULT);
    await createDirectory(targetFolder, TEST_VAULT);

    const moveRes = await movePath(srcFile, targetFolder, TEST_VAULT);
    expect(moveRes.success).toBe(true);
    expect(moveRes.newPath).toBe('MoveTargetFolder/MoveSource.md');

    const movedStat = await fs.stat(resolveVaultPath('MoveTargetFolder/MoveSource.md', TEST_VAULT));
    expect(movedStat.isFile()).toBe(true);

    // Cleanup
    await fs.rm(resolveVaultPath(targetFolder, TEST_VAULT), { recursive: true, force: true });
  });
});

describe('Graph and Backlinks Index', () => {
  it('builds knowledge graph and finds backlinks', async () => {
    const graphService = new VaultGraphService(TEST_VAULT);
    await graphService.reindex();

    const graph = graphService.getGraphData();
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.links.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);

    // Index.md links to Recipes/Pasta.md, so Recipes/Pasta.md should have backlink from Index.md
    const backlinks = graphService.getBacklinks('Recipes/Pasta.md');
    expect(backlinks.length).toBeGreaterThan(0);
    expect(backlinks.some((b) => b.sourcePath.includes('Index.md'))).toBe(true);
  });
});

describe('Full-Text Search Service', () => {
  it('finds notes by title and content keyword', async () => {
    const searchService = new VaultSearchService(TEST_VAULT);
    
    const results = await searchService.search('Semolina');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain('Pasta');
    expect(results[0].snippet).toContain('semolina');
  });
});

describe('Hono API Endpoints', () => {
  it('returns directory tree from /api/tree', async () => {
    const { app } = createApp();
    const res = await app.request('/api/tree');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tree).toBeDefined();
  });

  it('reads note from /api/note and /api/notes', async () => {
    const { app } = createApp();
    const res = await app.request('/api/note?path=Index.md');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.title).toContain('Welcome to Parma');

    const resPlural = await app.request('/api/notes?path=Index.md');
    expect(resPlural.status).toBe(200);
  });

  it('returns graph data from /api/graph with nodes, links, and edges', async () => {
    const { app } = createApp();
    const res = await app.request('/api/graph');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.nodes).toBeDefined();
    expect(json.links).toBeDefined();
    expect(json.edges).toBeDefined();
  });

  it('performs full-text search from /api/search', async () => {
    const { app } = createApp();
    const res = await app.request('/api/search?q=Gluten');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results.length).toBeGreaterThan(0);
    expect(json.results[0].title).toBe('Fundamental Cooking Concepts');
  });

  it('creates directory via POST /api/fs/folder', async () => {
    const { app } = createApp();
    const folderToCreate = 'ApiCreatedFolder/ChildFolder';
    const res = await app.request('/api/fs/folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath: folderToCreate }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.path).toBe(folderToCreate);

    const fullFolder = resolveVaultPath(folderToCreate, TEST_VAULT);
    const stat = await fs.stat(fullFolder);
    expect(stat.isDirectory()).toBe(true);

    // Missing folderPath returns 400
    const errRes = await app.request('/api/fs/folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath: '' }),
    });
    expect(errRes.status).toBe(400);

    // Cleanup
    const topFolder = resolveVaultPath('ApiCreatedFolder', TEST_VAULT);
    await fs.rm(topFolder, { recursive: true, force: true });
  });

  it('browses filesystem with scope=vault and enforces containment', async () => {
    const { app } = createApp();

    // 1. Root vault browse with scope=vault
    const rootRes = await app.request('/api/fs/browse?scope=vault');
    expect(rootRes.status).toBe(200);
    const rootJson = await rootRes.json();
    expect(rootJson.parentPath).toBeNull();
    expect(rootJson.relativePath).toBe('');
    expect(rootJson.entries.length).toBeGreaterThan(0);

    // 2. Subfolder browse with scope=vault
    const subRes = await app.request('/api/fs/browse?scope=vault&path=Recipes');
    expect(subRes.status).toBe(200);
    const subJson = await subRes.json();
    expect(subJson.parentPath).toBe(TEST_VAULT);
    expect(subJson.relativePath).toBe('Recipes');
    expect(subJson.entries.some((e: any) => e.name === 'Pasta.md')).toBe(true);

    // 3. Traversal attempt above vault root with scope=vault (clamped to vault root)
    const traverseRes = await app.request('/api/fs/browse?scope=vault&path=../../etc');
    expect(traverseRes.status).toBe(200);
    const traverseJson = await traverseRes.json();
    expect(traverseJson.parentPath).toBeNull();
    expect(traverseJson.relativePath).toBe('');
    expect(traverseJson.currentPath).toBe(TEST_VAULT);

    // 4. Absolute path outside vault attempt with scope=vault (clamped to vault root)
    const absRes = await app.request('/api/fs/browse?scope=vault&path=/etc');
    expect(absRes.status).toBe(200);
    const absJson = await absRes.json();
    expect(absJson.parentPath).toBeNull();
    expect(absJson.relativePath).toBe('');
    expect(absJson.currentPath).toBe(TEST_VAULT);
  });

  it('renames file and folder via POST /api/fs/rename', async () => {
    const { app } = createApp();
    const src = 'ApiRenameSource.md';
    const dest = 'ApiRenameDest.md';
    await writeNote(src, '# Api Rename Test', TEST_VAULT);

    const res = await app.request('/api/fs/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPath: src, newPath: dest }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.oldPath).toBe(src);
    expect(json.newPath).toBe(dest);

    // Missing fields returns 400
    const errRes = await app.request('/api/fs/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPath: '' }),
    });
    expect(errRes.status).toBe(400);

    // Cleanup
    await fs.unlink(resolveVaultPath(dest, TEST_VAULT));
  });

  it('duplicates file and folder via POST /api/fs/duplicate', async () => {
    const { app } = createApp();
    const src = 'ApiDupSource.md';
    await writeNote(src, '# Api Dup Test', TEST_VAULT);

    const res = await app.request('/api/fs/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: src }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.path).toBe('ApiDupSource (copy).md');

    // Missing path returns 400
    const errRes = await app.request('/api/fs/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(errRes.status).toBe(400);

    // Cleanup
    await fs.unlink(resolveVaultPath(src, TEST_VAULT));
    await fs.unlink(resolveVaultPath(json.path, TEST_VAULT));
  });

  it('moves file and folder via POST /api/fs/move', async () => {
    const { app } = createApp();
    const src = 'ApiMoveSource.md';
    const folder = 'ApiMoveDestFolder';
    await writeNote(src, '# Api Move Test', TEST_VAULT);
    await createDirectory(folder, TEST_VAULT);

    const res = await app.request('/api/fs/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourcePath: src, targetFolder: folder }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.newPath).toBe(`${folder}/${src}`);

    // Missing params returns 400
    const errRes = await app.request('/api/fs/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourcePath: '' }),
    });
    expect(errRes.status).toBe(400);

    // Cleanup
    await fs.rm(resolveVaultPath(folder, TEST_VAULT), { recursive: true, force: true });
  });
});

