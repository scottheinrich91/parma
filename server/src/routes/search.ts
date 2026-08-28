import { Hono } from 'hono';
import { VaultSearchService } from '../services/search.js';

export function createSearchRouter(searchService: VaultSearchService) {
  const router = new Hono();

  router.get('/', async (c) => {
    const query = c.req.query('q') || '';
    try {
      const results = await searchService.search(query);
      return c.json({ query, results });
    } catch (error: any) {
      return c.json({ error: error.message || 'Failed to perform search' }, 500);
    }
  });

  return router;
}
