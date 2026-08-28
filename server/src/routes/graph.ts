import { Hono } from 'hono';
import { VaultGraphService } from '../services/graph.js';

export function createGraphRouter(graphService: VaultGraphService) {
  const router = new Hono();

  router.get('/graph', async (c) => {
    try {
      await graphService.ensureIndexed();
      const data = graphService.getGraphData();
      return c.json(data);
    } catch (error: any) {
      return c.json({ error: error.message || 'Failed to generate graph' }, 500);
    }
  });

  router.get('/backlinks', async (c) => {
    const notePath = c.req.query('path');
    if (!notePath) {
      return c.json({ error: 'Missing required query parameter "path"' }, 400);
    }

    try {
      await graphService.ensureIndexed();
      const backlinks = graphService.getBacklinks(notePath);
      return c.json({ path: notePath, backlinks });
    } catch (error: any) {
      return c.json({ error: error.message || 'Failed to retrieve backlinks' }, 500);
    }
  });

  return router;
}
