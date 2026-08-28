import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  FileText, 
  Copy, 
  Check, 
  ExternalLink, 
  FilePlus, 
  Maximize2, 
  X,
  Tag
} from 'lucide-react';
import { NoteData } from '../types';
import { Callout } from './Callout';

interface NoteViewProps {
  note: NoteData;
  allNotePaths: string[];
  onOpenNote: (path: string) => void;
  onQuickCreateNote?: (targetName: string) => void;
  onToggleTask?: (lineIndex: number, newCheckedState: boolean) => void;
}

export const NoteView: React.FC<NoteViewProps> = ({
  note,
  allNotePaths,
  onOpenNote,
  onQuickCreateNote,
  onToggleTask,
}) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const wordCount = useMemo(() => {
    return note.content.trim().split(/\s+/).filter(Boolean).length;
  }, [note.content]);

  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  const formattedDate = useMemo(() => {
    try {
      return new Date(note.stats.mtime).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  }, [note.stats.mtime]);

  // Resolve relative image src to /api/media?path=...
  const resolveMediaUrl = (src: string) => {
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      return src;
    }
    const cleanSrc = src.replace(/^\.\//, '');
    const noteDir = note.path.includes('/') ? note.path.substring(0, note.path.lastIndexOf('/')) : '';
    const fullRelative = noteDir ? `${noteDir}/${cleanSrc}` : cleanSrc;
    return `/api/media?path=${encodeURIComponent(fullRelative)}`;
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Custom Markdown Parsing & Rendering
  const renderedContent = useMemo(() => {
    const raw = note.content;
    const lines = raw.split('\n');
    const elements: React.ReactNode[] = [];

    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer: string[] = [];
    let codeIndex = 0;

    let inCallout = false;
    let calloutType = 'note';
    let calloutTitle = '';
    let calloutIsFoldable = false;
    let calloutBuffer: string[] = [];

    let inTable = false;
    let tableBuffer: string[] = [];

    const flushCodeBlock = (key: string) => {
      const codeText = codeBuffer.join('\n');
      const idx = codeIndex++;
      elements.push(
        <div key={key} className="relative group my-5 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-md">
          <div className="flex items-center justify-between px-4 py-1.5 bg-slate-950/80 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span>{codeLanguage || 'code'}</span>
            <button
              onClick={() => handleCopyCode(codeText, idx)}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              {copiedCodeIndex === idx ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 text-xs sm:text-sm font-mono text-slate-100 overflow-x-auto leading-relaxed">
            <code>{codeText}</code>
          </pre>
        </div>
      );
      codeBuffer = [];
      inCodeBlock = false;
      codeLanguage = '';
    };

    const flushCallout = (key: string) => {
      const calloutText = calloutBuffer.join('\n');
      elements.push(
        <Callout
          key={key}
          type={calloutType}
          title={calloutTitle}
          isFoldable={calloutIsFoldable}
        >
          <div className="space-y-2">
            {calloutText.split('\n').map((cl, i) => (
              <p key={i}>{parseInlineFormatting(cl)}</p>
            ))}
          </div>
        </Callout>
      );
      calloutBuffer = [];
      inCallout = false;
    };

    const flushTable = (key: string) => {
      if (tableBuffer.length < 2) {
        tableBuffer.forEach((tbl, i) => elements.push(<p key={`${key}-${i}`}>{parseInlineFormatting(tbl)}</p>));
        tableBuffer = [];
        inTable = false;
        return;
      }

      const headerRow = tableBuffer[0];
      const dataRows = tableBuffer.slice(2); // Skip separator row

      const parseCells = (row: string) =>
        row
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim());

      const headers = parseCells(headerRow);

      elements.push(
        <div key={key} className="my-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                {headers.map((h, i) => (
                  <th key={i} className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                    {parseInlineFormatting(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((dr, ri) => (
                <tr key={ri} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  {parseCells(dr).map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {parseInlineFormatting(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

      tableBuffer = [];
      inTable = false;
    };

    // Helper for inline wikilinks, strong, em, images, code
    const parseInlineFormatting = (text: string): React.ReactNode => {
      if (!text) return null;

      // Handle wikilinks: [[target|alias]] or [[target#heading]] or [[target]]
      const parts: React.ReactNode[] = [];
      let cursor = 0;
      const wikilinkRegex = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;
      let match;

      while ((match = wikilinkRegex.exec(text)) !== null) {
        const matchIndex = match.index;
        if (matchIndex > cursor) {
          parts.push(renderBasicInline(text.substring(cursor, matchIndex), `txt-${cursor}`));
        }

        const rawTarget = match[1].trim();
        const heading = match[2]?.trim();
        const alias = match[3]?.trim() || rawTarget;
        const targetClean = rawTarget.replace(/\.md$/i, '').toLowerCase();

        // Check if target exists in allNotePaths
        const exists = allNotePaths.some((p) => {
          const pClean = p.replace(/\.md$/i, '').toLowerCase();
          const baseName = pClean.includes('/') ? pClean.substring(pClean.lastIndexOf('/') + 1) : pClean;
          return pClean === targetClean || baseName === targetClean;
        });

        // Find actual path to open
        const resolvedPath = allNotePaths.find((p) => {
          const pClean = p.replace(/\.md$/i, '').toLowerCase();
          const baseName = pClean.includes('/') ? pClean.substring(pClean.lastIndexOf('/') + 1) : pClean;
          return pClean === targetClean || baseName === targetClean;
        }) || `${rawTarget}.md`;

        if (exists) {
          parts.push(
            <span
              key={`wl-${matchIndex}`}
              onClick={() => onOpenNote(resolvedPath)}
              className="wikilink group"
              title={`Open ${rawTarget}`}
            >
              <span>{alias}</span>
            </span>
          );
        } else {
          parts.push(
            <span
              key={`wl-ghost-${matchIndex}`}
              onClick={() => onQuickCreateNote ? onQuickCreateNote(rawTarget) : onOpenNote(resolvedPath)}
              className="wikilink-ghost group"
              title={`Note does not exist yet. Click to create "${rawTarget}"`}
            >
              <span>{alias}</span>
              <FilePlus className="w-3 h-3 text-rose-400" />
            </span>
          );
        }

        cursor = matchIndex + match[0].length;
      }

      if (cursor < text.length) {
        parts.push(renderBasicInline(text.substring(cursor), `txt-${cursor}`));
      }

      return <>{parts}</>;
    };

    const renderBasicInline = (inlineText: string, keyPrefix: string): React.ReactNode => {
      // 1. Parse standard markdown links and images: [text](url) and ![alt](url)
      const linkOrImgRegex = /(!?\[([^\]]*)\]\(([^)]+)\))/g;
      let match;
      const elementsList: React.ReactNode[] = [];
      let lastIndex = 0;

      while ((match = linkOrImgRegex.exec(inlineText)) !== null) {
        if (match.index > lastIndex) {
          elementsList.push(formatTextStyles(inlineText.substring(lastIndex, match.index), `${keyPrefix}-${lastIndex}`));
        }

        const isImage = match[0].startsWith('!');
        const label = match[2];
        const target = match[3].trim();

        if (isImage) {
          const mediaUrl = resolveMediaUrl(target);
          elementsList.push(
            <span key={`img-${match.index}`} className="inline-block my-2">
              <img
                src={mediaUrl}
                alt={label}
                className="rounded-lg max-h-96 shadow-xs cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => setLightboxImage(mediaUrl)}
              />
            </span>
          );
        } else {
          // Standard markdown link or in-page anchor
          if (target.startsWith('#')) {
            const anchorId = target.slice(1);
            elementsList.push(
              <a
                key={`anchor-${match.index}`}
                href={target}
                onClick={(e) => {
                  e.preventDefault();
                  const targetEl = document.getElementById(anchorId) || 
                                  document.getElementById(anchorId.toLowerCase()) || 
                                  document.getElementById(anchorId.replace(/-+/g, '-')) ||
                                  document.getElementById(anchorId.replace(/--/g, '-'));
                  if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
              >
                {formatTextStyles(label, `link-lbl-${match.index}`)}
              </a>
            );
          } else if (target.startsWith('http://') || target.startsWith('https://')) {
            elementsList.push(
              <a
                key={`ext-${match.index}`}
                href={target}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-0.5"
              >
                <span>{formatTextStyles(label, `ext-lbl-${match.index}`)}</span>
                <ExternalLink className="w-3 h-3 inline-block opacity-70" />
              </a>
            );
          } else {
            // Relative note link
            const targetClean = target.replace(/^\.\//, '');
            elementsList.push(
              <span
                key={`rel-${match.index}`}
                onClick={() => onOpenNote(targetClean)}
                className="wikilink group cursor-pointer text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                <span>{formatTextStyles(label, `rel-lbl-${match.index}`)}</span>
              </span>
            );
          }
        }

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < inlineText.length) {
        elementsList.push(formatTextStyles(inlineText.substring(lastIndex), `${keyPrefix}-${lastIndex}`));
      }

      return <>{elementsList}</>;
    };

    const formatTextStyles = (t: string, key: string): React.ReactNode => {
      // Bold, Italic, Code, Kbd
      const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|<kbd>([^<]+)<\/kbd>)/g;
      const parts: React.ReactNode[] = [];
      let cursor = 0;
      let match;

      while ((match = regex.exec(t)) !== null) {
        if (match.index > cursor) {
          parts.push(t.substring(cursor, match.index));
        }

        if (match[2]) {
          // Bold **...**
          parts.push(<strong key={`${key}-${match.index}`} className="font-semibold text-slate-900 dark:text-slate-100">{match[2]}</strong>);
        } else if (match[3]) {
          // Italic *...*
          parts.push(<em key={`${key}-${match.index}`} className="italic">{match[3]}</em>);
        } else if (match[4]) {
          // Inline code `...`
          parts.push(<code key={`${key}-${match.index}`} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">{match[4]}</code>);
        } else if (match[5]) {
          // <kbd>...</kbd>
          parts.push(<kbd key={`${key}-${match.index}`} className="px-1.5 py-0.5 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700 shadow-xs">{match[5]}</kbd>);
        }

        cursor = match.index + match[0].length;
      }

      if (cursor < t.length) {
        parts.push(t.substring(cursor));
      }

      return <span key={key}>{parts}</span>;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock(`cb-${i}`);
        } else {
          if (inCallout) flushCallout(`co-${i}`);
          if (inTable) flushTable(`tb-${i}`);
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Callouts: > [!NOTE] or > [!NOTE]- Foldable
      const calloutMatch = line.match(/^>\s+\[!([a-zA-Z]+)\](-)?\s*(.*)$/);
      if (calloutMatch) {
        if (inCallout) flushCallout(`co-${i}`);
        if (inTable) flushTable(`tb-${i}`);
        inCallout = true;
        calloutType = calloutMatch[1];
        calloutIsFoldable = !!calloutMatch[2];
        calloutTitle = calloutMatch[3] || '';
        continue;
      }

      if (inCallout) {
        if (line.startsWith('>')) {
          calloutBuffer.push(line.replace(/^>\s?/, ''));
          continue;
        } else {
          flushCallout(`co-${i}`);
        }
      }

      // Tables: lines starting with |
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        if (!inTable) {
          inTable = true;
        }
        tableBuffer.push(line.trim());
        continue;
      } else if (inTable) {
        flushTable(`tb-${i}`);
      }

      // Headings
      const h1Match = line.match(/^#\s+(.+)$/);
      if (h1Match) {
        const titleText = h1Match[1].replace(/[*_`[\]]/g, '');
        const id = titleText.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        elements.push(
          <h1 key={`h1-${i}`} id={id} className="text-3xl font-bold tracking-tight pb-3 mb-6 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 font-sans">
            {parseInlineFormatting(h1Match[1])}
          </h1>
        );
        continue;
      }

      const h2Match = line.match(/^##\s+(.+)$/);
      if (h2Match) {
        const titleText = h2Match[1].replace(/[*_`[\]]/g, '');
        const id = titleText.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        elements.push(
          <h2 key={`h2-${i}`} id={id} className="text-2xl font-semibold tracking-tight pb-2 mt-8 mb-4 border-b border-slate-100 dark:border-slate-800/60 text-slate-900 dark:text-slate-100 font-sans">
            {parseInlineFormatting(h2Match[1])}
          </h2>
        );
        continue;
      }

      const h3Match = line.match(/^###\s+(.+)$/);
      if (h3Match) {
        const titleText = h3Match[1].replace(/[*_`[\]]/g, '');
        const id = titleText.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        elements.push(
          <h3 key={`h3-${i}`} id={id} className="text-xl font-semibold tracking-tight mt-6 mb-3 text-slate-800 dark:text-slate-200 font-sans">
            {parseInlineFormatting(h3Match[1])}
          </h3>
        );
        continue;
      }

      // Horizontal Rule
      if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
        elements.push(<hr key={`hr-${i}`} className="my-8 border-t border-slate-200 dark:border-slate-800" />);
        continue;
      }

      // HTML Figure parsing: <figure><img src="..." alt="..." /><figcaption>...</figcaption></figure>
      if (line.includes('<figure>')) {
        let figureBlock = line;
        while (i + 1 < lines.length && !figureBlock.includes('</figure>')) {
          i++;
          figureBlock += '\n' + lines[i];
        }

        const srcMatch = figureBlock.match(/<img[^>]+src=["']([^"']+)["']/);
        const altMatch = figureBlock.match(/<img[^>]+alt=["']([^"']+)["']/);
        const captionMatch = figureBlock.match(/<figcaption>([\s\S]*?)<\/figcaption>/);

        if (srcMatch) {
          const rawSrc = srcMatch[1];
          const mediaUrl = resolveMediaUrl(rawSrc);
          const altText = altMatch ? altMatch[1] : '';
          const captionText = captionMatch ? captionMatch[1] : '';

          elements.push(
            <figure key={`fig-${i}`} className="my-6 p-3 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-2xl mx-auto text-center">
              <div className="relative group cursor-pointer" onClick={() => setLightboxImage(mediaUrl)}>
                <img
                  src={mediaUrl}
                  alt={altText}
                  className="rounded-xl mx-auto max-h-[420px] object-contain w-full bg-slate-50 dark:bg-slate-950/40 transition-transform group-hover:scale-[1.01]"
                />
                <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>
              {captionText && (
                <figcaption className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic font-sans">
                  {parseInlineFormatting(captionText)}
                </figcaption>
              )}
            </figure>
          );
          continue;
        }
      }

      // Checklists: - [ ] or - [x]
      const taskMatch = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s*(.*)$/);
      if (taskMatch) {
        const isChecked = taskMatch[2].toLowerCase() === 'x';
        const taskText = taskMatch[3];
        const lineIdx = i;
        elements.push(
          <div key={`task-${i}`} className="flex items-start gap-2.5 my-1.5 text-slate-700 dark:text-slate-300 font-sans group">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => {
                onToggleTask?.(lineIdx, e.target.checked);
              }}
              className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 dark:accent-blue-500"
            />
            <span
              onClick={() => {
                onToggleTask?.(lineIdx, !isChecked);
              }}
              className={`cursor-pointer transition-colors ${isChecked ? 'line-through text-slate-400 dark:text-slate-500' : 'hover:text-blue-600 dark:hover:text-blue-400'}`}
            >
              {parseInlineFormatting(taskText)}
            </span>
          </div>
        );
        continue;
      }

      // Unordered lists: - or *
      const ulMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
      if (ulMatch) {
        elements.push(
          <li key={`li-${i}`} className="my-1 text-slate-700 dark:text-slate-300 list-disc ml-6">
            {parseInlineFormatting(ulMatch[2])}
          </li>
        );
        continue;
      }

      // Ordered lists: 1. 2.
      const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
      if (olMatch) {
        elements.push(
          <li key={`oli-${i}`} className="my-1 text-slate-700 dark:text-slate-300 list-decimal ml-6">
            {parseInlineFormatting(olMatch[2])}
          </li>
        );
        continue;
      }

      // Blockquote: > text
      if (line.startsWith('>')) {
        elements.push(
          <blockquote key={`bq-${i}`} className="border-l-4 border-slate-300 dark:border-slate-700 pl-4 py-1 my-3 italic text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/20 rounded-r">
            {parseInlineFormatting(line.replace(/^>\s?/, ''))}
          </blockquote>
        );
        continue;
      }

      // Blank line
      if (line.trim() === '') {
        continue;
      }

      // Regular paragraph
      elements.push(
        <p key={`p-${i}`} className="my-3 text-slate-700 dark:text-slate-300 leading-relaxed">
          {parseInlineFormatting(line)}
        </p>
      );
    }

    if (inCodeBlock) flushCodeBlock('cb-end');
    if (inCallout) flushCallout('co-end');
    if (inTable) flushTable('tb-end');

    return elements;
  }, [note.content, note.path, allNotePaths, copiedCodeIndex, onToggleTask]);

  return (
    <article className="wiki-article max-w-3xl mx-auto px-4 sm:px-8 py-6">
      {/* Article Top Metadata Header */}
      <div className="pb-4 mb-6 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-sans">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="font-mono text-slate-600 dark:text-slate-300 font-medium">{note.path}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{readingTime} min read ({wordCount} words)</span>
          </div>
        </div>
      </div>

      {/* Frontmatter display if available */}
      {note.frontmatter && Object.keys(note.frontmatter).length > 0 && (
        <div className="mb-6 p-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs font-sans">
          <div className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wider text-[10px]">
            <Tag className="w-3 h-3 text-blue-500" />
            <span>Properties & Metadata</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(note.frontmatter).map(([k, v]) => (
              <div key={k} className="p-1.5 rounded bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">{k}</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rendered Body */}
      <div className="wiki-body">
        {renderedContent}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 p-1.5 text-white hover:text-slate-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Enlarged preview"
              className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </article>
  );
};
