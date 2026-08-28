import { Hono } from 'hono';
import { getDirectoryTree } from '../services/vault.js';
import { config } from '../config.js';

export const treeRouter = new Hono();

treeRouter.get('/', async (c) => {
  try {
    const result = await getDirectoryTree(config.vaultPath);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to scan vault directory' }, 500);
  }
});
