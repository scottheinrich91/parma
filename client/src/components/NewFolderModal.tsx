import React, { useState, useEffect, useMemo } from 'react';
import { FolderPlus, X, Folder } from 'lucide-react';
import { createFolder } from '../api';
import { VaultNode } from '../types';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (folderPath: string) => void;
  defaultParent?: string;
  tree?: VaultNode[];
}

export const NewFolderModal: React.FC<NewFolderModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  defaultParent = '',
  tree = [],
}) => {
  const [folderName, setFolderName] = useState('');
  const [parentDir, setParentDir] = useState(defaultParent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract all existing folder paths from tree
  const existingFolders = useMemo(() => {
    const folders: string[] = [];
    const traverse = (nodes: VaultNode[]) => {
      for (const node of nodes) {
        if (node.type === 'directory') {
          folders.push(node.path);
          if (node.children) {
            traverse(node.children);
          }
        }
      }
    };
    traverse(tree);
    return folders.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [tree]);

  useEffect(() => {
    if (isOpen) {
      setParentDir(defaultParent);
      setFolderName('');
      setError(null);
    }
  }, [isOpen, defaultParent]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanParent = parentDir.trim().replace(/^\/+|\/+$/g, '');
  const cleanName = folderName.trim().replace(/^\/+|\/+$/g, '');
  const previewPath = cleanParent
    ? cleanName
      ? `${cleanParent}/${cleanName}`
      : `${cleanParent}/...`
    : cleanName || '...';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanName) {
      setError('Please enter a folder name');
      return;
    }

    const targetPath = cleanParent ? `${cleanParent}/${cleanName}` : cleanName;

    setIsSubmitting(true);
    setError(null);

    try {
      await createFolder(targetPath);
      onCreated(targetPath);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFolderName('');
    setParentDir(defaultParent);
    setError(null);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Create New Folder</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Folder Name
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. Recipes, Projects, Daily Notes"
              autoFocus
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Parent Directory
            </label>
            <div className="relative">
              <select
                value={parentDir}
                onChange={(e) => setParentDir(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 cursor-pointer appearance-none pr-8"
              >
                <option value="">/ (Root Vault)</option>
                {existingFolders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <Folder className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Path Preview */}
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
            <span className="text-slate-400 dark:text-slate-500 font-sans mr-1">Target:</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">{previewPath}</span>
          </div>

          {/* Footer Actions */}
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
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Folder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
