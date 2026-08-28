import { Hono } from 'hono';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

export const fsRouter = new Hono();

const IGNORED_NAMES = new Set(['.git', '.obsidian', '.DS_Store', 'Thumbs.db', 'node_modules', '.tmp']);

fsRouter.get('/browse', async (c) => {
  try {
    const rawPath = c.req.query('path') || '';
    const filter = c.req.query('filter') || 'all'; // 'all' | 'notes' | 'images' | 'folders'

    let targetDir = config.vaultPath;
    if (rawPath) {
      if (path.isAbsolute(rawPath)) {
        targetDir = rawPath;
      } else {
        targetDir = path.resolve(config.vaultPath, rawPath);
      }
    }

    // Fallback if targetDir does not exist
    if (!fsSync.existsSync(targetDir)) {
      targetDir = config.vaultPath;
    }

    const stat = await fs.stat(targetDir);
    if (!stat.isDirectory()) {
      targetDir = path.dirname(targetDir);
    }

    const entries = await fs.readdir(targetDir, { withFileTypes: true });
    const results: Array<{
      name: string;
      path: string;
      relativePath: string;
      isDirectory: boolean;
      extension: string;
      size: number;
    }> = [];

    for (const entry of entries) {
      if (IGNORED_NAMES.has(entry.name) || entry.name.startsWith('.tmp.')) continue;
      const fullPath = path.join(targetDir, entry.name);
      const isDirectory = entry.isDirectory();
      const ext = path.extname(entry.name).toLowerCase();

      // Compute path relative to vaultPath if inside it, else fullPath
      let relPath = fullPath;
      if (fullPath.startsWith(config.vaultPath)) {
        relPath = path.relative(config.vaultPath, fullPath).replace(/\\/g, '/');
      }

      if (isDirectory) {
        results.push({
          name: entry.name,
          path: fullPath,
          relativePath: relPath,
          isDirectory: true,
          extension: '',
          size: 0,
        });
      } else {
        if (filter === 'folders') continue;
        if (filter === 'notes' && ext !== '.md' && ext !== '.markdown') continue;
        if (filter === 'images' && !['.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico', '.gif'].includes(ext)) continue;

        try {
          const fileStat = await fs.stat(fullPath);
          results.push({
            name: entry.name,
            path: fullPath,
            relativePath: relPath,
            isDirectory: false,
            extension: ext,
            size: fileStat.size,
          });
        } catch {
          // Ignore
        }
      }
    }

    // Sort folders first, then alphabetical
    results.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    const parentDir = path.dirname(targetDir);
    const hasParent = targetDir !== '/' && targetDir !== path.parse(targetDir).root && parentDir !== targetDir;

    return c.json({
      currentPath: targetDir,
      relativePath: targetDir.startsWith(config.vaultPath) ? path.relative(config.vaultPath, targetDir).replace(/\\/g, '/') : targetDir,
      parentPath: hasParent ? parentDir : null,
      entries: results,
      vaultRoot: config.vaultPath,
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to browse filesystem' }, 500);
  }
});
