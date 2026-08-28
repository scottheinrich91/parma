import { Hono } from 'hono';
import {
  getBookmarks,
  saveBookmarks,
  addOrUpdateBookmark,
  removeBookmark,
  BookmarkItem,
} from '../services/vault.js';
import { config } from '../config.js';

export const bookmarksRouter = new Hono();

// GET /api/bookmarks
bookmarksRouter.get('/', async (c) => {
  try {
    const data = await getBookmarks(config.vaultPath);
    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get bookmarks' }, 500);
  }
});

// POST /api/bookmarks
bookmarksRouter.post('/', async (c) => {
  try {
    let body: any = {};
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON payload' }, 400);
    }

    // Bulk replace if full items array provided
    if (body && Array.isArray(body.items)) {
      const saved = await saveBookmarks(config.vaultPath, { items: body.items });
      return c.json({ success: true, items: saved.items });
    }

    // Single item add / update
    const current = await getBookmarks(config.vaultPath);
    const itemData: BookmarkItem = body.item || {
      type: body.type || (body.path ? 'file' : 'group'),
      title: body.title,
      path: body.path,
      query: body.query,
      url: body.url,
      ctime: body.ctime || Date.now(),
      items: body.items || (body.type === 'group' ? [] : undefined),
    };

    if (itemData.type === 'group' && !itemData.items) {
      itemData.items = [];
    }

    const targetGroup = body.groupTitle || body.group;
    const updatedItems = addOrUpdateBookmark(current.items, itemData, targetGroup);
    const saved = await saveBookmarks(config.vaultPath, { items: updatedItems });

    return c.json({ success: true, items: saved.items, item: itemData });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to save bookmark' }, 500);
  }
});

// DELETE /api/bookmarks
bookmarksRouter.delete('/', async (c) => {
  try {
    const pathParam = c.req.query('path');
    const titleParam = c.req.query('title');
    const typeParam = c.req.query('type');
    const groupTitleParam = c.req.query('groupTitle') || c.req.query('group');

    let body: any = {};
    try {
      body = await c.req.json();
    } catch {
      // Body is optional for DELETE
    }

    const filter = {
      path: pathParam || body?.path,
      title: titleParam || body?.title,
      type: typeParam || body?.type,
      groupTitle: groupTitleParam || body?.groupTitle || body?.group,
    };

    if (!filter.path && !filter.title) {
      return c.json({ error: 'Missing "path" or "title" parameter to delete bookmark' }, 400);
    }

    const current = await getBookmarks(config.vaultPath);
    const updatedItems = removeBookmark(current.items, filter);
    const saved = await saveBookmarks(config.vaultPath, { items: updatedItems });

    return c.json({ success: true, items: saved.items });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to delete bookmark' }, 500);
  }
});
