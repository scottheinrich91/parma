import { VaultThemeResponse } from './api';

export const PARMA_SELECTED_THEME_KEY = 'parma_selected_theme';
export const PARMA_CUSTOM_CSS_KEY = 'parma_custom_css';
export const PARMA_THEME_EVENT = 'parma_theme_changed';

export interface ThemePreset {
  id: string;
  name: string;
  author: string;
  repoUrl?: string;
  previewImage: string;
  description: string;
  isDarkFirst?: boolean;
  swatch: {
    bg: string;
    surface: string;
    accent: string;
    text: string;
  };
  lightVars: Record<string, string>;
  darkVars: Record<string, string>;
}

export const BUILT_IN_THEMES: ThemePreset[] = [
  {
    id: 'parma-classic',
    name: 'Parma Classic',
    author: 'Parma Default',
    previewImage: '/theme_images/parma_classic.webp',
    description: 'Editorial slate architecture with balanced typography and sharp royal blue accents.',
    isDarkFirst: false,
    swatch: {
      bg: '#0f172a',
      surface: '#1e293b',
      accent: '#3b82f6',
      text: '#f8fafc',
    },
    lightVars: {
      '--background-primary': '#ffffff',
      '--background-primary-alt': '#f8fafc',
      '--background-secondary': '#f8fafc',
      '--background-secondary-alt': '#f1f5f9',
      '--background-modifier-border': '#e2e8f0',
      '--background-modifier-form-field': '#f8fafc',
      '--text-normal': '#0f172a',
      '--text-muted': '#64748b',
      '--text-faint': '#94a3b8',
      '--text-accent': '#2563eb',
      '--text-accent-hover': '#1d4ed8',
      '--interactive-accent': '#2563eb',
      '--interactive-accent-hover': '#1d4ed8',
      '--nav-item-background-active': '#eff6ff',
      '--nav-item-color-active': '#1d4ed8',
      '--code-background': '#0f172a',
      '--code-normal': '#f8fafc',
      '--font-ui': "'Inter', system-ui, -apple-system, sans-serif",
      '--font-article': "'Charter', 'Georgia', 'Cambria', serif",
      '--font-heading': "'Inter', system-ui, -apple-system, sans-serif",
      '--font-mono': "'JetBrains Mono', 'Fira Code', monospace",
    },
    darkVars: {
      '--background-primary': '#0f172a',
      '--background-primary-alt': '#0b1120',
      '--background-secondary': '#020617',
      '--background-secondary-alt': '#1e293b',
      '--background-modifier-border': '#334155',
      '--background-modifier-form-field': '#1e293b',
      '--text-normal': '#f8fafc',
      '--text-muted': '#94a3b8',
      '--text-faint': '#64748b',
      '--text-accent': '#38bdf8',
      '--text-accent-hover': '#7dd3fc',
      '--interactive-accent': '#3b82f6',
      '--interactive-accent-hover': '#60a5fa',
      '--nav-item-background-active': 'rgba(59, 130, 246, 0.18)',
      '--nav-item-color-active': '#93c5fd',
      '--code-background': '#020617',
      '--code-normal': '#f8fafc',
      '--font-ui': "'Inter', system-ui, -apple-system, sans-serif",
      '--font-article': "'Charter', 'Georgia', 'Cambria', serif",
      '--font-heading': "'Inter', system-ui, -apple-system, sans-serif",
      '--font-mono': "'JetBrains Mono', 'Fira Code', monospace",
    },
  },
  {
    id: 'obsidian-minimal',
    name: 'Minimal',
    author: 'kepano/obsidian-minimal',
    repoUrl: 'https://github.com/kepano/obsidian-minimal',
    previewImage: '/theme_images/minimal.webp',
    description: 'High contrast distraction-free design with stark monochromes, crisp borders, and vibrant rose accents.',
    isDarkFirst: true,
    swatch: {
      bg: '#000000',
      surface: '#141414',
      accent: '#f43f5e',
      text: '#ffffff',
    },
    lightVars: {
      '--background-primary': '#ffffff',
      '--background-primary-alt': '#fcfcfc',
      '--background-secondary': '#fafafa',
      '--background-secondary-alt': '#f4f4f5',
      '--background-modifier-border': '#e4e4e7',
      '--background-modifier-form-field': '#f4f4f5',
      '--text-normal': '#18181b',
      '--text-muted': '#71717a',
      '--text-faint': '#a1a1aa',
      '--text-accent': '#e11d48',
      '--text-accent-hover': '#be123c',
      '--interactive-accent': '#e11d48',
      '--interactive-accent-hover': '#be123c',
      '--nav-item-background-active': '#ffe4e6',
      '--nav-item-color-active': '#be123c',
      '--code-background': '#18181b',
      '--code-normal': '#fafafa',
      '--font-ui': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      '--font-article': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      '--font-heading': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      '--font-mono': "'SF Mono', 'Roboto Mono', 'Menlo', monospace",
    },
    darkVars: {
      '--background-primary': '#000000',
      '--background-primary-alt': '#080808',
      '--background-secondary': '#0d0d0d',
      '--background-secondary-alt': '#141414',
      '--background-modifier-border': '#262626',
      '--background-modifier-form-field': '#141414',
      '--text-normal': '#ffffff',
      '--text-muted': '#8e8e93',
      '--text-faint': '#52525b',
      '--text-accent': '#f43f5e',
      '--text-accent-hover': '#fb7185',
      '--interactive-accent': '#f43f5e',
      '--interactive-accent-hover': '#fb7185',
      '--nav-item-background-active': 'rgba(244, 63, 94, 0.18)',
      '--nav-item-color-active': '#fecdd3',
      '--code-background': '#000000',
      '--code-normal': '#f4f4f5',
      '--font-ui': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      '--font-article': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      '--font-heading': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      '--font-mono': "'SF Mono', 'Roboto Mono', 'Menlo', monospace",
    },
  },
  {
    id: 'things',
    name: 'Things',
    author: 'colineckert/obsidian-things',
    repoUrl: 'https://github.com/colineckert/obsidian-things',
    previewImage: '/theme_images/things.webp',
    description: 'Crisp, airy layout inspired by Things 3 with iconic blue action items, yellow highlights, and balanced typography.',
    isDarkFirst: false,
    swatch: {
      bg: '#191b1f',
      surface: '#22252a',
      accent: '#3b99fc',
      text: '#f0f2f5',
    },
    lightVars: {
      '--background-primary': '#ffffff',
      '--background-primary-alt': '#fbfbfd',
      '--background-secondary': '#f5f6f8',
      '--background-secondary-alt': '#eceef2',
      '--background-modifier-border': '#e2e5eb',
      '--background-modifier-form-field': '#f5f6f8',
      '--text-normal': '#27292d',
      '--text-muted': '#6b7280',
      '--text-faint': '#9ca3af',
      '--text-accent': '#007aff',
      '--text-accent-hover': '#0056b3',
      '--interactive-accent': '#007aff',
      '--interactive-accent-hover': '#0056b3',
      '--nav-item-background-active': '#e5f1ff',
      '--nav-item-color-active': '#007aff',
      '--code-background': '#27292d',
      '--code-normal': '#f5f6f8',
      '--font-ui': '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
      '--font-article': '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
      '--font-heading': '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
      '--font-mono': "'SF Mono', 'Menlo', monospace",
    },
    darkVars: {
      '--background-primary': '#191b1f',
      '--background-primary-alt': '#141518',
      '--background-secondary': '#131417',
      '--background-secondary-alt': '#22252a',
      '--background-modifier-border': '#2d3139',
      '--background-modifier-form-field': '#22252a',
      '--text-normal': '#f0f2f5',
      '--text-muted': '#9aa0a6',
      '--text-faint': '#5f6368',
      '--text-accent': '#3b99fc',
      '--text-accent-hover': '#6cb3ff',
      '--interactive-accent': '#3b99fc',
      '--interactive-accent-hover': '#6cb3ff',
      '--nav-item-background-active': 'rgba(59, 153, 252, 0.18)',
      '--nav-item-color-active': '#6cb3ff',
      '--code-background': '#131417',
      '--code-normal': '#f0f2f5',
      '--font-ui': '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
      '--font-article': '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
      '--font-heading': '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
      '--font-mono': "'SF Mono', 'Menlo', monospace",
    },
  },
  {
    id: 'anuppuccin',
    name: 'AnuPpuccin',
    author: 'anubisnekhet/AnuPpuccin',
    repoUrl: 'https://github.com/anubisnekhet/AnuPpuccin',
    previewImage: '/theme_images/AnuPpuccin.webp',
    description: 'Warm soothing pastel aesthetic based on Catppuccin with soft Latte cream and deep Mocha tones.',
    isDarkFirst: true,
    swatch: {
      bg: '#1e1e2e',
      surface: '#181825',
      accent: '#cba6f7',
      text: '#cdd6f4',
    },
    lightVars: {
      '--background-primary': '#eff1f5',
      '--background-primary-alt': '#e6e9ef',
      '--background-secondary': '#e6e9ef',
      '--background-secondary-alt': '#ccd0da',
      '--background-modifier-border': '#bcc0cc',
      '--background-modifier-form-field': '#e6e9ef',
      '--text-normal': '#4c4f69',
      '--text-muted': '#6c6f85',
      '--text-faint': '#8c8fa1',
      '--text-accent': '#8839ef',
      '--text-accent-hover': '#7287fd',
      '--interactive-accent': '#8839ef',
      '--interactive-accent-hover': '#7287fd',
      '--nav-item-background-active': 'rgba(136, 57, 239, 0.15)',
      '--nav-item-color-active': '#8839ef',
      '--code-background': '#292c3c',
      '--code-normal': '#c6d0f5',
      '--font-ui': "'Nunito', 'Inter', system-ui, -apple-system, sans-serif",
      '--font-article': "'Nunito', 'Inter', system-ui, -apple-system, sans-serif",
      '--font-heading': "'Nunito', 'Inter', system-ui, -apple-system, sans-serif",
      '--font-mono': "'Fira Code', 'JetBrains Mono', monospace",
    },
    darkVars: {
      '--background-primary': '#1e1e2e',
      '--background-primary-alt': '#181825',
      '--background-secondary': '#181825',
      '--background-secondary-alt': '#313244',
      '--background-modifier-border': '#45475a',
      '--background-modifier-form-field': '#313244',
      '--text-normal': '#cdd6f4',
      '--text-muted': '#a6adc8',
      '--text-faint': '#6c7086',
      '--text-accent': '#cba6f7',
      '--text-accent-hover': '#b4befe',
      '--interactive-accent': '#cba6f7',
      '--interactive-accent-hover': '#b4befe',
      '--nav-item-background-active': 'rgba(203, 166, 247, 0.18)',
      '--nav-item-color-active': '#cba6f7',
      '--code-background': '#11111b',
      '--code-normal': '#cdd6f4',
      '--font-ui': "'Nunito', 'Inter', system-ui, -apple-system, sans-serif",
      '--font-article': "'Nunito', 'Inter', system-ui, -apple-system, sans-serif",
      '--font-heading': "'Nunito', 'Inter', system-ui, -apple-system, sans-serif",
      '--font-mono': "'Fira Code', 'JetBrains Mono', monospace",
    },
  },
  {
    id: 'obsidian-nord',
    name: 'Obsidian Nord',
    author: 'insanum/obsidian_nord',
    repoUrl: 'https://github.com/insanum/obsidian_nord',
    previewImage: '/theme_images/obsidian_nord.webp',
    description: 'An arctic, north-bluish palette engineered for comfortable, focused markdown reading.',
    isDarkFirst: true,
    swatch: {
      bg: '#2e3440',
      surface: '#3b4252',
      accent: '#88c0d0',
      text: '#eceff4',
    },
    lightVars: {
      '--background-primary': '#eceff4',
      '--background-primary-alt': '#e5e9f0',
      '--background-secondary': '#e5e9f0',
      '--background-secondary-alt': '#d8dee9',
      '--background-modifier-border': '#c2c9d6',
      '--background-modifier-form-field': '#e5e9f0',
      '--text-normal': '#2e3440',
      '--text-muted': '#434c5e',
      '--text-faint': '#4c566a',
      '--text-accent': '#5e81ac',
      '--text-accent-hover': '#81a1c1',
      '--interactive-accent': '#5e81ac',
      '--interactive-accent-hover': '#81a1c1',
      '--nav-item-background-active': 'rgba(94, 129, 172, 0.18)',
      '--nav-item-color-active': '#5e81ac',
      '--code-background': '#2e3440',
      '--code-normal': '#eceff4',
      '--font-ui': "'Rubik', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '--font-article': "'Rubik', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '--font-heading': "'Rubik', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '--font-mono': "'JetBrains Mono', 'Source Code Pro', monospace",
    },
    darkVars: {
      '--background-primary': '#2e3440',
      '--background-primary-alt': '#242933',
      '--background-secondary': '#242933',
      '--background-secondary-alt': '#3b4252',
      '--background-modifier-border': '#434c5e',
      '--background-modifier-form-field': '#3b4252',
      '--text-normal': '#eceff4',
      '--text-muted': '#d8dee9',
      '--text-faint': '#616e88',
      '--text-accent': '#88c0d0',
      '--text-accent-hover': '#8fbcbb',
      '--interactive-accent': '#88c0d0',
      '--interactive-accent-hover': '#81a1c1',
      '--nav-item-background-active': 'rgba(136, 192, 208, 0.18)',
      '--nav-item-color-active': '#88c0d0',
      '--code-background': '#1e222a',
      '--code-normal': '#eceff4',
      '--font-ui': "'Rubik', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '--font-article': "'Rubik', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '--font-heading': "'Rubik', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '--font-mono': "'JetBrains Mono', 'Source Code Pro', monospace",
    },
  },
  {
    id: 'atom',
    name: 'Atom',
    author: 'kognise/obsidian-atom',
    repoUrl: 'https://github.com/kognise/obsidian-atom',
    previewImage: '/theme_images/atom.webp',
    description: 'Clean, modern theme inspired by the iconic Atom One Dark and One Light editor themes.',
    isDarkFirst: true,
    swatch: {
      bg: '#282c34',
      surface: '#21252b',
      accent: '#61afef',
      text: '#abb2bf',
    },
    lightVars: {
      '--background-primary': '#fafafa',
      '--background-primary-alt': '#f0f0f0',
      '--background-secondary': '#f0f0f0',
      '--background-secondary-alt': '#e5e5e6',
      '--background-modifier-border': '#dcdcdc',
      '--background-modifier-form-field': '#f0f0f0',
      '--text-normal': '#383a42',
      '--text-muted': '#696c77',
      '--text-faint': '#a0a1a7',
      '--text-accent': '#0184bc',
      '--text-accent-hover': '#4078f2',
      '--interactive-accent': '#0184bc',
      '--interactive-accent-hover': '#4078f2',
      '--nav-item-background-active': 'rgba(1, 132, 188, 0.12)',
      '--nav-item-color-active': '#0184bc',
      '--code-background': '#282c34',
      '--code-normal': '#abb2bf',
      '--font-ui': "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '--font-article': "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '--font-heading': "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '--font-mono': "'Fira Code', 'Source Code Pro', 'Menlo', monospace",
    },
    darkVars: {
      '--background-primary': '#282c34',
      '--background-primary-alt': '#21252b',
      '--background-secondary': '#21252b',
      '--background-secondary-alt': '#2c313a',
      '--background-modifier-border': '#3a3f4b',
      '--background-modifier-form-field': '#21252b',
      '--text-normal': '#abb2bf',
      '--text-muted': '#828997',
      '--text-faint': '#5c6370',
      '--text-accent': '#61afef',
      '--text-accent-hover': '#98c379',
      '--interactive-accent': '#61afef',
      '--interactive-accent-hover': '#528bff',
      '--nav-item-background-active': 'rgba(97, 175, 239, 0.16)',
      '--nav-item-color-active': '#61afef',
      '--code-background': '#1e2227',
      '--code-normal': '#abb2bf',
      '--font-ui': "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '--font-article': "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '--font-heading': "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '--font-mono': "'Fira Code', 'Source Code Pro', 'Menlo', monospace",
    },
  },
  {
    id: 'solarized',
    name: 'Solarized',
    author: 'harmtemolder/obsidian-solarized',
    repoUrl: 'https://github.com/harmtemolder/obsidian-solarized',
    previewImage: '/theme_images/solarized.webp',
    description: 'Unmistakable warm parchment cream and deep teal palettes scientifically engineered for reading comfort.',
    isDarkFirst: true,
    swatch: {
      bg: '#002b36',
      surface: '#073642',
      accent: '#2aa198',
      text: '#839496',
    },
    lightVars: {
      '--background-primary': '#fdf6e3',
      '--background-primary-alt': '#f5eed9',
      '--background-secondary': '#eee8d5',
      '--background-secondary-alt': '#e0d9c4',
      '--background-modifier-border': '#d5cdb5',
      '--background-modifier-form-field': '#eee8d5',
      '--text-normal': '#657b83',
      '--text-muted': '#93a1a1',
      '--text-faint': '#b3a890',
      '--text-accent': '#2aa198',
      '--text-accent-hover': '#859900',
      '--interactive-accent': '#2aa198',
      '--interactive-accent-hover': '#859900',
      '--nav-item-background-active': 'rgba(42, 161, 152, 0.18)',
      '--nav-item-color-active': '#2aa198',
      '--code-background': '#002b36',
      '--code-normal': '#93a1a1',
      '--font-ui': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '--font-article': "'Charter', 'Georgia', 'Cambria', serif",
      '--font-heading': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '--font-mono': "'Source Code Pro', 'Courier New', monospace",
    },
    darkVars: {
      '--background-primary': '#002b36',
      '--background-primary-alt': '#00212b',
      '--background-secondary': '#073642',
      '--background-secondary-alt': '#0a4756',
      '--background-modifier-border': '#0e5264',
      '--background-modifier-form-field': '#073642',
      '--text-normal': '#839496',
      '--text-muted': '#586e75',
      '--text-faint': '#3d525a',
      '--text-accent': '#2aa198',
      '--text-accent-hover': '#859900',
      '--interactive-accent': '#2aa198',
      '--interactive-accent-hover': '#859900',
      '--nav-item-background-active': 'rgba(42, 161, 152, 0.22)',
      '--nav-item-color-active': '#2aa198',
      '--code-background': '#00212b',
      '--code-normal': '#839496',
      '--font-ui': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '--font-article': "'Charter', 'Georgia', 'Cambria', serif",
      '--font-heading': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '--font-mono': "'Source Code Pro', 'Courier New', monospace",
    },
  },
  {
    id: 'cupertino',
    name: 'Cupertino',
    author: 'aaaaaalexis/obsidian-cupertino',
    repoUrl: 'https://github.com/aaaaaalexis/obsidian-cupertino',
    previewImage: '/theme_images/cupertino.webp',
    description: 'Apple-inspired aesthetics bringing native macOS and iOS design elements to your workspace.',
    isDarkFirst: false,
    swatch: {
      bg: '#1c1c1e',
      surface: '#2c2c2e',
      accent: '#0a84ff',
      text: '#f5f5f7',
    },
    lightVars: {
      '--background-primary': '#f5f5f7',
      '--background-primary-alt': '#ffffff',
      '--background-secondary': '#ffffff',
      '--background-secondary-alt': '#e5e5ea',
      '--background-modifier-border': '#d1d1d6',
      '--background-modifier-form-field': '#ffffff',
      '--text-normal': '#1d1d1f',
      '--text-muted': '#86868b',
      '--text-faint': '#a1a1a6',
      '--text-accent': '#007aff',
      '--text-accent-hover': '#0071e3',
      '--interactive-accent': '#007aff',
      '--interactive-accent-hover': '#0071e3',
      '--nav-item-background-active': 'rgba(0, 122, 255, 0.14)',
      '--nav-item-color-active': '#007aff',
      '--code-background': '#1d1d1f',
      '--code-normal': '#f5f5f7',
      '--font-ui': '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
      '--font-article': '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
      '--font-heading': '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
      '--font-mono': "'SF Mono', 'Menlo', monospace",
    },
    darkVars: {
      '--background-primary': '#1c1c1e',
      '--background-primary-alt': '#2c2c2e',
      '--background-secondary': '#2c2c2e',
      '--background-secondary-alt': '#3a3a3c',
      '--background-modifier-border': '#38383a',
      '--background-modifier-form-field': '#2c2c2e',
      '--text-normal': '#f5f5f7',
      '--text-muted': '#8e8e93',
      '--text-faint': '#636366',
      '--text-accent': '#0a84ff',
      '--text-accent-hover': '#409cff',
      '--interactive-accent': '#0a84ff',
      '--interactive-accent-hover': '#409cff',
      '--nav-item-background-active': 'rgba(10, 132, 255, 0.18)',
      '--nav-item-color-active': '#409cff',
      '--code-background': '#121214',
      '--code-normal': '#f5f5f7',
      '--font-ui': '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
      '--font-article': '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
      '--font-heading': '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
      '--font-mono': "'SF Mono', 'Menlo', monospace",
    },
  },
];

export function getSavedThemeId(): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return '';
  }
  return localStorage.getItem(PARMA_SELECTED_THEME_KEY) || '';
}

export function saveSelectedTheme(themeId: string): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem(PARMA_SELECTED_THEME_KEY, themeId);
    window.dispatchEvent(new CustomEvent(PARMA_THEME_EVENT, { detail: { themeId } }));
  }
}

export function getSavedCustomCss(): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return '';
  }
  return localStorage.getItem(PARMA_CUSTOM_CSS_KEY) || '';
}

export function saveCustomCss(css: string): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem(PARMA_CUSTOM_CSS_KEY, css);
    window.dispatchEvent(new CustomEvent(PARMA_THEME_EVENT, { detail: { customCss: css } }));
  }
}

export function resolveEffectiveTheme(
  savedSelection: string | null,
  vaultData?: VaultThemeResponse | null
): string {
  if (savedSelection && savedSelection.trim()) {
    return savedSelection.trim();
  }
  if (vaultData && vaultData.hasObsidianConfig) {
    return 'vault';
  }
  return 'parma-classic';
}

function objectToCssDeclarations(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([prop, val]) => `  ${prop}: ${val};`)
    .join('\n');
}

export function applyTheme(
  themeId: string,
  vaultData?: VaultThemeResponse | null,
  customCss?: string
): void {
  if (typeof document === 'undefined') return;

  const isVault = themeId === 'vault';
  const effectivePreset = BUILT_IN_THEMES.find((t) => t.id === themeId) || BUILT_IN_THEMES[0];

  let styleEl = document.getElementById('parma-active-theme') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'parma-active-theme';
    document.head.appendChild(styleEl);
  }

  document.documentElement.setAttribute('data-parma-theme', themeId);
  if (isVault && vaultData?.vaultThemeName) {
    document.documentElement.setAttribute('data-vault-theme', vaultData.vaultThemeName);
  } else {
    document.documentElement.removeAttribute('data-vault-theme');
  }

  const generatedCss: string[] = [];

  // 1. Variable rules for Light & Dark mode
  if (!isVault) {
    const lightVars = objectToCssDeclarations(effectivePreset.lightVars);
    const darkVars = objectToCssDeclarations(effectivePreset.darkVars);

    generatedCss.push(`
:root, body.theme-light, [data-theme="light"] {
${lightVars}
}

.dark, body.theme-dark, [data-theme="dark"] {
${darkVars}
}
`);
  } else {
    // Vault theme defaults + accent overrides
    const baseDark = BUILT_IN_THEMES[0].darkVars;
    const baseLight = BUILT_IN_THEMES[0].lightVars;

    let accentOverrides = '';
    if (vaultData?.accentColor) {
      accentOverrides = `
  --interactive-accent: ${vaultData.accentColor};
  --text-accent: ${vaultData.accentColor};
  --interactive-accent-hover: ${vaultData.accentColor};
`;
    }

    generatedCss.push(`
:root, body.theme-light, [data-theme="light"] {
${objectToCssDeclarations(baseLight)}
${accentOverrides}
}

.dark, body.theme-dark, [data-theme="dark"] {
${objectToCssDeclarations(baseDark)}
${accentOverrides}
}
`);
  }

  // 2. Comprehensive, high-specificity Parma UI CSS rules
  generatedCss.push(`
/* =========================================================
   Comprehensive Parma UI Theme System (High-Specificity Rules)
   ========================================================= */

/* Global Body, Font & Canvas */
html, body {
  background-color: var(--background-primary) !important;
  color: var(--text-normal) !important;
  font-family: var(--font-ui, system-ui, -apple-system, sans-serif);
}

::selection {
  background-color: color-mix(in srgb, var(--interactive-accent) 30%, transparent) !important;
  color: inherit !important;
}

/* Custom Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background-color: color-mix(in srgb, var(--text-faint) 40%, transparent) !important;
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background-color: var(--text-muted) !important;
}

/* App Outer Shell & Main Content Area */
.bg-slate-50,
.dark .bg-slate-950,
.bg-slate-950,
.bg-white,
.dark .bg-slate-900,
main.bg-white,
.dark main.bg-slate-900 {
  background-color: var(--background-primary) !important;
  color: var(--text-normal) !important;
}

main {
  background-color: var(--background-primary) !important;
}

/* Left & Right Sidebars */
aside,
aside.bg-slate-100\\/95,
.dark aside.bg-slate-900\\/95,
.bg-slate-100\\/95,
.dark .bg-slate-900\\/95,
.bg-slate-50\\/50,
.dark .bg-slate-900\\/50 {
  background-color: var(--background-secondary) !important;
  border-color: var(--background-modifier-border) !important;
  color: var(--text-normal) !important;
}

/* Top Header & Navigation Bar */
header,
header.bg-white,
.dark header.bg-slate-900 {
  background-color: var(--background-primary) !important;
  border-color: var(--background-modifier-border) !important;
  color: var(--text-normal) !important;
}

/* Universal Borders */
.border-slate-200,
.dark .border-slate-800,
.border-slate-300,
.dark .border-slate-700,
.border-slate-100,
.dark .border-slate-800\\/60,
.border-slate-200\\/80,
.border-neutral-800,
.border-neutral-700 {
  border-color: var(--background-modifier-border) !important;
}

/* Universal Typography & Text Colors */
.text-slate-900,
.dark .text-slate-100,
.text-slate-800,
.dark .text-slate-200,
.text-slate-700,
.dark .text-slate-300,
.text-slate-50,
.dark .text-slate-50 {
  color: var(--text-normal) !important;
}

.text-slate-600,
.text-slate-500,
.dark .text-slate-400 {
  color: var(--text-muted) !important;
}

.text-slate-400,
.dark .text-slate-500 {
  color: var(--text-faint) !important;
}

/* Header Brand / Logo */
.font-serif {
  font-family: var(--font-heading, var(--font-ui, serif)) !important;
}

/* Left Sidebar Folder Tree & Nav Items */
.bg-blue-50,
.dark .bg-blue-900\\/30,
.bg-blue-100,
.dark .bg-blue-950\\/70 {
  background-color: var(--nav-item-background-active, color-mix(in srgb, var(--interactive-accent) 15%, transparent)) !important;
  color: var(--nav-item-color-active, var(--interactive-accent)) !important;
}

.text-blue-600,
.text-blue-500,
.dark .text-blue-400,
.text-blue-700,
.dark .text-blue-300 {
  color: var(--text-accent, var(--interactive-accent)) !important;
}

/* Quick Search Button in Sidebar */
button.bg-white,
.dark button.bg-slate-800,
.dark button.bg-slate-700 {
  background-color: var(--background-modifier-form-field, var(--background-secondary)) !important;
  border-color: var(--background-modifier-border) !important;
  color: var(--text-normal) !important;
}

/* Keyboard Shortcut Badges */
kbd,
.bg-slate-100 kbd,
.dark .bg-slate-700 kbd,
.bg-slate-200 kbd,
.dark .bg-slate-800 kbd {
  background-color: var(--background-secondary-alt, var(--background-secondary)) !important;
  border-color: var(--background-modifier-border) !important;
  color: var(--text-muted) !important;
}

/* Sidebar Hover States */
.hover\\:bg-slate-200\\/50:hover,
.dark .hover\\:bg-slate-800\\/50:hover,
.hover\\:bg-slate-100:hover,
.dark .hover\\:bg-slate-800:hover,
.hover\\:bg-slate-200:hover,
.dark .hover\\:bg-slate-700:hover {
  background-color: var(--background-secondary-alt, color-mix(in srgb, var(--text-normal) 8%, transparent)) !important;
}

/* Sidebar Action Buttons */
.bg-slate-200\\/50,
.dark .bg-slate-800\\/60,
.bg-slate-100,
.dark .bg-slate-800 {
  background-color: var(--background-secondary-alt, var(--background-secondary)) !important;
  border-color: var(--background-modifier-border) !important;
  color: var(--text-normal) !important;
}

/* Right Sidebar: Table of Contents & Backlinks Cards */
.bg-slate-50\\/80,
.dark .bg-slate-900\\/60,
.bg-slate-50\\/40,
.dark .bg-slate-900\\/20 {
  background-color: var(--background-primary-alt, var(--background-secondary)) !important;
  border-color: var(--background-modifier-border) !important;
}

/* Backlink Card Item */
.group.cursor-pointer.p-2.rounded-lg.bg-white,
.dark .group.cursor-pointer.p-2.rounded-lg.bg-white,
.dark .bg-slate-800\\/80 {
  background-color: var(--background-secondary-alt, var(--background-secondary)) !important;
  border-color: var(--background-modifier-border) !important;
}

/* Backlink Excerpt Box */
.bg-slate-50.dark\\:bg-slate-900\\/40,
.dark .bg-slate-900\\/40 {
  background-color: var(--background-primary) !important;
}

/* =========================================================
   Article View (.wiki-article) & Visual Editor (.visual-editor-content)
   ========================================================= */
.wiki-article,
.visual-editor-content {
  font-family: var(--font-article, 'Charter', 'Georgia', serif) !important;
  color: var(--text-normal) !important;
}

.wiki-article h1, .visual-editor-content h1,
.wiki-article h2, .visual-editor-content h2,
.wiki-article h3, .visual-editor-content h3,
.wiki-article h4, .visual-editor-content h4 {
  font-family: var(--font-heading, var(--font-ui, sans-serif)) !important;
  color: var(--text-normal) !important;
  border-color: var(--background-modifier-border) !important;
}

.wiki-article p, .visual-editor-content p,
.wiki-article ul, .visual-editor-content ul,
.wiki-article ol, .visual-editor-content ol,
.wiki-article li, .visual-editor-content li {
  color: var(--text-normal) !important;
}

.wiki-article a,
.visual-editor-content a {
  color: var(--text-accent, var(--interactive-accent)) !important;
  text-decoration-color: color-mix(in srgb, var(--interactive-accent) 40%, transparent) !important;
}

.wiki-article a:hover,
.visual-editor-content a:hover {
  text-decoration-color: var(--interactive-accent) !important;
  color: var(--interactive-accent-hover, var(--interactive-accent)) !important;
}

/* Wikilinks */
.wikilink,
.visual-editor-content .wikilink {
  color: var(--text-accent, var(--interactive-accent)) !important;
  background-color: color-mix(in srgb, var(--interactive-accent) 14%, transparent) !important;
  border-color: color-mix(in srgb, var(--interactive-accent) 32%, transparent) !important;
}

.wikilink:hover,
.visual-editor-content .wikilink:hover {
  background-color: color-mix(in srgb, var(--interactive-accent) 24%, transparent) !important;
  border-color: var(--interactive-accent) !important;
}

/* Blockquotes */
.wiki-article blockquote,
.visual-editor-content blockquote {
  border-left-color: var(--interactive-accent, var(--text-faint)) !important;
  background-color: color-mix(in srgb, var(--interactive-accent) 8%, var(--background-secondary)) !important;
  color: var(--text-muted) !important;
}

/* Tables */
.wiki-article table,
.visual-editor-content table,
table.note-table,
.table-wrapper {
  border-color: var(--background-modifier-border) !important;
}

.wiki-article th,
.visual-editor-content th,
table.note-table th {
  background-color: var(--background-secondary-alt, var(--background-secondary)) !important;
  color: var(--text-normal) !important;
  border-color: var(--background-modifier-border) !important;
  font-family: var(--font-ui, sans-serif) !important;
}

.wiki-article td,
.visual-editor-content td,
table.note-table td {
  color: var(--text-normal) !important;
  border-color: var(--background-modifier-border) !important;
}

.wiki-article tr:nth-child(even),
table.note-table tbody tr:nth-child(even) {
  background-color: color-mix(in srgb, var(--text-normal) 3%, transparent) !important;
}

table.note-table tbody tr:hover {
  background-color: color-mix(in srgb, var(--text-normal) 6%, transparent) !important;
}

/* Code Blocks & Inline Code */
pre,
.wiki-article pre,
.visual-editor-content pre {
  background-color: var(--code-background) !important;
  color: var(--code-normal) !important;
  border-color: var(--background-modifier-border) !important;
  font-family: var(--font-mono, monospace) !important;
}

code:not(pre code),
.wiki-article code:not(pre code),
.visual-editor-content code:not(pre code) {
  background-color: var(--background-secondary-alt, var(--background-secondary)) !important;
  color: var(--text-normal) !important;
  border-color: var(--background-modifier-border) !important;
  font-family: var(--font-mono, monospace) !important;
}

/* Figures / Media */
.wiki-article figure,
.visual-editor-content figure {
  background-color: var(--background-secondary) !important;
  border-color: var(--background-modifier-border) !important;
}

/* Checklists */
input[type="checkbox"] {
  accent-color: var(--interactive-accent) !important;
}

/* Markdown Textarea */
textarea,
textarea.font-mono {
  background-color: transparent !important;
  color: var(--text-normal) !important;
  font-family: var(--font-mono, monospace) !important;
}

textarea::placeholder,
input::placeholder {
  color: var(--text-faint) !important;
}

/* Mode Switcher & Toolbars in Note Editor */
.sticky.top-0 {
  background-color: var(--background-primary) !important;
  border-color: var(--background-modifier-border) !important;
}

.bg-slate-200\\/70,
.dark .bg-slate-800 {
  background-color: var(--background-secondary) !important;
}

/* Active Mode Button */
.bg-white.text-blue-600,
.dark .bg-slate-700.dark\\:text-blue-300 {
  background-color: var(--background-primary) !important;
  color: var(--interactive-accent) !important;
}

/* Primary Action Buttons */
.bg-blue-600,
.bg-blue-500,
.bg-amber-600 {
  background-color: var(--interactive-accent) !important;
  color: #ffffff !important;
}

.hover\\:bg-blue-700:hover,
.hover\\:bg-blue-600:hover,
.hover\\:bg-amber-700:hover {
  background-color: var(--interactive-accent-hover, var(--interactive-accent)) !important;
}

.focus\\:ring-blue-500:focus,
.focus\\:ring-amber-500:focus {
  --tw-ring-color: var(--interactive-accent) !important;
}

/* Directory Index View Cards */
.group.flex.items-center.justify-between.p-4.rounded-xl,
.group.flex.flex-col.justify-between.p-4.rounded-xl {
  background-color: var(--background-secondary) !important;
  border-color: var(--background-modifier-border) !important;
}

.group.flex.items-center.justify-between.p-4.rounded-xl:hover,
.group.flex.flex-col.justify-between.p-4.rounded-xl:hover {
  border-color: var(--interactive-accent) !important;
  background-color: var(--background-secondary-alt, var(--background-secondary)) !important;
}

/* Modals (Search, Settings, File Browser, New Note, New Folder, Graph) */
.fixed.inset-0.z-50 {
  background-color: rgba(0, 0, 0, 0.65) !important;
}

.max-w-2xl.w-full,
.max-w-md.w-full,
.max-w-5xl.w-full,
.max-w-3xl.w-full,
.max-w-lg.w-full {
  background-color: var(--background-primary) !important;
  border-color: var(--background-modifier-border) !important;
  color: var(--text-normal) !important;
}

.border-b.border-slate-200,
.dark .border-b.border-slate-800,
.border-t.border-slate-200,
.dark .border-t.border-slate-800 {
  border-color: var(--background-modifier-border) !important;
}

/* Modal Form Fields */
input[type="text"],
input[type="search"],
select,
form textarea {
  background-color: var(--background-modifier-form-field, var(--background-secondary)) !important;
  border-color: var(--background-modifier-border) !important;
  color: var(--text-normal) !important;
}

input[type="text"]:focus,
input[type="search"]:focus,
select:focus,
form textarea:focus {
  border-color: var(--interactive-accent) !important;
  outline-color: var(--interactive-accent) !important;
}

/* Search Modal Item States */
.bg-blue-50.border-blue-200,
.dark .bg-blue-950\\/40.dark\\:border-blue-800 {
  background-color: var(--nav-item-background-active) !important;
  border-color: var(--interactive-accent) !important;
}

/* File Browser Modal Theme Support */
.bg-\\[\\#1f2326\\],
.bg-\\[\\#181a1c\\],
.bg-\\[\\#191c1e\\],
.bg-\\[\\#1a1d20\\],
.bg-\\[\\#141618\\] {
  background-color: var(--background-secondary) !important;
  border-color: var(--background-modifier-border) !important;
  color: var(--text-normal) !important;
}

/* Graph View Controls & Legend */
.bg-white\\/90,
.dark .bg-slate-900\\/90,
.bg-white\\/95,
.dark .bg-slate-900\\/95 {
  background-color: var(--background-secondary) !important;
  border-color: var(--background-modifier-border) !important;
  color: var(--text-normal) !important;
}
`);

  // 3. Vault Theme Raw CSS and Snippets
  if (isVault && vaultData) {
    if (vaultData.themeCss) {
      generatedCss.push(`\n/* Injected Vault Theme CSS (${vaultData.vaultThemeName || 'Vault'}) */\n${vaultData.themeCss}`);
    }
    if (vaultData.snippetsCss) {
      generatedCss.push(`\n/* Injected Vault Snippets CSS */\n${vaultData.snippetsCss}`);
    }
  }

  // 4. Custom User CSS / Snippets
  const rawCustom = customCss !== undefined ? customCss : getSavedCustomCss();
  if (rawCustom && rawCustom.trim()) {
    generatedCss.push(`\n/* Injected Custom User CSS */\n${rawCustom}`);
  }

  styleEl.textContent = generatedCss.join('\n');
}

export function initEarlyTheme(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  try {
    // 1. Dark Mode setup
    const savedThemeMode = localStorage.getItem('parma-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedThemeMode === 'dark' || (!savedThemeMode && prefersDark);

    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }

    // 2. Active Theme CSS variables and custom rules
    const savedThemeId = getSavedThemeId();
    const effective = resolveEffectiveTheme(savedThemeId, null);
    const savedCss = getSavedCustomCss();

    applyTheme(effective, null, savedCss);

    const effectivePreset = BUILT_IN_THEMES.find((t) => t.id === effective) || BUILT_IN_THEMES[0];
    const themeColor = isDark
      ? effectivePreset.darkVars['--background-primary'] || '#0f172a'
      : effectivePreset.lightVars['--background-primary'] || '#f8fafc';

    document.documentElement.style.backgroundColor = themeColor;
    if (document.body) {
      document.body.style.backgroundColor = themeColor;
    }

    const metaThemeColor = document.getElementById('theme-color-meta');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColor);
    }
  } catch (err) {
    console.warn('Failed early theme initialization:', err);
  }
}

// Automatically invoke early theme initialization when running in browser
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initEarlyTheme();
}

