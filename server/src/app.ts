import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'node:path';
import fs from 'node:fs';
import chokidar from 'chokidar';

import { config } from './config.js';
import { VaultGraphService } from './services/graph.js';
import { VaultSearchService } from './services/search.js';
import { treeRouter } from './routes/tree.js';
import { createNoteRouter } from './routes/note.js';
import { createUploadRouter } from './routes/upload.js';
import { mediaRouter } from './routes/media.js';
import { createGraphRouter } from './routes/graph.js';
import { createSearchRouter } from './routes/search.js';

export function createApp() {
  const app = new Hono();

  // Initialize services
  const graphService = new VaultGraphService(config.vaultPath);
  const searchService = new VaultSearchService(config.vaultPath);

  // Debounced reindex
  let reindexTimeout: NodeJS.Timeout | null = null;
  const triggerReindex = () => {
    if (reindexTimeout) clearTimeout(reindexTimeout);
    reindexTimeout = setTimeout(async () => {
      try {
        await graphService.reindex();
      } catch (err) {
        console.error('Error during auto-reindexing:', err);
      }
    }, 200);
  };

  // Setup file watcher
  try {
    if (fs.existsSync(config.vaultPath)) {
      const watcher = chokidar.watch(config.vaultPath, {
        ignored: /(^|[\/\\])\..+/, // ignore dotfiles
        persistent: true,
        ignoreInitial: true,
      });

      watcher.on('all', (event, filePath) => {
        if (filePath.endsWith('.md') || filePath.endsWith('.markdown')) {
          triggerReindex();
        }
      });
    }
  } catch (err) {
    console.warn('Failed to start vault file watcher:', err);
  }

  // Middlewares
  app.use('*', cors());

  // API Routes
  const noteRouter = createNoteRouter(triggerReindex);
  const uploadRouter = createUploadRouter(triggerReindex);

  app.route('/api/tree', treeRouter);
  app.route('/api/note', noteRouter);
  app.route('/api/notes', noteRouter);
  app.route('/api/upload', uploadRouter);
  app.route('/api/media', mediaRouter);

  const assetsRouter = new Hono();
  assetsRouter.post('/', async (c) => uploadRouter.fetch(c.req.raw));
  assetsRouter.get('/', async (c) => mediaRouter.fetch(c.req.raw));
  assetsRouter.get('/*', async (c) => mediaRouter.fetch(c.req.raw));
  app.route('/api/assets', assetsRouter);

  app.route('/api', createGraphRouter(graphService));
  app.route('/api/search', createSearchRouter(searchService));

  // Health check endpoint
  app.get('/api/health', (c) => {
    return c.json({
      status: 'healthy',
      vaultPath: config.vaultPath,
      timestamp: new Date().toISOString(),
    });
  });

  // Client static assets serving for production builds
  const clientDistCandidates = [
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(process.cwd(), 'dist/client'),
    path.resolve(process.cwd(), 'public'),
  ];

  const clientDist = clientDistCandidates.find((dir) => fs.existsSync(dir));

  if (clientDist) {
    console.log(`[Parma] Serving frontend static assets from: ${clientDist}`);
    
    // Serve static files
    app.use('/*', serveStatic({ root: path.relative(process.cwd(), clientDist) }));

    // SPA fallback to index.html for non-API routes
    app.get('*', (c) => {
      const indexPath = path.join(clientDist, 'index.html');
      if (fs.existsSync(indexPath)) {
        const html = fs.readFileSync(indexPath, 'utf-8');
        return c.html(html);
      }
      return c.text('Parma Wiki Backend Running', 200);
    });
  } else {
    app.get('/', (c) => {
      return c.json({
        message: 'Parma Wiki API Server is running. In development, run Vite client at http://localhost:5173',
        vaultPath: config.vaultPath,
      });
    });
  }

  return { app, graphService, searchService, triggerReindex };
}
