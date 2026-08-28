import React, { useState, useEffect } from 'react';
import { Plus, X, FilePlus, FolderOpen } from 'lucide-react';
import { saveNote } from '../api';
import { FileBrowserModal } from './FileBrowserModal';

interface NewNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (path: string) => void;
  defaultFolder?: string;
}

export const NewNoteModal: React.FC<NewNoteModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  defaultFolder = '',
}) => {
  const [title, setTitle] = useState('');
  const [folder, setFolder] = useState(defaultFolder);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFolder(defaultFolder);
      setTitle('');
      setError(null);
      setIsBrowserOpen(false);
    }
  }, [isOpen, defaultFolder]);

  // Handle ESC key to close modal (if browser modal is not open)
  useEffect(() => {
    if (!isOpen || isBrowserOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isBrowserOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Please enter a note title');
      return;
    }

    const cleanFolder = folder.trim().replace(/^\/+|\/+$/g, '');
    const filename = cleanTitle.endsWith('.md') ? cleanTitle : `${cleanTitle}.md`;
    const targetPath = cleanFolder ? `${cleanFolder}/${filename}` : filename;

    setIsSubmitting(true);
    setError(null);

    try {
      const initialContent = `# ${cleanTitle}\n\nStart writing your note here...\n`;
      await saveNote(targetPath, initialContent);
      onCreated(targetPath);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setFolder(defaultFolder);
    setError(null);
    setIsBrowserOpen(false);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBrowserOpen) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden font-sans">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <FilePlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Create New Note</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Note Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. French Roast Profile"
              autoFocus
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Folder (Optional, leave blank for root)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="e.g. appliances, recipes, household"
                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => setIsBrowserOpen(true)}
                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                <span>Browse...</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Note'}</span>
            </button>
          </div>
        </form>
      </div>

      {isBrowserOpen && (
        <FileBrowserModal
          isOpen={isBrowserOpen}
          title="Select Destination Folder"
          filter="folders"
          useRelativePath={true}
          initialPath={folder}
          onClose={() => setIsBrowserOpen(false)}
          onSelect={(selectedPath) => {
            setFolder(selectedPath);
            setIsBrowserOpen(false);
          }}
        />
      )}
    </div>
  );
};
