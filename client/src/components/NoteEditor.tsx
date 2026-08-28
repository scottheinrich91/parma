import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { NoteData, UploadResponse } from '../types';
import { NoteView } from './NoteView';
import { UploadModal } from './UploadModal';

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
  const [isSplit, setIsSplit] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(note.content);
  }, [note.content]);

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
  }, [content]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(content);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
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

  const handleUploadSuccess = (uploadData: UploadResponse) => {
    insertText('\n' + uploadData.markdownSnippet + '\n');
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
          <button
            onClick={() => insertText('**', '**', 'bold text')}
            title="Bold (Ctrl+B)"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText('*', '*', 'italic text')}
            title="Italic (Ctrl+I)"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText('~~', '~~', 'strikethrough text')}
            title="Strikethrough"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            onClick={() => insertText('# ', '', 'Heading 1')}
            title="Heading 1"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText('## ', '', 'Heading 2')}
            title="Heading 2"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText('### ', '', 'Heading 3')}
            title="Heading 3"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            onClick={() => insertText('- ', '', 'List item')}
            title="Bullet List"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText('1. ', '', 'Numbered item')}
            title="Numbered List"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText('- [ ] ', '', 'Task item')}
            title="Checklist Item"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <CheckSquare className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            onClick={() => insertText('[[', ']]', 'Note Name')}
            title="Insert Wikilink"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Link className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>
          <button
            onClick={() => insertText('\n> [!NOTE]\n> ', '', 'Important note details here...')}
            title="Insert Callout"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </button>
          <button
            onClick={() => insertText('\n```ts\n', '\n```\n', '// code snippet')}
            title="Code Block"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText('\n| Column 1 | Column 2 |\n| :--- | :--- |\n| Value 1 | Value 2 |\n')}
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

        {/* Right actions: Split view toggle & Save */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSplit(!isSplit)}
            title="Toggle Split Preview"
            className={`p-1.5 rounded-lg border transition-colors hidden md:block ${
              isSplit
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Columns className="w-4 h-4" />
          </button>

          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Done
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
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

      {/* Editor & Preview Split Panes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Textarea */}
        <div className={`h-full flex-1 flex flex-col p-4 overflow-y-auto ${isSplit ? 'md:border-r border-slate-200 dark:border-slate-800' : ''}`}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your markdown note here..."
            className="w-full h-full p-4 font-mono text-sm leading-relaxed bg-transparent border-none outline-hidden resize-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        {/* Live Preview Pane */}
        {isSplit && (
          <div className="hidden md:block flex-1 h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-950/40 p-4">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 px-4">Live Preview</div>
            <NoteView
              note={previewNoteData}
              allNotePaths={allNotePaths}
              onOpenNote={() => {}}
            />
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
    </div>
  );
};
