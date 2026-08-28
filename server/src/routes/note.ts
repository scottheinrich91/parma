import { Hono } from 'hono';
import { readNote, writeNote, deleteFileOrFolder } from '../services/vault.js';
import { config } from '../config.js';

export function createNoteRouter(onNoteChanged: () => void) {
  const router = new Hono();

  router.get('/', async (c) => {
    const notePath = c.req.query('path');
    if (!notePath) {
      return c.json({ error: 'Missing required query parameter "path"' }, 400);
    }

    try {
      const note = await readNote(notePath, config.vaultPath);
      return c.json(note);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return c.json({ error: 'Note not found', path: notePath }, 404);
      }
      return c.json({ error: error.message || 'Failed to read note' }, 500);
    }
  });

  router.post('/', async (c) => {
    try {
      const body = await c.req.json<{ path: string; content: string; frontmatter?: Record<string, any> }>();
      if (!body.path || typeof body.content !== 'string') {
        return c.json({ error: 'Invalid payload. "path" and "content" are required' }, 400);
      }

      const result = await writeNote(body.path, body.content, config.vaultPath, body.frontmatter);
      onNoteChanged();
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message || 'Failed to save note' }, 500);
    }
  });

  router.put('/', async (c) => {
    try {
      const body = await c.req.json<{ path: string; content: string; frontmatter?: Record<string, any> }>();
      if (!body.path || typeof body.content !== 'string') {
        return c.json({ error: 'Invalid payload. "path" and "content" are required' }, 400);
      }

      const result = await writeNote(body.path, body.content, config.vaultPath, body.frontmatter);
      onNoteChanged();
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message || 'Failed to update note' }, 500);
    }
  });

  router.delete('/', async (c) => {
    const notePath = c.req.query('path');
    if (!notePath) {
      return c.json({ error: 'Missing required query parameter "path"' }, 400);
    }

    try {
      const result = await deleteFileOrFolder(notePath, config.vaultPath);
      onNoteChanged();
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message || 'Failed to delete item' }, 500);
    }
  });

  return router;
}
