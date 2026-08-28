import React, { useState, useEffect } from 'react';
import { Edit3, X, Folder, FileText } from 'lucide-react';
import { renamePath } from '../api';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPath: string;
  isDir: boolean;
  onRenamed: (oldPath: string, newPath: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  targetPath,
  isDir,
  onRenamed,
}) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && targetPath) {
      const parts = targetPath.split('/');
      const last = parts.pop() || '';
      const initialName = isDir ? last : last.replace(/\.md$|\.markdown$/i, '');
      setName(initialName);
      setError(null);
    }
  }, [isOpen, targetPath, isDir]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const parentFolder = targetPath.includes('/')
    ? targetPath.substring(0, targetPath.lastIndexOf('/'))
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError(`Please enter a valid ${isDir ? 'folder' : 'file'} name`);
      return;
    }

    let finalName = cleanName;
    if (!isDir && !finalName.endsWith('.md') && !finalName.endsWith('.markdown')) {
      finalName = `${finalName}.md`;
    }

    const newPath = parentFolder ? `${parentFolder}/${finalName}` : finalName;

    if (newPath === targetPath) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await renamePath(targetPath, newPath);
      onRenamed(result.oldPath, result.newPath);
      onClose();
    } catch (err: any) {
      setError(err.message || `Failed to rename ${isDir ? 'folder' : 'file'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden font-sans">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            {isDir ? (
              <Folder className="w-5 h-5 text-amber-500" />
            ) : (
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Rename {isDir ? 'Folder' : 'Note'}
            </h3>
          </div>
          <button
            onClick={onClose}
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
              New Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
            <span className="text-slate-400 dark:text-slate-500 font-sans mr-1">Current:</span>
            <span className="text-slate-700 dark:text-slate-300">{targetPath}</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isSubmitting ? 'Renaming...' : 'Rename'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
