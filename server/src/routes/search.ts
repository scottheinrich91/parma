import { Hono } from 'hono';
import { VaultSearchService } from '../services/search.js';

export function createSearchRouter(searchService: VaultSearchService) {
  const router = new Hono();

  router.get('/', async (c) => {
    const query = c.req.query('q') || '';
    const matchCase = c.req.query('matchCase') === 'true' || c.req.query('case') === 'true';
    try {
      const results = await searchService.search(query, { matchCase });
      return c.json({ query, results });
    } catch (error: any) {
      return c.json({ error: error.message || 'Failed to perform search' }, 500);
    }
  });

  return router;
}
