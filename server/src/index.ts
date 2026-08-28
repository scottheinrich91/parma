import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { config } from './config.js';

const { app, triggerReindex } = createApp();

// Initial graph indexing
triggerReindex();

console.log(`[Parma] Initializing server on port ${config.port}...`);
console.log(`[Parma] Active Vault Directory: ${config.vaultPath}`);

serve({
  fetch: app.fetch,
  port: config.port,
}, (info) => {
  console.log(`[Parma] Server is running at http://localhost:${info.port}`);
});
