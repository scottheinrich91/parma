import { Hono } from 'hono';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { VaultGraphService } from '../services/graph.js';
import { VaultSearchService } from '../services/search.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createVaultsRouter(
  graphService: VaultGraphService,
  searchService: VaultSearchService,
  onVaultSwitch: (newPath: string) => void
) {
  const router = new Hono();

  // Known default presets
  const sampleCandidates = [
    path.resolve(process.cwd(), 'sample-vault'),
    path.resolve(process.cwd(), '../sample-vault'),
    path.resolve(__dirname, '../../sample-vault'),
    path.resolve(__dirname, '../../../sample-vault'),
  ];
  const sampleVault = sampleCandidates.find((dir) => fs.existsSync(dir)) || path.resolve(process.cwd(), 'sample-vault');

  router.get('/', (c) => {
    const personalVault = process.env.VAULT_PATH || '/vault';
    
    const vaults = [
      {
        id: 'personal',
        name: 'Personal Obsidian Vault',
        path: personalVault,
        exists: fs.existsSync(personalVault),
        description: 'Your live, primary Obsidian vault with daily notes, people, and homelab lore.'
      },
      {
        id: 'sample',
        name: 'Sample Sandbox Vault',
        path: sampleVault,
        exists: fs.existsSync(sampleVault),
        description: 'Safe demo sandbox with recipes, espresso guides, and appliances to test new features.'
      }
    ];

    // If active path is not one of presets, include it as custom
    if (!vaults.some((v) => path.resolve(v.path) === path.resolve(config.vaultPath))) {
      vaults.push({
        id: 'custom',
        name: 'Custom Folder',
        path: config.vaultPath,
        exists: fs.existsSync(config.vaultPath),
        description: 'User-specified directory'
      });
    }

    return c.json({
      active: config.vaultPath,
      activeName: vaults.find((v) => path.resolve(v.path) === path.resolve(config.vaultPath))?.name || path.basename(config.vaultPath),
      vaults,
    });
  });

  router.post('/switch', async (c) => {
    try {
      const body = await c.req.json();
      const targetPath = body.path ? path.resolve(body.path) : '';

      if (!targetPath) {
        return c.json({ error: 'Vault path is required' }, 400);
      }

      if (!fs.existsSync(targetPath)) {
        return c.json({ error: `Directory does not exist: ${targetPath}` }, 404);
      }

      const stat = fs.statSync(targetPath);
      if (!stat.isDirectory()) {
        return c.json({ error: `Path is not a directory: ${targetPath}` }, 400);
      }

      // Update active vault
      config.vaultPath = targetPath;
      graphService.setVaultPath(targetPath);
      searchService.setVaultPath(targetPath);
      
      onVaultSwitch(targetPath);

      return c.json({
        success: true,
        active: config.vaultPath,
        message: `Switched active vault to: ${targetPath}`
      });
    } catch (err: any) {
      return c.json({ error: err.message || 'Failed to switch vault' }, 500);
    }
  });

  return router;
}
