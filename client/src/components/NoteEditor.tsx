import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Quote, 
  Code, 
  Table, 
  Link, 
  Image as ImageIcon, 
  Save, 
  Columns, 
  Check,
  AlertCircle,
  Eye,
  Code2,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Bug,
  Bookmark,
  FileText,
  Zap,
  XCircle,
  Info,
  ChevronDown,
  Plus,
  Palette
} from 'lucide-react';
import { NoteData, UploadResponse } from '../types';
import { NoteView } from './NoteView';
import { UploadModal } from './UploadModal';
import { CustomCalloutModal } from './CustomCalloutModal';
import {
  STANDARD_CALLOUT_TYPES,
  getParsedCustomCallouts,
  getCalloutIcon,
  injectCustomCalloutsCSS,
  CUSTOM_CALLOUTS_EVENT,
  CustomCalloutDef,
} from '../customCallouts';

export interface CalloutConfigItem {
  icon: React.ComponentType<{ className?: string }>;
  border: string;
  bg: string;
  titleColor: string;
  defaultTitle: string;
}

export const CALLOUT_CONFIG: Record<string, CalloutConfigItem> = {
  note: {
    icon: Info,
    border: 'border-l-blue-500',
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    titleColor: 'text-blue-600 dark:text-blue-400',
    defaultTitle: 'Note',
  },
  abstract: {
    icon: FileText,
    border: 'border-l-cyan-500',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    titleColor: 'text-cyan-600 dark:text-cyan-400',
    defaultTitle: 'Abstract',
  },
  summary: {
    icon: FileText,
    border: 'border-l-cyan-500',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    titleColor: 'text-cyan-600 dark:text-cyan-400',
    defaultTitle: 'Summary',
  },
  tldr: {
    icon: Zap,
    border: 'border-l-cyan-500',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    titleColor: 'text-cyan-600 dark:text-cyan-400',
    defaultTitle: 'TL;DR',
  },
  info: {
    icon: Info,
    border: 'border-l-sky-500',
    bg: 'bg-sky-500/10 dark:bg-sky-500/15',
    titleColor: 'text-sky-600 dark:text-sky-400',
    defaultTitle: 'Info',
  },
  todo: {
    icon: CheckSquare,
    border: 'border-l-indigo-500',
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    titleColor: 'text-indigo-600 dark:text-indigo-400',
    defaultTitle: 'Todo',
  },
  tip: {
    icon: Lightbulb,
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    titleColor: 'text-emerald-600 dark:text-emerald-400',
    defaultTitle: 'Tip',
  },
  hint: {
    icon: Lightbulb,
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    titleColor: 'text-emerald-600 dark:text-emerald-400',
    defaultTitle: 'Hint',
  },
  important: {
    icon: AlertCircle,
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    titleColor: 'text-emerald-600 dark:text-emerald-400',
    defaultTitle: 'Important',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-l-orange-500',
    bg: 'bg-orange-500/10 dark:bg-orange-500/15',
    titleColor: 'text-orange-600 dark:text-orange-400',
    defaultTitle: 'Warning',
  },
  caution: {
    icon: ShieldAlert,
    border: 'border-l-orange-500',
    bg: 'bg-orange-500/10 dark:bg-orange-500/15',
    titleColor: 'text-orange-600 dark:text-orange-400',
    defaultTitle: 'Caution',
  },
  attention: {
    icon: AlertTriangle,
    border: 'border-l-orange-500',
    bg: 'bg-orange-500/10 dark:bg-orange-500/15',
    titleColor: 'text-orange-600 dark:text-orange-400',
    defaultTitle: 'Attention',
  },
  danger: {
    icon: Flame,
    border: 'border-l-rose-600',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    titleColor: 'text-rose-600 dark:text-rose-400',
    defaultTitle: 'Danger',
  },
  error: {
    icon: XCircle,
    border: 'border-l-rose-600',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    titleColor: 'text-rose-600 dark:text-rose-400',
    defaultTitle: 'Error',
  },
  bug: {
    icon: Bug,
    border: 'border-l-pink-500',
    bg: 'bg-pink-500/10 dark:bg-pink-500/15',
    titleColor: 'text-pink-600 dark:text-pink-400',
    defaultTitle: 'Bug',
  },
  failure: {
    icon: XCircle,
    border: 'border-l-red-500',
    bg: 'bg-red-500/10 dark:bg-red-500/15',
    titleColor: 'text-red-600 dark:text-red-400',
    defaultTitle: 'Failure',
  },
  fail: {
    icon: XCircle,
    border: 'border-l-red-500',
    bg: 'bg-red-500/10 dark:bg-red-500/15',
    titleColor: 'text-red-600 dark:text-red-400',
    defaultTitle: 'Fail',
  },
  missing: {
    icon: AlertCircle,
    border: 'border-l-red-500',
    bg: 'bg-red-500/10 dark:bg-red-500/15',
    titleColor: 'text-red-600 dark:text-red-400',
    defaultTitle: 'Missing',
  },
  success: {
    icon: CheckCircle2,
    border: 'border-l-green-500',
    bg: 'bg-green-500/10 dark:bg-green-500/15',
    titleColor: 'text-green-600 dark:text-green-400',
    defaultTitle: 'Success',
  },
  check: {
    icon: CheckCircle2,
    border: 'border-l-green-500',
    bg: 'bg-green-500/10 dark:bg-green-500/15',
    titleColor: 'text-green-600 dark:text-green-400',
    defaultTitle: 'Check',
  },
  done: {
    icon: CheckCircle2,
    border: 'border-l-green-500',
    bg: 'bg-green-500/10 dark:bg-green-500/15',
    titleColor: 'text-green-600 dark:text-green-400',
    defaultTitle: 'Done',
  },
  question: {
    icon: HelpCircle,
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    titleColor: 'text-amber-600 dark:text-amber-400',
    defaultTitle: 'Question',
  },
  help: {
    icon: HelpCircle,
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    titleColor: 'text-amber-600 dark:text-amber-400',
    defaultTitle: 'Help',
  },
  faq: {
    icon: HelpCircle,
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    titleColor: 'text-amber-600 dark:text-amber-400',
    defaultTitle: 'FAQ',
  },
  quote: {
    icon: Quote,
    border: 'border-l-slate-400',
    bg: 'bg-slate-500/10 dark:bg-slate-500/15',
    titleColor: 'text-slate-600 dark:text-slate-400',
    defaultTitle: 'Quote',
  },
  cite: {
    icon: Quote,
    border: 'border-l-slate-400',
    bg: 'bg-slate-500/10 dark:bg-slate-500/15',
    titleColor: 'text-slate-600 dark:text-slate-400',
    defaultTitle: 'Cite',
  },
  example: {
    icon: Bookmark,
    border: 'border-l-purple-500',
    bg: 'bg-purple-500/10 dark:bg-purple-500/15',
    titleColor: 'text-purple-600 dark:text-purple-400',
    defaultTitle: 'Example',
  },
};

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatInline(text: string): string {
  if (!text) return '';

  // 0. Protect code spans: `code`
  const codeSpans: string[] = [];
  let processed = text.replace(/`([^`]+)`/g, (_match, codeContent) => {
    const idx = codeSpans.length;
    codeSpans.push(`<code>${escapeHtml(codeContent)}</code>`);
    return `\x00CODE_${idx}\x00`;
  });

  // 1. Wikilinks: [[target#heading|alias]], [[target|alias]], [[target#heading]], [[target]], [[#heading|alias]], [[#heading]]
  processed = processed.replace(/(?:!?)\[\[([^\]|#]+)?(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g, (match, rawTarget, rawHeading, rawAlias) => {
    const isEmbed = match.startsWith('!');
    const target = rawTarget ? rawTarget.trim() : '';
    const heading = rawHeading ? rawHeading.trim() : '';
    const alias = rawAlias ? rawAlias.trim() : '';

    if (isEmbed) {
      const src = target;
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alias || target)}" class="note-embed-img" />`;
    }

    const displayText = alias || (target ? (heading ? `${target} > ${heading}` : target) : `#${heading}`);
    return `<span class="wikilink" data-wikilink="true" data-target="${escapeHtml(target)}" data-heading="${escapeHtml(heading)}" data-alias="${escapeHtml(alias)}">${escapeHtml(displayText)}</span>`;
  });

  // 2. Standard markdown images: ![alt](url) or ![alt](url "title")
  processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, rawUrl) => {
    let url = rawUrl.trim();
    let title = '';
    const titleMatch = url.match(/^([^\s]+)\s+["'](.*)["']$/);
    if (titleMatch) {
      url = titleMatch[1];
      title = titleMatch[2];
    }
    if (url.startsWith('<') && url.endsWith('>')) {
      url = url.slice(1, -1);
    }
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}"${titleAttr} />`;
  });

  // 3. Standard markdown links: [text](url) or [text](url "title")
  processed = processed.replace(/(?<!\!)\[([^\]]*)\]\(([^)]+)\)/g, (_m, linkText, rawUrl) => {
    let url = rawUrl.trim();
    let title = '';
    const titleMatch = url.match(/^([^\s]+)\s+["'](.*)["']$/);
    if (titleMatch) {
      url = titleMatch[1];
      title = titleMatch[2];
    }
    if (url.startsWith('<') && url.endsWith('>')) {
      url = url.slice(1, -1);
    }
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return `<a href="${escapeHtml(url)}"${titleAttr} target="_blank" rel="noopener noreferrer">${formatInline(linkText)}</a>`;
  });

  // 4. Angle-bracket autolinks: <https://example.com> or <mailto:alice@example.com> or <alice@example.com>
  processed = processed.replace(/<((?:https?|ftp):\/\/[^\s>]+)>/g, (_m, url) => {
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
  });
  processed = processed.replace(/<(mailto:[^\s>]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/g, (_m, email) => {
    const href = email.startsWith('mailto:') ? email : `mailto:${email}`;
    const display = email.replace(/^mailto:/, '');
    return `<a href="${escapeHtml(href)}">${escapeHtml(display)}</a>`;
  });

  // 5. Raw URLs (GFM Autolinks): https://... or http://...
  processed = processed.replace(/(?<!(?:href="|src="|">))\b(https?:\/\/[^\s<>"')]+(?:\([^\s()<>]*\)[^\s()<>]*)*)/g, (fullMatch, url) => {
    let cleanUrl = url;
    let trailing = '';
    const punctuationMatch = cleanUrl.match(/([.,;:!?]+)$/);
    if (punctuationMatch) {
      trailing = punctuationMatch[1];
      cleanUrl = cleanUrl.slice(0, -trailing.length);
    }
    return `<a href="${escapeHtml(cleanUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(cleanUrl)}</a>${trailing}`;
  });

  // 6. Bold & Italic & Strikethrough & Kbd
  processed = processed.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  processed = processed.replace(/(?<=\s|^|[^\w])___([^_]+)___(?=\s|$|[^\w])/g, '<strong><em>$1</em></strong>');
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/(?<=\s|^|[^\w])__([^_]+)__(?=\s|$|[^\w])/g, '<strong>$1</strong>');
  processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  processed = processed.replace(/(?<=\s|^|[^\w])_([^_]+)_(?=\s|$|[^\w])/g, '<em>$1</em>');
  processed = processed.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  processed = processed.replace(/<kbd>([^<]+)<\/kbd>/g, '<kbd>$1</kbd>');

  // 7. Restore protected code spans
  processed = processed.replace(/\x00CODE_(\d+)\x00/g, (_m, idxStr) => {
    const idx = parseInt(idxStr, 10);
    return codeSpans[idx] || '';
  });

  return processed;
}

export function splitTableCells(row: string): string[] {
  let trimmed = row.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);

  const cells: string[] = [];
  let current = '';
  let escaped = false;
  let inCode = false;
  let inWikilink = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    const nextChar = i + 1 < trimmed.length ? trimmed[i + 1] : '';

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      current += char;
      continue;
    }

    if (char === '`') {
      inCode = !inCode;
      current += char;
      continue;
    }

    if (char === '[' && nextChar === '[') {
      inWikilink = true;
      current += '[[';
      i++;
      continue;
    }

    if (char === ']' && nextChar === ']') {
      inWikilink = false;
      current += ']]';
      i++;
      continue;
    }

    if (char === '|' && !inCode && !inWikilink) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export function markdownToHtml(markdown: string): string {
  if (!markdown) return '<p><br></p>';

  const lines = markdown.split('\n');
  const htmlParts: string[] = [];

  let inCodeBlock = false;
  let codeLang = '';
  let codeLines: string[] = [];

  let inCallout = false;
  let calloutType = 'note';
  let calloutFold = '';
  let calloutCustomTitle = '';
  let calloutLines: string[] = [];

  let inTable = false;
  let tableLines: string[] = [];

  let inList = false;
  let listType: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];

  const flushCodeBlock = () => {
    const codeText = escapeHtml(codeLines.join('\n'));
    htmlParts.push(
      `<div class="code-block-wrapper" data-language="${escapeHtml(codeLang)}"><pre><code class="language-${escapeHtml(codeLang)}">${codeText}</code></pre></div>`
    );
    codeLines = [];
    inCodeBlock = false;
    codeLang = '';
  };

  const flushCallout = () => {
    const normType = calloutType.toLowerCase();
    const conf = CALLOUT_CONFIG[normType];
    const customDefs = typeof window !== 'undefined' ? getParsedCustomCallouts() : [];
    const customDef = customDefs.find((c) => c.id === normType);

    const defaultTitle = conf
      ? conf.defaultTitle
      : (customDef
          ? customDef.name
          : normType.split(/[-_]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));

    const titleToShow = calloutCustomTitle || defaultTitle;
    const customStyle = customDef ? `style="--callout-color: ${customDef.color};"` : '';

    const paragraphs: string[] = [];
    let currentPara: string[] = [];

    calloutLines.forEach((cl) => {
      if (cl.trim() === '') {
        if (currentPara.length > 0) {
          paragraphs.push(currentPara.join('<br>'));
          currentPara = [];
        }
      } else {
        currentPara.push(formatInline(cl));
      }
    });
    if (currentPara.length > 0) {
      paragraphs.push(currentPara.join('<br>'));
    }

    const bodyHtml = paragraphs.length > 0
      ? paragraphs.map((p) => `<p>${p}</p>`).join('')
      : '';

    const foldAttr = calloutFold ? `data-callout-fold="${escapeHtml(calloutFold)}"` : '';
    const titleAttr = calloutCustomTitle ? `data-callout-title="${escapeHtml(calloutCustomTitle)}"` : '';

    htmlParts.push(
      `<div class="callout my-4 rounded-lg border-l-4 p-4 text-sm font-sans shadow-sm transition-all" data-callout="true" data-callout-type="${normType}" data-callout="${normType}" ${foldAttr} ${titleAttr} ${customStyle}><div class="callout-header flex items-center gap-2 font-semibold select-none mb-2" contenteditable="false"><span class="callout-icon flex-shrink-0"></span><span class="callout-title uppercase tracking-wide text-xs font-bold">${escapeHtml(titleToShow)}</span></div><div class="callout-content text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">${bodyHtml}</div></div>`
    );

    calloutLines = [];
    inCallout = false;
  };

  const flushTable = () => {
    if (tableLines.length < 2) {
      tableLines.forEach((tl) => {
        htmlParts.push(`<p>${formatInline(tl)}</p>`);
      });
      tableLines = [];
      inTable = false;
      return;
    }

    const headerLine = tableLines[0];
    const separatorLine = tableLines[1];
    const dataLines = tableLines.slice(2);

    const headerCells = splitTableCells(headerLine);
    const sepCells = splitTableCells(separatorLine);

    const alignments: ('left' | 'center' | 'right')[] = sepCells.map((sc) => {
      const t = sc.replace(/\s+/g, '');
      if (t.startsWith(':') && t.endsWith(':')) return 'center';
      if (t.endsWith(':')) return 'right';
      if (t.startsWith(':')) return 'left';
      return 'left';
    });

    const numCols = headerCells.length;

    const thHtml = headerCells.map((h, i) => {
      const align = alignments[i] || 'left';
      const formatted = formatInline(h) || '<br>';
      return `<th style="text-align: ${align};">${formatted}</th>`;
    }).join('');

    const trHtml = dataLines.map((dl) => {
      const cells = splitTableCells(dl);
      const tds: string[] = [];
      for (let i = 0; i < numCols; i++) {
        const c = i < cells.length ? cells[i] : '';
        const align = alignments[i] || 'left';
        const formatted = formatInline(c) || '<br>';
        tds.push(`<td style="text-align: ${align};">${formatted}</td>`);
      }
      return `<tr>${tds.join('')}</tr>`;
    }).join('');

    htmlParts.push(
      `<div class="table-wrapper"><table class="note-table"><thead><tr>${thHtml}</tr></thead><tbody>${trHtml}</tbody></table></div>`
    );

    tableLines = [];
    inTable = false;
  };

  const flushList = () => {
    if (!listType || listItems.length === 0) {
      inList = false;
      listType = null;
      listItems = [];
      return;
    }
    const tag = listType;
    htmlParts.push(`<${tag}>${listItems.join('')}</${tag}>`);
    inList = false;
    listType = null;
    listItems = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        if (inCallout) flushCallout();
        if (inTable) flushTable();
        if (inList) flushList();
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Callout header
    const calloutMatch = line.match(/^>\s*\[!([a-zA-Z0-9_-]+)\]([+-])?\s*(.*)$/);
    if (calloutMatch) {
      if (inCallout) flushCallout();
      if (inTable) flushTable();
      if (inList) flushList();
      inCallout = true;
      calloutType = calloutMatch[1];
      calloutFold = calloutMatch[2] || '';
      calloutCustomTitle = calloutMatch[3]?.trim() || '';
      continue;
    }

    if (inCallout) {
      if (line.startsWith('>')) {
        calloutLines.push(line.replace(/^>\s?/, ''));
        continue;
      } else {
        flushCallout();
      }
    }

    // Tables
    const trimmed = line.trim();
    if (trimmed.startsWith('|') || (trimmed.includes('|') && (inTable || (i + 1 < lines.length && /^\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)+\|?$/.test(lines[i + 1].trim()))))) {
      if (!inTable) {
        if (inList) flushList();
        inTable = true;
      }
      tableLines.push(line);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Task items
    const taskMatch = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s*(.*)$/);
    if (taskMatch) {
      if (inList && listType !== 'ul') flushList();
      if (!inList) {
        inList = true;
        listType = 'ul';
      }
      const isChecked = taskMatch[2].toLowerCase() === 'x';
      const text = taskMatch[3];
      listItems.push(
        `<li class="task-list-item" data-task="true" data-checked="${isChecked}"><input type="checkbox" ${isChecked ? 'checked' : ''} /> ${formatInline(text)}</li>`
      );
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
    if (ulMatch) {
      if (inList && listType !== 'ul') flushList();
      if (!inList) {
        inList = true;
        listType = 'ul';
      }
      listItems.push(`<li>${formatInline(ulMatch[2])}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (olMatch) {
      if (inList && listType !== 'ol') flushList();
      if (!inList) {
        inList = true;
        listType = 'ol';
      }
      listItems.push(`<li>${formatInline(olMatch[2])}</li>`);
      continue;
    }

    if (inList) {
      flushList();
    }

    // Headings
    const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const text = hMatch[2];
      htmlParts.push(`<h${level}>${formatInline(text)}</h${level}>`);
      continue;
    }

    // Horizontal Rule
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
      htmlParts.push('<hr>');
      continue;
    }

    // Figure HTML
    if (line.includes('<figure>')) {
      let figureBlock = line;
      while (i + 1 < lines.length && !figureBlock.includes('</figure>')) {
        i++;
        figureBlock += '\n' + lines[i];
      }
      htmlParts.push(figureBlock);
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      htmlParts.push(`<blockquote><p>${formatInline(line.replace(/^>\s?/, ''))}</p></blockquote>`);
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      htmlParts.push('<p><br></p>');
      continue;
    }

    // Normal paragraph
    htmlParts.push(`<p>${formatInline(line)}</p>`);
  }

  if (inCodeBlock) flushCodeBlock();
  if (inCallout) flushCallout();
  if (inTable) flushTable();
  if (inList) flushList();

  return htmlParts.join('\n');
}

// Unified DOM-like Node Interface for both Browser and Node.js testing
export interface GenericNode {
  nodeType: number;
  tagName?: string;
  textContent: string | null;
  innerHTML?: string;
  childNodes: ArrayLike<GenericNode>;
  attributes?: Record<string, string>;
  getAttribute(name: string): string | null;
  hasAttribute?(name: string): boolean;
  classList?: {
    contains(className: string): boolean;
  };
  style?: {
    textAlign?: string;
    [key: string]: any;
  };
  querySelector?(selector: string): GenericNode | null;
  querySelectorAll?(selector: string): ArrayLike<GenericNode>;
  cloneNode?(deep?: boolean): GenericNode;
}

function createMiniElement(tag: string): GenericNode {
  const attributes: Record<string, string> = {};
  const styleObj: { textAlign?: string; [key: string]: any } = {};
  const children: GenericNode[] = [];

  const el: GenericNode = {
    nodeType: 1,
    tagName: tag.toUpperCase(),
    textContent: '',
    innerHTML: '',
    childNodes: children,
    attributes,
    style: styleObj,
    classList: {
      contains: (cls: string) => {
        const classVal = attributes['class'] || '';
        return classVal.split(/\s+/).includes(cls);
      },
    },
    getAttribute: (name: string) => attributes[name.toLowerCase()] ?? null,
    hasAttribute: (name: string) => name.toLowerCase() in attributes,
    querySelector: (sel: string) => {
      const all = el.querySelectorAll!(sel);
      return all.length > 0 ? all[0] : null;
    },
    querySelectorAll: (sel: string) => {
      const results: GenericNode[] = [];
      const cleanSel = sel.replace(/^:scope\s*>\s*/, '').trim();

      const matchElement = (node: GenericNode, s: string): boolean => {
        if (node.nodeType !== 1) return false;
        const tagLower = (node.tagName || '').toLowerCase();
        if (s === 'table') return tagLower === 'table';
        if (s === 'thead') return tagLower === 'thead';
        if (s === 'tbody') return tagLower === 'tbody';
        if (s === 'tr') return tagLower === 'tr';
        if (s === 'th') return tagLower === 'th';
        if (s === 'td') return tagLower === 'td';
        if (s === 'li') return tagLower === 'li';
        if (s === 'p') return tagLower === 'p';
        if (s === 'code') return tagLower === 'code';
        if (s === 'img') return tagLower === 'img';
        if (s === 'figcaption') return tagLower === 'figcaption';
        if (s === 'input[type="checkbox"]') return tagLower === 'input' && node.getAttribute('type') === 'checkbox';
        if (s.startsWith('.')) return node.classList ? node.classList.contains(s.slice(1)) : false;
        if (s === 'th, td' || s === 'td, th') return tagLower === 'th' || tagLower === 'td';
        if (s === 'li, div.task-item' || s === ':scope > li, :scope > div.task-item') {
          return tagLower === 'li' || (tagLower === 'div' && (node.classList?.contains('task-item') || false));
        }
        return tagLower === s.toLowerCase();
      };

      const traverse = (current: GenericNode) => {
        const count = current.childNodes.length;
        for (let i = 0; i < count; i++) {
          const child = current.childNodes[i];
          if (matchElement(child, cleanSel)) {
            results.push(child);
          }
          traverse(child);
        }
      };

      traverse(el);
      return results;
    },
    cloneNode: (deep = true) => {
      const clone = createMiniElement(tag);
      for (const [k, v] of Object.entries(attributes)) {
        (clone as any).attributes[k] = v;
      }
      if (styleObj.textAlign) {
        clone.style!.textAlign = styleObj.textAlign;
      }
      if (deep) {
        for (let i = 0; i < children.length; i++) {
          const childClone = children[i].cloneNode ? children[i].cloneNode!(true) : children[i];
          (clone.childNodes as GenericNode[]).push(childClone);
        }
      }
      return clone;
    },
  };

  Object.defineProperty(el, 'textContent', {
    get: () => {
      let text = '';
      const collect = (n: GenericNode) => {
        if (n.nodeType === 3) text += n.textContent || '';
        const count = n.childNodes.length;
        for (let i = 0; i < count; i++) collect(n.childNodes[i]);
      };
      collect(el);
      return text;
    },
  });

  return el;
}

export function parseHtmlStringToNodes(html: string): GenericNode {
  const root = createMiniElement('div');
  const stack: GenericNode[] = [root];

  const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9_-]+)((?:\s+[^=>\/]+(?:=(?:"[^"]*"|'[^']*'|[^>\s]+))?)*)\s*(\/?)>|([^<]+)/g;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const [full, isClosing, tagName, rawAttrs, isSelfClosing, textContent] = match;

    if (full.startsWith('<!--')) {
      continue;
    }

    if (textContent) {
      const decodedText = textContent
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');

      const textNode: GenericNode = {
        nodeType: 3,
        textContent: decodedText,
        childNodes: [],
        getAttribute: () => null,
        cloneNode: () => ({ ...textNode }),
      };
      (stack[stack.length - 1].childNodes as GenericNode[]).push(textNode);
      continue;
    }

    const tag = tagName.toLowerCase();
    const selfClosing = isSelfClosing === '/' || ['br', 'img', 'hr', 'input'].includes(tag);

    if (isClosing) {
      for (let i = stack.length - 1; i > 0; i--) {
        if ((stack[i].tagName || '').toLowerCase() === tag) {
          stack.length = i;
          break;
        }
      }
    } else {
      const el = createMiniElement(tag);
      if (rawAttrs) {
        const attrRegex = /([a-zA-Z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
          const attrName = attrMatch[1].toLowerCase();
          const rawVal = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';
          const attrVal = rawVal
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
          (el as any).attributes[attrName] = attrVal;
          if (attrName === 'style') {
            const alignMatch = attrVal.match(/text-align:\s*([a-zA-Z]+)/i);
            if (alignMatch) {
              el.style!.textAlign = alignMatch[1].toLowerCase();
            }
          }
        }
      }

      (stack[stack.length - 1].childNodes as GenericNode[]).push(el);

      if (!selfClosing) {
        stack.push(el);
      }
    }
  }

  return root;
}

export function getFormattedChildren(node: GenericNode | HTMLElement): string {
  let result = '';
  const count = node.childNodes.length;
  for (let i = 0; i < count; i++) {
    const child = node.childNodes[i] as unknown as GenericNode;
    result += nodeToMarkdown(child);
  }
  return result;
}

export function wikilinkToMarkdown(el: GenericNode | HTMLElement): string {
  let target = el.getAttribute('data-target') || '';
  let heading = el.getAttribute('data-heading') || '';
  const aliasAttr = el.getAttribute('data-alias');
  const text = getFormattedChildren(el as HTMLElement).trim();

  if (!target) {
    const titleAttr = el.getAttribute('title') || '';
    const openMatch = titleAttr.match(/^Open\s+(.+)$/i);
    const createMatch = titleAttr.match(/Click to create "([^"]+)"/i);
    if (openMatch) {
      target = openMatch[1];
    } else if (createMatch) {
      target = createMatch[1];
    } else if (el.getAttribute('href')) {
      const href = el.getAttribute('href') || '';
      target = href.replace(/^#\/notes\//, '').replace(/\.md$/, '').replace(/^\.\//, '');
    } else if (text) {
      target = text;
    }
  }

  if (!heading && target.includes('#')) {
    const parts = target.split('#');
    target = parts[0];
    heading = parts.slice(1).join('#');
  }

  const targetWithHeading = heading
    ? (target ? `${target}#${heading}` : `#${heading}`)
    : target;

  if (aliasAttr !== null && aliasAttr !== undefined && aliasAttr !== '') {
    if (aliasAttr !== targetWithHeading && aliasAttr !== target) {
      return `[[${targetWithHeading}|${aliasAttr}]]`;
    }
    return `[[${targetWithHeading}]]`;
  }

  if (
    text &&
    text !== targetWithHeading &&
    text !== target &&
    text !== (target ? `${target} > ${heading}` : `#${heading}`)
  ) {
    return `[[${targetWithHeading}|${text}]]`;
  }

  return `[[${targetWithHeading}]]`;
}

export function tableToMarkdown(table: GenericNode | HTMLElement): string {
  const thead = table.querySelector ? table.querySelector('thead') : null;
  const tbody = table.querySelector ? table.querySelector('tbody') : null;

  let headerRow: GenericNode | HTMLElement | null = null;
  const dataRows: (GenericNode | HTMLElement)[] = [];

  if (thead && thead.querySelector) {
    headerRow = thead.querySelector('tr');
  }

  const allTrs = table.querySelectorAll ? (Array.from(table.querySelectorAll('tr') as any) as (GenericNode | HTMLElement)[]) : [];
  if (!headerRow && allTrs.length > 0) {
    headerRow = allTrs[0];
    dataRows.push(...allTrs.slice(1));
  } else if (tbody && tbody.querySelectorAll) {
    dataRows.push(...(Array.from(tbody.querySelectorAll('tr') as any) as (GenericNode | HTMLElement)[]));
  } else {
    dataRows.push(...allTrs.filter((tr) => tr !== headerRow));
  }

  if (!headerRow) return '';

  const thCells = headerRow.querySelectorAll ? (Array.from(headerRow.querySelectorAll('th, td') as any) as (GenericNode | HTMLElement)[]) : [];
  if (thCells.length === 0) return '';

  const numCols = thCells.length;
  const headers: string[] = [];
  const alignments: ('left' | 'center' | 'right')[] = [];

  thCells.forEach((th) => {
    headers.push(
      getFormattedChildren(th)
        .replace(/\n/g, ' ')
        .trim()
    );

    const styleAlign = th.style?.textAlign || th.getAttribute('align') || '';
    if (styleAlign === 'center') {
      alignments.push('center');
    } else if (styleAlign === 'right') {
      alignments.push('right');
    } else {
      alignments.push('left');
    }
  });

  if (dataRows.length > 0) {
    const firstRowCells = dataRows[0].querySelectorAll ? (Array.from(dataRows[0].querySelectorAll('td, th') as any) as (GenericNode | HTMLElement)[]) : [];
    firstRowCells.forEach((td, idx) => {
      if (idx < alignments.length && alignments[idx] === 'left') {
        const styleAlign = td.style?.textAlign || td.getAttribute('align') || '';
        if (styleAlign === 'center') alignments[idx] = 'center';
        else if (styleAlign === 'right') alignments[idx] = 'right';
      }
    });
  }

  const delimiters = alignments.map((align) => {
    if (align === 'center') return ':---:';
    if (align === 'right') return '---:';
    return ':---';
  });

  const rows: string[][] = [];
  dataRows.forEach((tr) => {
    const tdCells = tr.querySelectorAll ? (Array.from(tr.querySelectorAll('td, th') as any) as (GenericNode | HTMLElement)[]) : [];
    const rowValues: string[] = [];
    for (let i = 0; i < numCols; i++) {
      if (i < tdCells.length) {
        const cellText = getFormattedChildren(tdCells[i])
          .replace(/\n/g, ' ')
          .trim();
        rowValues.push(cellText);
      } else {
        rowValues.push('');
      }
    }
    rows.push(rowValues);
  });

  let md = `| ${headers.join(' | ')} |\n`;
  md += `| ${delimiters.join(' | ')} |\n`;
  rows.forEach((row) => {
    md += `| ${row.join(' | ')} |\n`;
  });

  return `${md}\n`;
}

export function calloutToMarkdown(el: GenericNode | HTMLElement): string {
  const type =
    el.getAttribute('data-callout-type') ||
    el.getAttribute('data-callout') ||
    (el.getAttribute('class') || '').match(/callout-([a-zA-Z0-9_-]+)/)?.[1] ||
    'note';
  const fold = el.getAttribute('data-callout-fold') || '';
  const customTitle = el.getAttribute('data-callout-title') || '';

  const headerText = customTitle
    ? `> [!${type.toUpperCase()}]${fold ? fold : ''} ${customTitle}`
    : `> [!${type.toUpperCase()}]${fold ? fold : ''}`;

  const contentEl = (el.querySelector ? el.querySelector('.callout-content') : null) || el;
  const contentBlocks: string[] = [];

  const count = contentEl.childNodes.length;
  const children: GenericNode[] = [];
  for (let i = 0; i < count; i++) {
    children.push(contentEl.childNodes[i] as unknown as GenericNode);
  }

  let hasBlockChildren = false;
  children.forEach((child) => {
    if (child.nodeType === 1) {
      const tag = (child.tagName || '').toLowerCase();
      if (['p', 'div', 'ul', 'ol', 'pre', 'blockquote', 'table', 'figure'].includes(tag)) {
        hasBlockChildren = true;
      }
    }
  });

  if (hasBlockChildren) {
    children.forEach((child) => {
      if (child.nodeType === 1) {
        const tag = (child.tagName || '').toLowerCase();
        if (tag === 'p' || tag === 'div') {
          const text = getFormattedChildren(child).trim();
          if (!text || (child.innerHTML && child.innerHTML === '<br>')) {
            contentBlocks.push('');
          } else {
            contentBlocks.push(text);
          }
        } else if (tag === 'ul' || tag === 'ol' || tag === 'pre' || tag === 'blockquote') {
          const blockText = nodeToMarkdown(child).trim();
          if (blockText) {
            contentBlocks.push(blockText);
          }
        } else {
          const text = nodeToMarkdown(child).trim();
          if (text) {
            contentBlocks.push(text);
          }
        }
      } else if (child.nodeType === 3) {
        const text = child.textContent?.trim();
        if (text) {
          contentBlocks.push(text);
        }
      }
    });
  } else {
    const inlineContent = getFormattedChildren(contentEl as HTMLElement).trim();
    if (inlineContent) {
      contentBlocks.push(...inlineContent.split('\n'));
    }
  }

  const hasMeaningfulContent = contentBlocks.length > 0 && contentBlocks.some((b) => b.trim() !== '');
  if (!hasMeaningfulContent) {
    return `${headerText}\n\n`;
  }

  const bodyLines: string[] = [];
  contentBlocks.forEach((block, idx) => {
    const lines = block.split('\n');
    lines.forEach((l) => {
      if (l.trim() === '') {
        bodyLines.push('>');
      } else {
        bodyLines.push(`> ${l}`);
      }
    });
    if (idx < contentBlocks.length - 1 && block.trim() !== '') {
      bodyLines.push('>');
    }
  });

  const cleanedBodyLines: string[] = [];
  for (let i = 0; i < bodyLines.length; i++) {
    if (bodyLines[i] === '>' && cleanedBodyLines[cleanedBodyLines.length - 1] === '>') {
      continue;
    }
    cleanedBodyLines.push(bodyLines[i]);
  }

  const result = [headerText, ...cleanedBodyLines].join('\n');
  return `${result}\n\n`;
}

export function nodeToMarkdown(node: GenericNode | HTMLElement): string {
  if (node.nodeType === 3) {
    return node.textContent || '';
  }

  if (node.nodeType !== 1) {
    return '';
  }

  const tagName = (node.tagName || '').toLowerCase();
  const classList = node.classList || { contains: () => false };

  // 1. Table Wrapper or Table
  if (classList.contains('table-wrapper')) {
    const table = node.querySelector ? node.querySelector('table') : null;
    if (table) {
      return tableToMarkdown(table);
    }
    return getFormattedChildren(node);
  }

  if (tagName === 'table') {
    return tableToMarkdown(node);
  }

  // 2. Callout
  if (classList.contains('callout') || (node.hasAttribute && node.hasAttribute('data-callout')) || node.getAttribute('data-callout') === 'true') {
    return calloutToMarkdown(node);
  }

  // 3. Wikilink
  if (
    node.getAttribute('data-wikilink') === 'true' ||
    classList.contains('wikilink') ||
    classList.contains('wikilink-ghost')
  ) {
    return wikilinkToMarkdown(node);
  }

  // 4. Headings
  if (/^h[1-6]$/.test(tagName)) {
    const level = parseInt(tagName[1], 10);
    const hashes = '#'.repeat(level);
    const text = getFormattedChildren(node).trim();
    return `${hashes} ${text}\n\n`;
  }

  // 5. Code Block
  if (tagName === 'pre' || classList.contains('code-block-wrapper')) {
    const codeEl = (node.querySelector ? node.querySelector('code') : null) || node;
    const lang =
      codeEl.getAttribute('data-language') ||
      (codeEl.getAttribute('class') || '').match(/language-([a-zA-Z0-9_-]+)/)?.[1] ||
      node.getAttribute('data-language') ||
      '';
    const codeText = codeEl.textContent || '';
    return `\`\`\`${lang}\n${codeText.replace(/\n$/, '')}\n\`\`\`\n\n`;
  }

  // 6. Blockquote
  if (tagName === 'blockquote') {
    const inner = getFormattedChildren(node).trim();
    const lines = inner.split('\n');
    return lines.map((l) => (l.trim() ? `> ${l}` : '>')).join('\n') + '\n\n';
  }

  // 7. Horizontal Rule
  if (tagName === 'hr') {
    return '---\n\n';
  }

  // 8. Lists
  if (tagName === 'ul') {
    let result = '';
    const items = node.querySelectorAll ? (Array.from(node.querySelectorAll(':scope > li, :scope > div.task-item') as any) as (GenericNode | HTMLElement)[]) : [];
    items.forEach((item) => {
      const isTask =
        item.getAttribute('data-task') === 'true' ||
        (item.classList?.contains('task-list-item') || false) ||
        (item.querySelector ? !!item.querySelector('input[type="checkbox"]') : false);

      if (isTask) {
        const checkbox = item.querySelector ? item.querySelector('input[type="checkbox"]') : null;
        const checked = (checkbox as any)?.checked ?? (item.getAttribute('data-checked') === 'true');
        const clone = item.cloneNode ? (item.cloneNode(true) as GenericNode | HTMLElement) : item;
        const text = getFormattedChildren(clone).replace(/^\[[ xX]\]\s*/, '').trim();
        result += `- [${checked ? 'x' : ' '}] ${text}\n`;
      } else {
        const text = getFormattedChildren(item).trim();
        result += `- ${text}\n`;
      }
    });
    return result ? `${result}\n` : '';
  }

  if (tagName === 'ol') {
    let result = '';
    const items = node.querySelectorAll ? (Array.from(node.querySelectorAll(':scope > li') as any) as (GenericNode | HTMLElement)[]) : [];
    items.forEach((item, idx) => {
      const text = getFormattedChildren(item).trim();
      result += `${idx + 1}. ${text}\n`;
    });
    return result ? `${result}\n` : '';
  }

  // 9. Paragraph & Divs
  if (tagName === 'p') {
    const inner = getFormattedChildren(node);
    if (!inner.trim() && (node.innerHTML === '<br>' || !node.textContent)) {
      return '\n';
    }
    return `${inner.trim()}\n\n`;
  }

  if (tagName === 'div') {
    if (node.getAttribute('data-task') === 'true' || classList.contains('task-item')) {
      const checkbox = node.querySelector ? node.querySelector('input[type="checkbox"]') : null;
      const checked = (checkbox as any)?.checked ?? (node.getAttribute('data-checked') === 'true');
      const clone = node.cloneNode ? (node.cloneNode(true) as GenericNode | HTMLElement) : node;
      const text = getFormattedChildren(clone).replace(/^\[[ xX]\]\s*/, '').trim();
      return `- [${checked ? 'x' : ' '}] ${text}\n\n`;
    }
    const inner = getFormattedChildren(node);
    if (!inner.trim() && (node.innerHTML === '<br>' || !node.textContent)) {
      return '\n';
    }
    return `${inner}\n`;
  }

  // 10. Inline formatting elements
  if (tagName === 'strong' || tagName === 'b') {
    const inner = getFormattedChildren(node);
    if (!inner.trim()) return inner;
    const leading = inner.match(/^\s*/)?.[0] || '';
    const trailing = inner.match(/\s*$/)?.[0] || '';
    return `${leading}**${inner.trim()}**${trailing}`;
  }

  if (tagName === 'em' || tagName === 'i') {
    const inner = getFormattedChildren(node);
    if (!inner.trim()) return inner;
    const leading = inner.match(/^\s*/)?.[0] || '';
    const trailing = inner.match(/\s*$/)?.[0] || '';
    return `${leading}*${inner.trim()}*${trailing}`;
  }

  if (tagName === 'del' || tagName === 's' || tagName === 'strike') {
    const inner = getFormattedChildren(node);
    if (!inner.trim()) return inner;
    const leading = inner.match(/^\s*/)?.[0] || '';
    const trailing = inner.match(/\s*$/)?.[0] || '';
    return `${leading}~~${inner.trim()}~~${trailing}`;
  }

  if (tagName === 'code') {
    return `\`${node.textContent || ''}\``;
  }

  if (tagName === 'kbd') {
    return `<kbd>${node.textContent || ''}</kbd>`;
  }

  if (tagName === 'a') {
    const href = node.getAttribute('href') || '';
    const title = node.getAttribute('title');
    const text = getFormattedChildren(node);
    if (title) {
      return `[${text}](${href} "${title}")`;
    }
    return `[${text}](${href})`;
  }

  if (tagName === 'img') {
    const alt = node.getAttribute('alt') || '';
    const src = node.getAttribute('src') || '';
    const classList = node.classList || { contains: () => false };
    if (classList.contains('note-embed-img')) {
      return alt && alt !== src ? `![[${src}|${alt}]]` : `![[${src}]]`;
    }
    const title = node.getAttribute('title');
    if (title) {
      return `![${alt}](${src} "${title}")`;
    }
    return `![${alt}](${src})`;
  }

  if (tagName === 'figure') {
    const img = node.querySelector ? node.querySelector('img') : null;
    const figcaption = node.querySelector ? node.querySelector('figcaption') : null;
    if (img && figcaption) {
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      const captionText = getFormattedChildren(figcaption).trim();
      return `<figure><img src="${src}" alt="${alt}" /><figcaption>${captionText}</figcaption></figure>\n\n`;
    } else if (img) {
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      return `![${alt}](${src})\n\n`;
    }
  }

  if (tagName === 'br') {
    return '\n';
  }

  return getFormattedChildren(node);
}

export function htmlToMarkdown(input: string | GenericNode | HTMLElement): string {
  let rootEl: GenericNode;

  if (typeof input === 'string') {
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(input, 'text/html');
      rootEl = doc.body as unknown as GenericNode;
    } else if (typeof document !== 'undefined') {
      const div = document.createElement('div');
      div.innerHTML = input;
      rootEl = div as unknown as GenericNode;
    } else {
      rootEl = parseHtmlStringToNodes(input);
    }
  } else {
    rootEl = input as unknown as GenericNode;
  }

  let md = '';
  const count = rootEl.childNodes.length;
  for (let i = 0; i < count; i++) {
    md += nodeToMarkdown(rootEl.childNodes[i]);
  }

  md = md.replace(/\n{3,}/g, '\n\n');
  return md.trim();
}

interface NoteEditorProps {
  note: NoteData;
  allNotePaths: string[];
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  allNotePaths,
  onSave,
  onCancel,
}) => {
  const [content, setContent] = useState(note.content);
  const [mode, setMode] = useState<'visual' | 'split' | 'markdown'>('visual');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Callout Dropdown & Custom Callout State
  const [showCalloutDropdown, setShowCalloutDropdown] = useState(false);
  const [calloutFoldableState, setCalloutFoldableState] = useState<'' | '+' | '-'>('');
  const [calloutTitleOnly, setCalloutTitleOnly] = useState(false);
  const [showCustomCalloutModal, setShowCustomCalloutModal] = useState(false);
  const [customCallouts, setCustomCallouts] = useState<CustomCalloutDef[]>(() => {
    return typeof window !== 'undefined' ? getParsedCustomCallouts() : [];
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visualEditorRef = useRef<HTMLDivElement>(null);
  const calloutDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectCustomCalloutsCSS();
    const handleCustomCalloutUpdate = () => {
      setCustomCallouts(getParsedCustomCallouts());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(CUSTOM_CALLOUTS_EVENT, handleCustomCalloutUpdate);
      return () => window.removeEventListener(CUSTOM_CALLOUTS_EVENT, handleCustomCalloutUpdate);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calloutDropdownRef.current && !calloutDropdownRef.current.contains(e.target as Node)) {
        setShowCalloutDropdown(false);
      }
    };
    if (showCalloutDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCalloutDropdown]);

  useEffect(() => {
    setContent(note.content);
    if (visualEditorRef.current) {
      visualEditorRef.current.innerHTML = markdownToHtml(note.content);
    }
  }, [note.content]);

  useEffect(() => {
    if (mode === 'visual' && visualEditorRef.current) {
      visualEditorRef.current.innerHTML = markdownToHtml(content);
    }
  }, [mode]);

  const handleVisualInput = useCallback(() => {
    if (visualEditorRef.current) {
      const md = htmlToMarkdown(visualEditorRef.current as unknown as GenericNode);
      setContent(md);
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let markdownToSave = content;
      if (mode === 'visual' && visualEditorRef.current) {
        markdownToSave = htmlToMarkdown(visualEditorRef.current as unknown as GenericNode);
        setContent(markdownToSave);
      }
      await onSave(markdownToSave);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut Cmd/Ctrl + S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, mode]);

  const handleModeChange = (newMode: 'visual' | 'split' | 'markdown') => {
    if (mode === 'visual' && visualEditorRef.current) {
      const md = htmlToMarkdown(visualEditorRef.current as unknown as GenericNode);
      setContent(md);
    }
    if ((mode === 'markdown' || mode === 'split') && newMode === 'visual') {
      if (visualEditorRef.current) {
        visualEditorRef.current.innerHTML = markdownToHtml(content);
      }
    }
    setMode(newMode);
  };

  const insertText = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end) || defaultText;
    const replacement = `${before}${selected}${after}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const execVisualCommand = (cmd: string, val?: string) => {
    if (visualEditorRef.current) {
      visualEditorRef.current.focus();
      document.execCommand(cmd, false, val);
      handleVisualInput();
    }
  };

  const handleBold = () => {
    if (mode === 'visual') {
      execVisualCommand('bold');
    } else {
      insertText('**', '**', 'bold text');
    }
  };

  const handleItalic = () => {
    if (mode === 'visual') {
      execVisualCommand('italic');
    } else {
      insertText('*', '*', 'italic text');
    }
  };

  const handleStrikethrough = () => {
    if (mode === 'visual') {
      execVisualCommand('strikeThrough');
    } else {
      insertText('~~', '~~', 'strikethrough text');
    }
  };

  const handleHeading = (level: 1 | 2 | 3) => {
    if (mode === 'visual') {
      execVisualCommand('formatBlock', `h${level}`);
    } else {
      insertText('#'.repeat(level) + ' ', '', `Heading ${level}`);
    }
  };

  const handleBulletList = () => {
    if (mode === 'visual') {
      execVisualCommand('insertUnorderedList');
    } else {
      insertText('- ', '', 'List item');
    }
  };

  const handleOrderedList = () => {
    if (mode === 'visual') {
      execVisualCommand('insertOrderedList');
    } else {
      insertText('1. ', '', 'Numbered item');
    }
  };

  const handleChecklist = () => {
    if (mode === 'visual') {
      const taskHtml = `<ul class="task-list my-2"><li class="task-list-item flex items-center gap-2" data-task="true" data-checked="false"><input type="checkbox" /> Task item</li></ul><p><br></p>`;
      execVisualCommand('insertHTML', taskHtml);
    } else {
      insertText('- [ ] ', '', 'Task item');
    }
  };

  const handleWikilink = () => {
    if (mode === 'visual') {
      const sel = window.getSelection();
      const text = sel ? sel.toString() : '';
      const target = text || 'Note Name';
      const linkHtml = `<span class="wikilink" data-wikilink="true" data-target="${escapeHtml(target)}" data-heading="" data-alias="">${escapeHtml(target)}</span>&nbsp;`;
      execVisualCommand('insertHTML', linkHtml);
    } else {
      insertText('[[', ']]', 'Note Name');
    }
  };

  const handleInsertCallout = (typeId: string, label: string) => {
    setShowCalloutDropdown(false);
    const foldMod = calloutFoldableState;
    const titleOnly = calloutTitleOnly;
    const normType = typeId.toLowerCase();
    const conf = CALLOUT_CONFIG[normType];
    const customDef = customCallouts.find((c) => c.id === normType);
    const displayTitle = label || (conf ? conf.defaultTitle : (customDef ? customDef.name : normType.charAt(0).toUpperCase() + normType.slice(1)));

    if (mode === 'visual') {
      const foldAttr = foldMod ? `data-callout-fold="${foldMod}"` : '';
      const customStyle = customDef ? `style="--callout-color: ${customDef.color};"` : '';
      const bodyHtml = titleOnly ? '' : `<p>${displayTitle} details here...</p>`;

      const calloutHtml = `<div class="callout my-4 rounded-lg border-l-4 p-4 text-sm font-sans shadow-sm transition-all" data-callout="true" data-callout-type="${normType}" data-callout="${normType}" ${foldAttr} ${customStyle}><div class="callout-header flex items-center gap-2 font-semibold select-none mb-2" contenteditable="false"><span class="callout-icon flex-shrink-0"></span><span class="callout-title uppercase tracking-wide text-xs font-bold">${escapeHtml(displayTitle)}</span></div><div class="callout-content text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">${bodyHtml}</div></div><p><br></p>`;
      execVisualCommand('insertHTML', calloutHtml);
    } else {
      if (titleOnly) {
        insertText(`\n> [!${typeId.toUpperCase()}]${foldMod}\n\n`, '', '');
      } else {
        insertText(`\n> [!${typeId.toUpperCase()}]${foldMod}\n> `, '', `${displayTitle} details here...`);
      }
    }
  };

  const handleCodeBlock = () => {
    if (mode === 'visual') {
      const codeHtml = `<div class="code-block-wrapper my-4" data-language="ts"><pre class="p-4 rounded-lg bg-slate-900 text-slate-100 text-sm font-mono overflow-x-auto"><code class="language-ts">// code snippet</code></pre></div><p><br></p>`;
      execVisualCommand('insertHTML', codeHtml);
    } else {
      insertText('\n```ts\n', '\n```\n', '// code snippet');
    }
  };

  const handleTable = () => {
    if (mode === 'visual') {
      const tableHtml = `<div class="table-wrapper"><table class="note-table"><thead><tr><th style="text-align: left;">Header 1</th><th style="text-align: left;">Header 2</th></tr></thead><tbody><tr><td style="text-align: left;"><br></td><td style="text-align: left;"><br></td></tr></tbody></table></div><p><br></p>`;
      execVisualCommand('insertHTML', tableHtml);
    } else {
      insertText('\n| Column 1 | Column 2 |\n| :--- | :--- |\n| Value 1 | Value 2 |\n');
    }
  };

  const handleUploadSuccess = (uploadData: UploadResponse) => {
    if (mode === 'visual') {
      const imgHtml = `<figure class="my-6 p-3 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto text-center"><img src="${uploadData.mediaUrl}" alt="${escapeHtml(uploadData.caption || uploadData.filename)}" class="rounded-lg mx-auto max-h-[420px] object-contain w-full bg-slate-50 dark:bg-slate-950/40" />${uploadData.caption ? `<figcaption class="mt-2 text-center text-xs text-slate-500 dark:text-slate-400 italic font-sans">${escapeHtml(uploadData.caption)}</figcaption>` : ''}</figure><p><br></p>`;
      execVisualCommand('insertHTML', imgHtml);
    } else {
      insertText('\n' + uploadData.markdownSnippet + '\n');
    }
  };

  const previewNoteData: NoteData = {
    ...note,
    content,
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden font-sans">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Formatting Buttons */}
          <button
            onClick={handleBold}
            title="Bold (Ctrl+B)"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={handleItalic}
            title="Italic (Ctrl+I)"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={handleStrikethrough}
            title="Strikethrough"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            onClick={() => handleHeading(1)}
            title="Heading 1"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleHeading(2)}
            title="Heading 2"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleHeading(3)}
            title="Heading 3"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            onClick={handleBulletList}
            title="Bullet List"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={handleOrderedList}
            title="Numbered List"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={handleChecklist}
            title="Checklist Item"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <CheckSquare className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            onClick={handleWikilink}
            title="Insert Wikilink"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Link className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>

          {/* Callout Dropdown Selector */}
          <div className="relative inline-block" ref={calloutDropdownRef}>
            <button
              type="button"
              onClick={() => setShowCalloutDropdown(!showCalloutDropdown)}
              title="Insert Callout"
              className={`flex items-center gap-1 p-1.5 rounded-lg transition-colors ${
                showCalloutDropdown
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showCalloutDropdown && (
              <div className="absolute top-full left-0 mt-1.5 z-40 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                {/* Options Header: Foldable State & Title Only */}
                <div className="p-3 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
                  {/* Foldable state */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Foldable State
                    </div>
                    <div className="grid grid-cols-3 gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setCalloutFoldableState('')}
                        className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all ${
                          calloutFoldableState === ''
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        None
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalloutFoldableState('+')}
                        className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all ${
                          calloutFoldableState === '+'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                        title="Foldable (Expanded '+')"
                      >
                        Expanded (+)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalloutFoldableState('-')}
                        className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all ${
                          calloutFoldableState === '-'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                        title="Foldable (Collapsed '-')"
                      >
                        Collapsed (-)
                      </button>
                    </div>
                  </div>

                  {/* Title Only Toggle */}
                  <label className="flex items-center justify-between cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300 pt-1">
                    <span>Title only (no body block)</span>
                    <input
                      type="checkbox"
                      checked={calloutTitleOnly}
                      onChange={(e) => setCalloutTitleOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                  </label>
                </div>

                {/* Callout Types List */}
                <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Standard Obsidian Types
                  </div>
                  {STANDARD_CALLOUT_TYPES.map((t) => {
                    const IconComp = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleInsertCallout(t.id, t.label)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="p-1 rounded-lg flex-shrink-0"
                            style={{
                              backgroundColor: `${t.color}15`,
                              color: t.color,
                            }}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {t.label}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                          [!{t.id.toUpperCase()}]
                        </span>
                      </button>
                    );
                  })}

                  {/* Custom Callouts (if defined) */}
                  {customCallouts.length > 0 && (
                    <>
                      <div className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <Palette className="w-3 h-3" />
                        <span>Custom Callouts</span>
                      </div>
                      {customCallouts.map((c) => {
                        const CustomIcon = getCalloutIcon(c.iconName);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleInsertCallout(c.id, c.name)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-xl text-left hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-colors group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="p-1 rounded-lg flex-shrink-0"
                                style={{
                                  backgroundColor: `${c.color}15`,
                                  color: c.color,
                                }}
                              >
                                <CustomIcon className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                {c.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: c.color }}
                              />
                              <span className="font-mono text-[10px] text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-300">
                                [!{c.id.toUpperCase()}]
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>

                {/* Bottom Add Custom Callout button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCalloutDropdown(false);
                    setShowCustomCalloutModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50/70 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 border-t border-purple-100 dark:border-purple-900/50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Custom Callout</span>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleCodeBlock}
            title="Code Block"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={handleTable}
            title="Insert Table"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Table className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            title="Upload Photo / Asset"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Upload Media</span>
          </button>
        </div>

        {/* Right actions: Discard Changes, Mode Switch & Save */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Discard Changes
          </button>

          {/* Mode Switch Tabs */}
          <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => handleModeChange('visual')}
              title="Visual WYSIWYG Editor"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                mode === 'visual'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visual</span>
            </button>
            <button
              onClick={() => handleModeChange('split')}
              title="Split Markdown & Preview"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                mode === 'split'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => handleModeChange('markdown')}
              title="Raw Markdown"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                mode === 'markdown'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Visual Mode */}
        {mode === 'visual' && (
          <div className="h-full flex-1 flex flex-col p-6 overflow-y-auto max-w-4xl mx-auto w-full">
            <div
              ref={visualEditorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleVisualInput}
              onBlur={handleVisualInput}
              className="visual-editor-content flex-1 outline-hidden text-slate-800 dark:text-slate-200 min-h-[400px] leading-relaxed"
            />
          </div>
        )}

        {/* Markdown Mode */}
        {mode === 'markdown' && (
          <div className="h-full flex-1 flex flex-col p-4 overflow-y-auto">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your markdown note here..."
              className="w-full h-full p-4 font-mono text-sm leading-relaxed bg-transparent border-none outline-hidden resize-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>
        )}

        {/* Split Mode */}
        {mode === 'split' && (
          <div className="flex-1 flex overflow-hidden">
            <div className="h-full flex-1 flex flex-col p-4 overflow-y-auto md:border-r border-slate-200 dark:border-slate-800">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your markdown note here..."
                className="w-full h-full p-4 font-mono text-sm leading-relaxed bg-transparent border-none outline-hidden resize-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>
            <div className="hidden md:block flex-1 h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-950/40 p-4">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 px-4">Live Preview</div>
              <NoteView
                note={previewNoteData}
                allNotePaths={allNotePaths}
                onOpenNote={() => {}}
              />
            </div>
          </div>
        )}
      </div>

      {/* Image Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        notePath={note.path}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Custom Callout CSS Modal */}
      <CustomCalloutModal
        isOpen={showCustomCalloutModal}
        onClose={() => setShowCustomCalloutModal(false)}
        onSaved={() => {
          setCustomCallouts(getParsedCustomCallouts());
        }}
      />
    </div>
  );
};
