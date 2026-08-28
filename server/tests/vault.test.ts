import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import { getDirectoryTree, readNote, writeNote, getAllNotePaths } from '../src/services/vault.js';
import { extractWikilinks, resolveWikilinkTarget } from '../src/utils/markdown.js';
import { sanitizeRelativePath, resolveVaultPath, isSafeMediaExtension } from '../src/utils/security.js';
import { VaultGraphService } from '../src/services/graph.js';
import { VaultSearchService } from '../src/services/search.js';
import { createApp } from '../src/app.js';
import { resolveDefaultVaultPath } from '../src/config.js';

const TEST_VAULT = resolveDefaultVaultPath();

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
});
