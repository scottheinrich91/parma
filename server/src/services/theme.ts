import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

export interface VaultThemeData {
  hasObsidianConfig: boolean;
  vaultThemeName: string | null;
  baseTheme: string | null;
  accentColor: string | null;
  themeCss: string;
  snippetsCss: string;
  availableVaultThemes: string[];
  enabledCssSnippets: string[];
}

export async function getVaultThemeConfig(vaultPath: string): Promise<VaultThemeData> {
  const result: VaultThemeData = {
    hasObsidianConfig: false,
    vaultThemeName: null,
    baseTheme: null,
    accentColor: null,
    themeCss: '',
    snippetsCss: '',
    availableVaultThemes: [],
    enabledCssSnippets: [],
  };

  if (!vaultPath || !fsSync.existsSync(vaultPath)) {
    return result;
  }

  const obsidianDir = path.join(vaultPath, '.obsidian');
  if (!fsSync.existsSync(obsidianDir)) {
    return result;
  }

  // 1. Scan available installed themes in .obsidian/themes
  const themesDir = path.join(obsidianDir, 'themes');
  if (fsSync.existsSync(themesDir)) {
    try {
      const themeEntries = await fs.readdir(themesDir, { withFileTypes: true });
      for (const entry of themeEntries) {
        if (entry.isDirectory()) {
          result.availableVaultThemes.push(entry.name);
        }
      }
      result.availableVaultThemes.sort((a, b) => a.localeCompare(b));
    } catch (err) {
      console.warn('Error reading .obsidian/themes directory:', err);
    }
  }

  // 2. Read appearance.json
  const appearancePath = path.join(obsidianDir, 'appearance.json');
  if (!fsSync.existsSync(appearancePath)) {
    return result;
  }

  try {
    const rawAppearance = await fs.readFile(appearancePath, 'utf-8');
    const appearance = JSON.parse(rawAppearance);

    result.hasObsidianConfig = true;
    result.vaultThemeName = appearance.cssTheme || null;
    result.baseTheme = appearance.theme || null;
    result.accentColor = appearance.accentColor || null;
    result.enabledCssSnippets = Array.isArray(appearance.enabledCssSnippets)
      ? appearance.enabledCssSnippets
      : [];

    // 3. If cssTheme is set, read theme.css (or theme.min.css)
    if (result.vaultThemeName) {
      const themeFolder = path.join(themesDir, result.vaultThemeName);
      const candidates = [
        path.join(themeFolder, 'theme.css'),
        path.join(themeFolder, 'theme.min.css'),
      ];

      for (const candidate of candidates) {
        if (fsSync.existsSync(candidate)) {
          result.themeCss = await fs.readFile(candidate, 'utf-8');
          break;
        }
      }
    }

    // 4. Read enabled CSS snippets
    if (result.enabledCssSnippets.length > 0) {
      const snippetsDir = path.join(obsidianDir, 'snippets');
      if (fsSync.existsSync(snippetsDir)) {
        const loadedSnippets: string[] = [];
        for (const snippetName of result.enabledCssSnippets) {
          const fileName = snippetName.endsWith('.css') ? snippetName : `${snippetName}.css`;
          const snippetPath = path.join(snippetsDir, fileName);
          if (fsSync.existsSync(snippetPath)) {
            try {
              const snippetContent = await fs.readFile(snippetPath, 'utf-8');
              loadedSnippets.push(`/* Snippet: ${snippetName} */\n${snippetContent}`);
            } catch (snippetErr) {
              console.warn(`Failed to read snippet ${snippetName}:`, snippetErr);
            }
          }
        }
        result.snippetsCss = loadedSnippets.join('\n\n');
      }
    }
  } catch (err) {
    console.warn('Error reading or parsing .obsidian/appearance.json:', err);
  }

  return result;
}
