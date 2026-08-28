import { describe, it, expect, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApp } from '../src/app.js';
import { config } from '../src/config.js';
import { getVaultThemeConfig } from '../src/services/theme.js';
import { BUILT_IN_THEMES, resolveEffectiveTheme, ThemePreset, initEarlyTheme } from '../../client/src/themes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLE_VAULT = path.resolve(__dirname, '../../sample-vault');
const VAULT_WITHOUT_OBSIDIAN = path.resolve(__dirname, '../../vault');
const CLIENT_PUBLIC = path.resolve(__dirname, '../../client/public');

describe('Theme Service and /api/theme API Endpoint', () => {
  const originalVault = config.vaultPath;

  afterEach(() => {
    config.vaultPath = originalVault;
  });

  it('detects .obsidian appearance.json, theme, and snippets in sample-vault', async () => {
    const themeData = await getVaultThemeConfig(SAMPLE_VAULT);
    expect(themeData.hasObsidianConfig).toBe(true);
    expect(themeData.vaultThemeName).toBe('Minimal');
    expect(themeData.accentColor).toBe('#7c3aed');
    expect(themeData.baseTheme).toBe('obsidian');
    expect(themeData.themeCss).toContain('--background-primary: #111111');
    expect(themeData.snippetsCss).toContain('--callout-color: #f59e0b');
    expect(themeData.availableVaultThemes).toContain('Minimal');
    expect(themeData.enabledCssSnippets).toContain('custom-callouts');
  });

  it('returns graceful fallback when .obsidian is missing', async () => {
    const themeData = await getVaultThemeConfig(VAULT_WITHOUT_OBSIDIAN);
    expect(themeData.hasObsidianConfig).toBe(false);
    expect(themeData.vaultThemeName).toBeNull();
    expect(themeData.themeCss).toBe('');
    expect(themeData.snippetsCss).toBe('');
    expect(themeData.availableVaultThemes).toEqual([]);
  });

  it('serves theme configuration via GET /api/theme endpoint', async () => {
    config.vaultPath = SAMPLE_VAULT;
    const { app } = createApp();
    const res = await app.request('/api/theme');
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.hasObsidianConfig).toBe(true);
    expect(json.vaultThemeName).toBe('Minimal');
    expect(json.accentColor).toBe('#7c3aed');
    expect(json.themeCss).toContain('--background-primary');
    expect(json.snippetsCss).toContain('custom-callouts');
    expect(json.availableVaultThemes).toEqual(['Minimal']);
  });

  it('serves fallback via GET /api/theme when active vault has no .obsidian config', async () => {
    config.vaultPath = VAULT_WITHOUT_OBSIDIAN;
    const { app } = createApp();
    const res = await app.request('/api/theme');
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.hasObsidianConfig).toBe(false);
    expect(json.vaultThemeName).toBeNull();
    expect(json.themeCss).toBe('');
    expect(json.snippetsCss).toBe('');
  });

  it('handles theme.min.css if theme.css is not present', async () => {
    const tempThemeDir = path.join(SAMPLE_VAULT, '.obsidian', 'themes', 'MinifiedTheme');
    await fs.mkdir(tempThemeDir, { recursive: true });
    await fs.writeFile(path.join(tempThemeDir, 'theme.min.css'), 'body{--background-primary:#222222;}');

    const tempAppearancePath = path.join(SAMPLE_VAULT, '.obsidian', 'appearance.json');
    const originalAppearance = await fs.readFile(tempAppearancePath, 'utf-8');

    try {
      await fs.writeFile(
        tempAppearancePath,
        JSON.stringify({
          cssTheme: 'MinifiedTheme',
          accentColor: '#10b981',
          enabledCssSnippets: ['custom-callouts'],
        })
      );

      const themeData = await getVaultThemeConfig(SAMPLE_VAULT);
      expect(themeData.vaultThemeName).toBe('MinifiedTheme');
      expect(themeData.themeCss).toContain('#222222');
      expect(themeData.accentColor).toBe('#10b981');
      expect(themeData.availableVaultThemes).toContain('MinifiedTheme');
    } finally {
      await fs.writeFile(tempAppearancePath, originalAppearance);
      await fs.rm(tempThemeDir, { recursive: true, force: true });
    }
  });
});

describe('Parma Built-in Themes (8 Presets)', () => {
  const EXPECTED_THEME_IDS = [
    'parma-classic',
    'obsidian-minimal',
    'things',
    'anuppuccin',
    'obsidian-nord',
    'atom',
    'solarized',
    'cupertino',
  ];

  it('defines exactly the 8 specified built-in themes in order', () => {
    expect(BUILT_IN_THEMES).toHaveLength(8);
    const themeIds = BUILT_IN_THEMES.map((t) => t.id);
    expect(themeIds).toEqual(EXPECTED_THEME_IDS);
  });

  it('defines Parma Classic as the first/default preset', () => {
    const classic = BUILT_IN_THEMES[0];
    expect(classic.id).toBe('parma-classic');
    expect(classic.name).toBe('Parma Classic');
    expect(classic.author).toBe('Parma Default');
    expect(classic.previewImage).toBe('/theme_images/parma_classic.webp');
  });

  it('contains valid previewImage paths that exist on disk', () => {
    for (const preset of BUILT_IN_THEMES) {
      expect(preset.previewImage).toMatch(/^\/theme_images\/.+\.webp$/);
      const relativePath = preset.previewImage.replace(/^\//, '');
      const filePath = path.join(CLIENT_PUBLIC, relativePath);
      expect(fsSync.existsSync(filePath), `Missing preview image: ${filePath}`).toBe(true);
    }
  });

  it('contains valid repoUrl links for community themes', () => {
    const communityThemes = BUILT_IN_THEMES.filter((t) => t.id !== 'parma-classic');
    expect(communityThemes).toHaveLength(7);
    for (const preset of communityThemes) {
      expect(preset.repoUrl).toBeDefined();
      expect(preset.repoUrl).toMatch(/^https:\/\/github\.com\//);
    }
  });

  it('provides complete light and dark CSS variables for every theme', () => {
    const requiredCssVars = [
      '--background-primary',
      '--background-primary-alt',
      '--background-secondary',
      '--background-secondary-alt',
      '--background-modifier-border',
      '--background-modifier-form-field',
      '--text-normal',
      '--text-muted',
      '--text-faint',
      '--text-accent',
      '--text-accent-hover',
      '--interactive-accent',
      '--interactive-accent-hover',
      '--nav-item-background-active',
      '--nav-item-color-active',
      '--code-background',
      '--code-normal',
    ];

    for (const preset of BUILT_IN_THEMES) {
      // Swatch checks
      expect(preset.swatch.bg).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      expect(preset.swatch.surface).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      expect(preset.swatch.accent).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      expect(preset.swatch.text).toMatch(/^#[0-9a-fA-F]{3,8}$/);

      // Light variables
      for (const v of requiredCssVars) {
        expect(preset.lightVars[v], `${preset.id} missing light variable ${v}`).toBeDefined();
        expect(preset.lightVars[v].length).toBeGreaterThan(0);
      }

      // Dark variables
      for (const v of requiredCssVars) {
        expect(preset.darkVars[v], `${preset.id} missing dark variable ${v}`).toBeDefined();
        expect(preset.darkVars[v].length).toBeGreaterThan(0);
      }
    }
  });
});

describe('Theme Resolution and Default Fallback Logic', () => {
  it('resolves to user selection in localStorage over any default', () => {
    // User selected obsidian-nord
    expect(resolveEffectiveTheme('obsidian-nord', { hasObsidianConfig: true, availableVaultThemes: [] })).toBe('obsidian-nord');
    expect(resolveEffectiveTheme('obsidian-nord', { hasObsidianConfig: false, availableVaultThemes: [] })).toBe('obsidian-nord');
    expect(resolveEffectiveTheme('obsidian-nord', null)).toBe('obsidian-nord');

    // User explicitly selected vault
    expect(resolveEffectiveTheme('vault', { hasObsidianConfig: true, availableVaultThemes: [] })).toBe('vault');
  });

  it('defaults to "vault" when .obsidian folder exists in active vault without user override', () => {
    expect(resolveEffectiveTheme('', { hasObsidianConfig: true, availableVaultThemes: [] })).toBe('vault');
    expect(resolveEffectiveTheme(null, { hasObsidianConfig: true, availableVaultThemes: [] })).toBe('vault');
    expect(resolveEffectiveTheme('   ', { hasObsidianConfig: true, availableVaultThemes: [] })).toBe('vault');
  });

  it('defaults to "parma-classic" when no .obsidian config exists and no user selection', () => {
    expect(resolveEffectiveTheme('', { hasObsidianConfig: false, availableVaultThemes: [] })).toBe('parma-classic');
    expect(resolveEffectiveTheme(null, { hasObsidianConfig: false, availableVaultThemes: [] })).toBe('parma-classic');
    expect(resolveEffectiveTheme('', null)).toBe('parma-classic');
    expect(resolveEffectiveTheme(null, null)).toBe('parma-classic');
  });
});

describe('Early Theme Initialization (FOUC Prevention)', () => {
  it('exports initEarlyTheme function that runs safely in any environment', () => {
    expect(typeof initEarlyTheme).toBe('function');
    expect(() => initEarlyTheme()).not.toThrow();
  });
});

