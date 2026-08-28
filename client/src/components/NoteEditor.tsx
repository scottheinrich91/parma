import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  CheckSquare, 
  Image as ImageIcon, 
  Save, 
  X, 
  Eye, 
  FileCode,
  Quote,
  Code,
  Info,
  Check
} from 'lucide-react';
import { NoteData } from '../types';
import { NoteView } from './NoteView';
import { UploadModal } from './UploadModal';

interface NoteEditorProps {
  note: NoteData;
  allNotePaths: string[];
  onSave: (newContent: string) => Promise<void>;
  onCancel: () => void;
  onNavigate?: (path: string) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  allNotePaths,
  onSave,
  onCancel,
  onNavigate = () => {},
}) => {
  const [content, setContent] = useState<string>(note?.content || '');
  const [mode, setMode] = useState<'visual' | 'split'>('visual'); // Default: Visual (WYSIWYG) for Steph & family
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  const visualEditorRef = useRef<HTMLDivElement>(null);
  const isInternalVisualUpdate = useRef<boolean>(false);

  // Sync content when note changes
  useEffect(() => {
    setContent(note?.content || '');
  }, [note?.path]);

  // Convert markdown to clean HTML for visual editing
  const markdownToHtml = (md: string): string => {
    if (!md) return '<p><br></p>';

    const lines = md.split('\n');
    const htmlLines: string[] = [];
    let inList = false;
    let inCallout = false;
    let calloutType = 'NOTE';
    let calloutLines: string[] = [];

    const flushCallout = () => {
      if (inCallout) {
        const body = calloutLines.join('<br>');
        htmlLines.push(
          `<div class="callout-block callout-${calloutType.toLowerCase()}" data-callout="${calloutType}" style="border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 12px 0; border-radius: 6px; background-color: rgba(59, 130, 246, 0.08);"><strong>[${calloutType}]</strong> ${body}</div>`
        );
        calloutLines = [];
        inCallout = false;
      }
    };

    const flushList = () => {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Callout check
      const calloutMatch = line.match(/^>\s*\[!([A-Z]+)\]/i);
      if (calloutMatch) {
        flushList();
        flushCallout();
        inCallout = true;
        calloutType = calloutMatch[1].toUpperCase();
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

      // Headings
      if (line.startsWith('# ')) {
        flushList();
        htmlLines.push(`<h1>${formatInline(line.slice(2))}</h1>`);
      } else if (line.startsWith('## ')) {
        flushList();
        htmlLines.push(`<h2>${formatInline(line.slice(3))}</h2>`);
      } else if (line.startsWith('### ')) {
        flushList();
        htmlLines.push(`<h3>${formatInline(line.slice(4))}</h3>`);
      } else if (/^\s*[-*]\s+\[([ xX])\]\s+(.+)$/.test(line)) {
        // Task list
        flushList();
        const taskMatch = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.+)$/);
        if (taskMatch) {
          const checked = taskMatch[1].toLowerCase() === 'x';
          htmlLines.push(
            `<div class="task-item" data-task="${checked ? 'x' : ' '}" style="display: flex; align-items: center; gap: 8px; margin: 4px 0;"><input type="checkbox" ${checked ? 'checked' : ''} disabled /> <span>${formatInline(taskMatch[2])}</span></div>`
          );
        }
      } else if (/^\s*[-*]\s+(.+)$/.test(line)) {
        // Unordered list
        const ulMatch = line.match(/^\s*[-*]\s+(.+)$/);
        if (ulMatch) {
          if (!inList) {
            htmlLines.push('<ul style="list-style-type: disc; padding-left: 24px; margin: 8px 0;">');
            inList = true;
          }
          htmlLines.push(`<li>${formatInline(ulMatch[1])}</li>`);
        }
      } else if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
        flushList();
        htmlLines.push('<hr style="margin: 16px 0; border: none; border-top: 1px solid #e2e8f0;" />');
      } else if (line.trim() === '') {
        flushList();
        htmlLines.push('<p><br></p>');
      } else {
        flushList();
        htmlLines.push(`<p>${formatInline(line)}</p>`);
      }
    }

    flushList();
    flushCallout();

    return htmlLines.join('');
  };

  const formatInline = (text: string): string => {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g, '<span class="wikilink-tag" data-wikilink="$1" style="color: #2563eb; font-weight: 500;">$2</span>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-height: 250px; border-radius: 6px; margin: 8px 0; display: block;" />');
  };

  // Convert rich HTML from visual editor back to clean Markdown
  const htmlToMarkdown = (element: HTMLElement): string => {
    const lines: string[] = [];

    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return '';

      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      // Heading 1
      if (tagName === 'h1') {
        return `# ${getFormattedChildren(el)}\n\n`;
      }
      // Heading 2
      if (tagName === 'h2') {
        return `## ${getFormattedChildren(el)}\n\n`;
      }
      // Heading 3
      if (tagName === 'h3') {
        return `### ${getFormattedChildren(el)}\n\n`;
      }
      // Task item
      if (el.classList.contains('task-item')) {
        const isChecked = el.querySelector('input[type="checkbox"]')?.matches(':checked') || el.getAttribute('data-task') === 'x';
        const spanText = el.querySelector('span')?.innerText || getFormattedChildren(el);
        return `- [${isChecked ? 'x' : ' '}] ${spanText.trim()}\n`;
      }
      // Callout box
      if (el.classList.contains('callout-block')) {
        const type = el.getAttribute('data-callout') || 'NOTE';
        const rawText = el.innerText.replace(/^\[[A-Z]+\]\s*/i, '').trim();
        return `> [!${type}]\n> ${rawText.replace(/\n/g, '\n> ')}\n\n`;
      }
      // Unordered list
      if (tagName === 'ul') {
        let listMarkdown = '';
        el.childNodes.forEach((child) => {
          if (child.nodeName.toLowerCase() === 'li') {
            listMarkdown += `- ${getFormattedChildren(child as HTMLElement).trim()}\n`;
          }
        });
        return listMarkdown + '\n';
      }
      // Paragraph
      if (tagName === 'p' || tagName === 'div') {
        const inner = getFormattedChildren(el);
        if (inner.trim() === '' || inner === '<br>') return '\n';
        return `${inner}\n\n`;
      }
      // Horizontal Rule
      if (tagName === 'hr') {
        return '---\n\n';
      }
      // Blockquote
      if (tagName === 'blockquote') {
        return `> ${getFormattedChildren(el).trim()}\n\n`;
      }
      // Image
      if (tagName === 'img') {
        const alt = el.getAttribute('alt') || 'image';
        const src = el.getAttribute('src') || '';
        return `![${alt}](${src})\n\n`;
      }

      return getFormattedChildren(el);
    };

    const getFormattedChildren = (parent: HTMLElement): string => {
      let result = '';
      parent.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          result += child.textContent;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement;
          const tag = el.tagName.toLowerCase();

          if (tag === 'strong' || tag === 'b') {
            result += `**${getFormattedChildren(el)}**`;
          } else if (tag === 'em' || tag === 'i') {
            result += `*${getFormattedChildren(el)}*`;
          } else if (tag === 'code') {
            result += `\`${el.textContent}\``;
          } else if (tag === 'img') {
            const alt = el.getAttribute('alt') || 'image';
            const src = el.getAttribute('src') || '';
            result += `![${alt}](${src})`;
          } else if (el.classList.contains('wikilink-tag')) {
            const target = el.getAttribute('data-wikilink') || el.textContent;
            result += `[[${target}]]`;
          } else if (tag === 'br') {
            result += '\n';
          } else {
            result += getFormattedChildren(el);
          }
        }
      });
      return result;
    };

    Array.from(element.childNodes).forEach((child) => {
      lines.push(processNode(child));
    });

    return lines.join('').replace(/\n{3,}/g, '\n\n').trim();
  };

  // Initialize visual editor HTML when switching to visual mode
  useEffect(() => {
    if (mode === 'visual' && visualEditorRef.current && !isInternalVisualUpdate.current) {
      visualEditorRef.current.innerHTML = markdownToHtml(content);
    }
  }, [mode]);

  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      isInternalVisualUpdate.current = true;
      const newMd = htmlToMarkdown(visualEditorRef.current);
      setContent(newMd);
      setTimeout(() => {
        isInternalVisualUpdate.current = false;
      }, 50);
    }
  };

  // Rich formatting helpers
  const applyFormat = (command: string, value: string | undefined = undefined) => {
    if (mode === 'visual') {
      document.execCommand(command, false, value);
      handleVisualInput();
    } else {
      // Split mode textarea formatting
      const ta = document.querySelector('textarea') as HTMLTextAreaElement;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = content.substring(start, end);
      let replacement = selected;

      switch (command) {
        case 'bold':
          replacement = `**${selected || 'bold text'}**`;
          break;
        case 'italic':
          replacement = `*${selected || 'italic text'}*`;
          break;
        case 'h1':
          replacement = `\n# ${selected || 'Heading 1'}\n`;
          break;
        case 'h2':
          replacement = `\n## ${selected || 'Heading 2'}\n`;
          break;
        case 'h3':
          replacement = `\n### ${selected || 'Heading 3'}\n`;
          break;
        case 'insertUnorderedList':
          replacement = `\n- ${selected || 'List item'}\n`;
          break;
        case 'task':
          replacement = `\n- [ ] ${selected || 'Task item'}\n`;
          break;
        case 'callout':
          replacement = `\n> [!NOTE]\n> ${selected || 'Note text'}\n`;
          break;
        case 'quote':
          replacement = `\n> ${selected || 'Quote'}\n`;
          break;
        case 'code':
          replacement = `\`${selected || 'code'}\``;
          break;
      }

      const updated = content.substring(0, start) + replacement + content.substring(end);
      setContent(updated);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let finalContent = content;
      if (mode === 'visual' && visualEditorRef.current) {
        finalContent = htmlToMarkdown(visualEditorRef.current);
      }
      await onSave(finalContent);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUploaded = (markdownSnippet: string) => {
    if (mode === 'visual' && visualEditorRef.current) {
      const match = markdownSnippet.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (match) {
        const imgHtml = `<p><img src="${match[2]}" alt="${match[1]}" style="max-height: 250px; border-radius: 6px; margin: 8px 0; display: block;" /></p>`;
        document.execCommand('insertHTML', false, imgHtml);
        handleVisualInput();
      }
    } else {
      setContent((prev) => `${prev}\n\n${markdownSnippet}\n`);
    }
    setIsUploadOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Editor Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 select-none">
        {/* Left: Rich Format Action Tools */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => applyFormat('bold')}
            title="Bold (**text**)"
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('italic')}
            title="Italic (*text*)"
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Italic className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => applyFormat('h1')}
            title="Heading 1"
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('h2')}
            title="Heading 2"
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('h3')}
            title="Heading 3"
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => applyFormat('insertUnorderedList')}
            title="Bullet List (- item)"
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('task')}
            title="Checklist Item (- [ ] task)"
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('callout')}
            title="Callout Box (> [!NOTE])"
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Info className="w-4 h-4 text-blue-500" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('quote')}
            title="Blockquote (> quote)"
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('code')}
            title="Inline Code (`code`)"
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Code className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            title="Upload Image & Camera Snap"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photo</span>
          </button>
        </div>

        {/* Right: Mode Toggle (Visual vs Split) & Save / Cancel */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                if (mode !== 'visual') {
                  setMode('visual');
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                mode === 'visual'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visual</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (mode !== 'split') {
                  if (visualEditorRef.current) {
                    setContent(htmlToMarkdown(visualEditorRef.current));
                  }
                  setMode('split');
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                mode === 'split'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Cancel */}
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Cancel Editing"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs transition-all ${
              saveSuccess
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved ✓</span>
              </>
            ) : isSaving ? (
              <span>Saving...</span>
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
      <div className="flex-1 overflow-hidden relative">
        {mode === 'visual' ? (
          /* True Full WYSIWYG Visual Canvas (Steph & Family Friendly) */
          <div className="h-full overflow-y-auto px-6 sm:px-12 py-8 bg-white dark:bg-slate-900 focus:outline-none">
            <div
              ref={visualEditorRef}
              contentEditable
              onInput={handleVisualInput}
              onBlur={handleVisualInput}
              suppressContentEditableWarning
              className="prose prose-slate dark:prose-invert max-w-3xl mx-auto focus:outline-none min-h-[400px] text-slate-900 dark:text-slate-100 font-sans leading-relaxed"
              style={{ minHeight: '350px' }}
            />
          </div>
        ) : (
          /* Split Markdown View (Power Users) */
          <div className="grid grid-cols-1 md:grid-cols-2 h-full divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
            {/* Raw Textarea */}
            <div className="h-full p-4 overflow-y-auto">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note in Markdown..."
                className="w-full h-full p-3 font-mono text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
              />
            </div>
            {/* Live Rendered Preview */}
            <div className="h-full p-6 overflow-y-auto bg-white dark:bg-slate-900">
              <NoteView
                note={{
                  path: note?.path || 'Untitled.md',
                  title: note?.title || 'Preview',
                  content,
                  raw: content,
                  frontmatter: note?.frontmatter || {},
                  stats: note?.stats || { size: content.length, mtime: new Date().toISOString(), birthtime: new Date().toISOString() }
                }}
                allNotePaths={allNotePaths}
                onOpenNote={onNavigate}
              />
            </div>
          </div>
        )}
      </div>

      {/* Upload Media Modal */}
      {isUploadOpen && (
        <UploadModal
          isOpen={isUploadOpen}
          notePath={note?.path || 'Untitled.md'}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={(uploadData) => handleImageUploaded(uploadData.markdownSnippet)}
        />
      )}
    </div>
  );
};
