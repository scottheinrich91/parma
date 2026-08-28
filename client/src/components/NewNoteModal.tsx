import React, { useState } from 'react';
import { Plus, X, FilePlus } from 'lucide-react';
import { saveNote } from '../api';

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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden font-sans">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <FilePlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Create New Note</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
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
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Folder (Optional, leave blank for root)
            </label>
            <input
              type="text"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="e.g. appliances, recipes, household"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Note</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
