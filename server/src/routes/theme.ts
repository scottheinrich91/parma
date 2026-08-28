import { Hono } from 'hono';
import { config } from '../config.js';
import { getVaultThemeConfig } from '../services/theme.js';

export const themeRouter = new Hono();

themeRouter.get('/', async (c) => {
  try {
    const themeConfig = await getVaultThemeConfig(config.vaultPath);
    return c.json(themeConfig);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to load vault theme configuration' }, 500);
  }
});
