import { Hono } from 'hono';
import path from 'node:path';
import { config } from '../config.js';
import { resolveVaultPath, isSafeMediaExtension, sanitizeRelativePath } from '../utils/security.js';
import { atomicWriteFile } from '../utils/atomic.js';

export function createUploadRouter(onNoteChanged: () => void) {
  const router = new Hono();

  router.post('/', async (c) => {
    try {
      const body = await c.req.parseBody();
      const file = body['file'];
      const notePath = typeof body['notePath'] === 'string' ? body['notePath'] : '';
      const customName = typeof body['customName'] === 'string' ? body['customName'].trim() : '';
      const caption = typeof body['caption'] === 'string' ? body['caption'].trim() : '';

      if (!file || typeof file === 'string') {
        return c.json({ error: 'No valid file attached in form data' }, 400);
      }

      const originalName = file.name || 'image.png';
      let targetFileName = customName ? customName : originalName;
      
      // Ensure file has an extension matching original if omitted
      if (!path.extname(targetFileName)) {
        targetFileName += path.extname(originalName) || '.png';
      }

      if (!isSafeMediaExtension(targetFileName)) {
        return c.json({ error: 'Invalid file extension. Only safe media formats are supported.' }, 400);
      }

      // Determine enclosing folder of notePath
      const enclosingFolder = notePath ? path.dirname(sanitizeRelativePath(notePath)) : '';
      const relativeDestPath = path.join(enclosingFolder === '.' ? '' : enclosingFolder, targetFileName).replace(/\\/g, '/');
      const absoluteDestPath = resolveVaultPath(relativeDestPath, config.vaultPath);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await atomicWriteFile(absoluteDestPath, buffer);
      onNoteChanged();

      const mediaUrl = `/api/media?path=${encodeURIComponent(relativeDestPath)}`;
      const altText = caption || path.basename(targetFileName, path.extname(targetFileName));
      
      const markdownSnippet = caption
        ? `<figure>\n  <img src="./${targetFileName}" alt="${altText}" />\n  <figcaption>${caption}</figcaption>\n</figure>`
        : `![${altText}](./${targetFileName})`;

      return c.json({
        success: true,
        filename: targetFileName,
        relativePath: relativeDestPath,
        mediaUrl,
        caption,
        markdownSnippet,
      });
    } catch (error: any) {
      return c.json({ error: error.message || 'Failed to upload image asset' }, 500);
    }
  });

  return router;
}
