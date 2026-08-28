import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load .env if available
try {
  const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(__dirname, '../../.env'),
  ];
  for (const envFile of envCandidates) {
    if (fs.existsSync(envFile)) {
      if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile(envFile);
      }
      break;
    }
  }
} catch {
  // Ignore env loading errors
}

export function resolveDefaultVaultPath(): string {
  const envPath = process.env.VAULT_DIR || process.env.VAULT_PATH;
  if (envPath) {
    return path.resolve(envPath);
  }

  // Check ./vault in cwd
  const cwdVault = path.resolve(process.cwd(), 'vault');
  if (fs.existsSync(cwdVault)) {
    return cwdVault;
  }

  // Check ../vault in cwd
  const parentVault = path.resolve(process.cwd(), '..', 'vault');
  if (fs.existsSync(parentVault)) {
    return parentVault;
  }

  // Check relative to this module directory (server/src or server/dist -> ../../vault)
  const relativeToModuleVault = path.resolve(__dirname, '../../vault');
  if (fs.existsSync(relativeToModuleVault)) {
    return relativeToModuleVault;
  }

  // Fallback to sample-vault if vault does not exist
  const cwdSample = path.resolve(process.cwd(), 'sample-vault');
  if (fs.existsSync(cwdSample)) {
    return cwdSample;
  }

  const parentSample = path.resolve(process.cwd(), '..', 'sample-vault');
  if (fs.existsSync(parentSample)) {
    return parentSample;
  }

  const relativeToModuleSample = path.resolve(__dirname, '../../sample-vault');
  if (fs.existsSync(relativeToModuleSample)) {
    return relativeToModuleSample;
  }

  // Default to ./vault
  return cwdVault;
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  vaultPath: resolveDefaultVaultPath(),
  nodeEnv: process.env.NODE_ENV || 'development',
};
