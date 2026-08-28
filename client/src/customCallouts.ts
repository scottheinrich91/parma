import React from 'react';
import {
  Info,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Flame,
  CheckSquare,
  Bug,
  Bookmark,
  Quote,
  FileText,
  Zap,
  XCircle,
  Star,
  Heart,
  Sparkles,
  Terminal,
  Bell,
  Tag,
  Flag,
  AlertOctagon,
  MessageSquare,
  Compass,
  Pin,
  Pencil,
  Wrench,
  Settings,
  Folder,
  Hash,
  Check,
  Megaphone,
  Radio,
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  Search,
  Lock,
  Unlock,
  Key,
  Database,
  Server,
  Layers,
  Code,
  Eye,
} from 'lucide-react';

export const CUSTOM_CALLOUTS_STORAGE_KEY = 'parma_custom_callouts';
export const CUSTOM_CALLOUTS_EVENT = 'parma_custom_callouts_updated';

export const DEFAULT_CUSTOM_CALLOUT_CSS = `.callout[data-callout="custom-question-type"] {
    --callout-color: #000000;
    --callout-icon: lucide-alert-circle;
}`;

export interface CustomCalloutDef {
  id: string;
  name: string;
  color: string;
  iconName: string;
  rawCss?: string;
}

export interface StandardCalloutType {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  text: string;
  defaultTitle: string;
}

export const LUCIDE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  lightbulb: Lightbulb,
  hint: Lightbulb,
  'alert-triangle': AlertTriangle,
  alerttriangle: AlertTriangle,
  warning: AlertTriangle,
  'alert-circle': AlertCircle,
  alertcircle: AlertCircle,
  'shield-alert': ShieldAlert,
  shieldalert: ShieldAlert,
  caution: ShieldAlert,
  'check-circle': CheckCircle2,
  'check-circle2': CheckCircle2,
  checkcircle: CheckCircle2,
  checkcircle2: CheckCircle2,
  success: CheckCircle2,
  'help-circle': HelpCircle,
  helpcircle: HelpCircle,
  question: HelpCircle,
  flame: Flame,
  danger: Flame,
  fire: Flame,
  'check-square': CheckSquare,
  checksquare: CheckSquare,
  todo: CheckSquare,
  bug: Bug,
  bookmark: Bookmark,
  example: Bookmark,
  quote: Quote,
  cite: Quote,
  'file-text': FileText,
  filetext: FileText,
  abstract: FileText,
  summary: FileText,
  zap: Zap,
  tldr: Zap,
  'x-circle': XCircle,
  xcircle: XCircle,
  failure: XCircle,
  fail: XCircle,
  missing: XCircle,
  error: XCircle,
  star: Star,
  heart: Heart,
  sparkles: Sparkles,
  terminal: Terminal,
  bell: Bell,
  tag: Tag,
  flag: Flag,
  'alert-octagon': AlertOctagon,
  alertoctagon: AlertOctagon,
  'message-square': MessageSquare,
  messagesquare: MessageSquare,
  compass: Compass,
  pin: Pin,
  pencil: Pencil,
  wrench: Wrench,
  settings: Settings,
  folder: Folder,
  hash: Hash,
  check: Check,
  megaphone: Megaphone,
  radio: Radio,
  'book-open': BookOpen,
  bookopen: BookOpen,
  calendar: Calendar,
  clock: Clock,
  'external-link': ExternalLink,
  externallink: ExternalLink,
  search: Search,
  lock: Lock,
  unlock: Unlock,
  key: Key,
  database: Database,
  server: Server,
  layers: Layers,
  code: Code,
  eye: Eye,
};

export const STANDARD_CALLOUT_TYPES: StandardCalloutType[] = [
  { id: 'note', label: 'Note', icon: Info, color: '#3b82f6', bg: 'bg-blue-500/10 dark:bg-blue-500/15', border: 'border-l-blue-500', text: 'text-blue-600 dark:text-blue-400', defaultTitle: 'Note' },
  { id: 'abstract', label: 'Abstract', icon: FileText, color: '#06b6d4', bg: 'bg-cyan-500/10 dark:bg-cyan-500/15', border: 'border-l-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', defaultTitle: 'Abstract' },
  { id: 'info', label: 'Info', icon: Info, color: '#0ea5e9', bg: 'bg-sky-500/10 dark:bg-sky-500/15', border: 'border-l-sky-500', text: 'text-sky-600 dark:text-sky-400', defaultTitle: 'Info' },
  { id: 'todo', label: 'Todo', icon: CheckSquare, color: '#6366f1', bg: 'bg-indigo-500/10 dark:bg-indigo-500/15', border: 'border-l-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', defaultTitle: 'Todo' },
  { id: 'tip', label: 'Tip', icon: Lightbulb, color: '#10b981', bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', border: 'border-l-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', defaultTitle: 'Tip' },
  { id: 'success', label: 'Success', icon: CheckCircle2, color: '#22c55e', bg: 'bg-green-500/10 dark:bg-green-500/15', border: 'border-l-green-500', text: 'text-green-600 dark:text-green-400', defaultTitle: 'Success' },
  { id: 'question', label: 'Question', icon: HelpCircle, color: '#f59e0b', bg: 'bg-amber-500/10 dark:bg-amber-500/15', border: 'border-l-amber-500', text: 'text-amber-600 dark:text-amber-400', defaultTitle: 'Question' },
  { id: 'warning', label: 'Warning', icon: AlertTriangle, color: '#f97316', bg: 'bg-orange-500/10 dark:bg-orange-500/15', border: 'border-l-orange-500', text: 'text-orange-600 dark:text-orange-400', defaultTitle: 'Warning' },
  { id: 'failure', label: 'Failure', icon: XCircle, color: '#ef4444', bg: 'bg-red-500/10 dark:bg-red-500/15', border: 'border-l-red-500', text: 'text-red-600 dark:text-red-400', defaultTitle: 'Failure' },
  { id: 'danger', label: 'Danger', icon: Flame, color: '#e11d48', bg: 'bg-rose-500/10 dark:bg-rose-500/15', border: 'border-l-rose-600', text: 'text-rose-600 dark:text-rose-400', defaultTitle: 'Danger' },
  { id: 'bug', label: 'Bug', icon: Bug, color: '#ec4899', bg: 'bg-pink-500/10 dark:bg-pink-500/15', border: 'border-l-pink-500', text: 'text-pink-600 dark:text-pink-400', defaultTitle: 'Bug' },
  { id: 'example', label: 'Example', icon: Bookmark, color: '#a855f7', bg: 'bg-purple-500/10 dark:bg-purple-500/15', border: 'border-l-purple-500', text: 'text-purple-600 dark:text-purple-400', defaultTitle: 'Example' },
  { id: 'quote', label: 'Quote', icon: Quote, color: '#94a3b8', bg: 'bg-slate-500/10 dark:bg-slate-500/15', border: 'border-l-slate-400', text: 'text-slate-600 dark:text-slate-400', defaultTitle: 'Quote' },
];

export function getCalloutIcon(iconNameOrType: string): React.ComponentType<{ className?: string }> {
  if (!iconNameOrType) return Info;
  const clean = iconNameOrType.toLowerCase().replace(/^lucide-/, '').trim();
  return LUCIDE_ICON_MAP[clean] || LUCIDE_ICON_MAP[clean.replace(/-/g, '')] || AlertCircle;
}

export function parseCustomCallouts(css: string): CustomCalloutDef[] {
  const result: CustomCalloutDef[] = [];
  if (!css || typeof css !== 'string') return result;

  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let ruleMatch: RegExpExecArray | null = null;

  while ((ruleMatch = ruleRegex.exec(css)) !== null) {
    const selectorGroup = ruleMatch[1];
    const declarations = ruleMatch[2];

    const idMatches = selectorGroup.matchAll(/(?:\[\s*data-callout(?:-type)?\s*=\s*["']?([^"'\]\s]+)["']?\s*\]|\.callout-([a-zA-Z0-9_-]+))/gi);
    const ids: string[] = [];
    for (const m of idMatches) {
      const id = (m[1] || m[2])?.trim().toLowerCase();
      if (id && !ids.includes(id)) {
        ids.push(id);
      }
    }

    if (ids.length === 0) continue;

    const colorMatch = declarations.match(/--callout-color\s*:\s*([^;]+);?/i);
    const iconMatch = declarations.match(/--callout-icon\s*:\s*([^;]+);?/i);
    const titleMatch = declarations.match(/--callout-title\s*:\s*([^;]+);?/i);

    const color = colorMatch ? colorMatch[1].trim() : '#000000';
    let iconName = iconMatch ? iconMatch[1].trim() : 'alert-circle';
    if (iconName.startsWith('lucide-')) {
      iconName = iconName.slice(7);
    }
    const customTitle = titleMatch ? titleMatch[1].trim().replace(/^["']|["']$/g, '') : undefined;

    ids.forEach((id) => {
      if (!result.some((item) => item.id === id)) {
        const readableName = customTitle || id
          .split(/[-_]+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        result.push({
          id,
          name: readableName,
          color,
          iconName,
          rawCss: ruleMatch ? ruleMatch[0] : '',
        });
      }
    });
  }

  return result;
}

export function getCustomCalloutsCSS(): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return DEFAULT_CUSTOM_CALLOUT_CSS;
  }
  const saved = localStorage.getItem(CUSTOM_CALLOUTS_STORAGE_KEY);
  return saved !== null ? saved : DEFAULT_CUSTOM_CALLOUT_CSS;
}

export function getParsedCustomCallouts(): CustomCalloutDef[] {
  return parseCustomCallouts(getCustomCalloutsCSS());
}

export function injectCustomCalloutsCSS(css?: string): void {
  if (typeof document === 'undefined') return;
  const rawCss = css !== undefined ? css : (typeof localStorage !== 'undefined' ? localStorage.getItem(CUSTOM_CALLOUTS_STORAGE_KEY) || DEFAULT_CUSTOM_CALLOUT_CSS : DEFAULT_CUSTOM_CALLOUT_CSS);
  
  let styleEl = document.getElementById('parma-custom-callouts-style') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'parma-custom-callouts-style';
    document.head.appendChild(styleEl);
  }

  const baseDynamicRules = `
/* Dynamic fallback styles for custom Obsidian callouts */
.callout[data-callout], .callout[data-callout-type] {
  border-left-color: var(--callout-color) !important;
  background-color: color-mix(in srgb, var(--callout-color) 12%, transparent);
}
.callout[data-callout] .callout-header, .callout[data-callout-type] .callout-header,
.callout[data-callout] .callout-icon, .callout[data-callout-type] .callout-icon {
  color: var(--callout-color) !important;
}
`;

  styleEl.textContent = `${baseDynamicRules}\n${rawCss}`;
}

export function saveCustomCalloutsCSS(css: string): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem(CUSTOM_CALLOUTS_STORAGE_KEY, css);
    injectCustomCalloutsCSS(css);
    window.dispatchEvent(new CustomEvent(CUSTOM_CALLOUTS_EVENT, { detail: { css } }));
  }
}
