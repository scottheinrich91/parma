import { Hono } from 'hono';
import { Readable } from 'node:stream';
import { getMediaFile } from '../services/media.js';
import { config } from '../config.js';

export const mediaRouter = new Hono();

async function handleMediaRequest(c: any, mediaPath: string) {
  if (!mediaPath) {
    return c.json({ error: 'Missing required media path' }, 400);
  }

  try {
    const file = await getMediaFile(mediaPath, config.vaultPath);

    // If-None-Match check for 304 Not Modified
    const clientEtag = c.req.header('if-none-match');
    if (clientEtag && clientEtag === file.etag) {
      return c.body(null, 304);
    }

    c.header('Content-Type', file.contentType);
    c.header('Content-Length', file.contentLength.toString());
    c.header('ETag', file.etag);
    c.header('Last-Modified', file.lastModified);
    c.header('Cache-Control', 'public, max-age=3600');

    // Convert node ReadStream to web ReadableStream
    const webStream = Readable.toWeb(file.stream);
    return c.body(webStream);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return c.json({ error: 'Media file not found' }, 404);
    }
    return c.json({ error: error.message || 'Failed to serve media' }, 400);
  }
}

// Support GET /api/media?path=... or /api/assets?path=...
mediaRouter.get('/', async (c) => {
  const queryPath = c.req.query('path') || '';
  return handleMediaRequest(c, queryPath);
});

// Support GET /api/media/path/to/asset.png or /api/assets/path/to/asset.png
mediaRouter.get('/*', async (c) => {
  // Extract path following /api/media/ or /api/assets/
  const rawPath = c.req.path.replace(/^\/api\/(media|assets)\/?/, '');
  return handleMediaRequest(c, rawPath);
});
