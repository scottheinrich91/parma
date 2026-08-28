import { Hono } from 'hono';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { createDirectory, renamePath, duplicatePath, movePath } from '../services/vault.js';

const IGNORED_NAMES = new Set(['.git', '.obsidian', '.DS_Store', 'Thumbs.db', 'node_modules', '.tmp']);

export function createFsRouter(onNoteChanged?: () => void) {
  const router = new Hono();

  router.get('/browse', async (c) => {
    try {
      const rawPath = c.req.query('path') || '';
      const filter = c.req.query('filter') || 'all'; // 'all' | 'notes' | 'images' | 'folders'
      const scope = c.req.query('scope') || ''; // 'vault' or undefined/empty

      const normalizedVaultRoot = path.resolve(config.vaultPath);
      const isVaultScope = scope === 'vault';

      let targetDir = normalizedVaultRoot;
      if (rawPath) {
        if (path.isAbsolute(rawPath)) {
          targetDir = path.resolve(rawPath);
        } else {
          targetDir = path.resolve(normalizedVaultRoot, rawPath);
        }
      }

      // If scope=vault, clamp targetDir so it cannot traverse above or outside normalizedVaultRoot
      if (isVaultScope) {
        const rel = path.relative(normalizedVaultRoot, targetDir);
        if (rel.startsWith('..') || path.isAbsolute(rel)) {
          targetDir = normalizedVaultRoot;
        }
      }

      // Fallback if targetDir does not exist
      if (!fsSync.existsSync(targetDir)) {
        targetDir = isVaultScope ? normalizedVaultRoot : config.vaultPath;
      }

      const stat = await fs.stat(targetDir);
      if (!stat.isDirectory()) {
        targetDir = path.dirname(targetDir);
        if (isVaultScope) {
          const rel = path.relative(normalizedVaultRoot, targetDir);
          if (rel.startsWith('..') || path.isAbsolute(rel)) {
            targetDir = normalizedVaultRoot;
          }
        }
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
        const relFromVault = path.relative(normalizedVaultRoot, fullPath).replace(/\\/g, '/');
        if (!relFromVault.startsWith('..') && !path.isAbsolute(relFromVault)) {
          relPath = relFromVault;
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
      let parentPath: string | null = null;

      if (isVaultScope) {
        const isAtVaultRoot = path.resolve(targetDir) === normalizedVaultRoot;
        if (!isAtVaultRoot) {
          const relParent = path.relative(normalizedVaultRoot, parentDir);
          if (!relParent.startsWith('..') && !path.isAbsolute(relParent)) {
            parentPath = parentDir;
          } else if (path.resolve(parentDir) === normalizedVaultRoot) {
            parentPath = normalizedVaultRoot;
          }
        }
      } else {
        const hasParent = targetDir !== '/' && targetDir !== path.parse(targetDir).root && parentDir !== targetDir;
        if (hasParent) {
          parentPath = parentDir;
        }
      }

      const relTarget = path.relative(normalizedVaultRoot, targetDir).replace(/\\/g, '/');
      const isInsideVault = !relTarget.startsWith('..') && !path.isAbsolute(relTarget);

      return c.json({
        currentPath: targetDir,
        relativePath: isInsideVault ? relTarget : targetDir,
        parentPath: parentPath,
        entries: results,
        vaultRoot: normalizedVaultRoot,
      });
    } catch (error: any) {
      return c.json({ error: error.message || 'Failed to browse filesystem' }, 500);
    }
  });

  router.post('/folder', async (c) => {
    try {
      const body = await c.req.json<{ path?: string; folderPath?: string }>();
      const rawPath = body.folderPath || body.path;
      if (!rawPath || typeof rawPath !== 'string' || !rawPath.trim()) {
        return c.json({ error: 'Folder path is required' }, 400);
      }

      const result = await createDirectory(rawPath.trim(), config.vaultPath);
      if (onNoteChanged) {
        onNoteChanged();
      }
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message || 'Failed to create directory' }, 500);
    }
  });

  router.post('/rename', async (c) => {
    try {
      const body = await c.req.json<{
        oldPath?: string;
        newPath?: string;
        sourcePath?: string;
        targetPath?: string;
      }>();
      const oldPath = body.oldPath || body.sourcePath;
      const newPath = body.newPath || body.targetPath;

      if (!oldPath || !newPath) {
        return c.json({ error: 'Both "oldPath" and "newPath" are required' }, 400);
      }

      const result = await renamePath(oldPath, newPath, config.vaultPath);
      if (onNoteChanged) {
        onNoteChanged();
      }
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message || 'Failed to rename path' }, 500);
    }
  });

  router.post('/duplicate', async (c) => {
    try {
      const body = await c.req.json<{ path?: string; sourcePath?: string }>();
      const sourcePath = body.sourcePath || body.path;

      if (!sourcePath) {
        return c.json({ error: '"path" or "sourcePath" is required' }, 400);
      }

      const result = await duplicatePath(sourcePath, config.vaultPath);
      if (onNoteChanged) {
        onNoteChanged();
      }
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message || 'Failed to duplicate path' }, 500);
    }
  });

  router.post('/move', async (c) => {
    try {
      const body = await c.req.json<{
        sourcePath?: string;
        path?: string;
        targetFolder?: string;
        destination?: string;
      }>();
      const sourcePath = body.sourcePath || body.path;
      const targetFolder = body.targetFolder !== undefined ? body.targetFolder : body.destination;

      if (!sourcePath || targetFolder === undefined) {
        return c.json({ error: '"sourcePath" and "targetFolder" are required' }, 400);
      }

      const result = await movePath(sourcePath, targetFolder, config.vaultPath);
      if (onNoteChanged) {
        onNoteChanged();
      }
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message || 'Failed to move path' }, 500);
    }
  });

  return router;
}

export const fsRouter = createFsRouter();

