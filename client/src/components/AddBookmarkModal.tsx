import React, { useState, useEffect } from 'react';
import { BookmarkPlus, X, FolderPlus } from 'lucide-react';
import { saveBookmarkItem } from '../api';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePath: string;
  activeTitle: string;
  existingGroups: string[];
  onBookmarkSaved: () => void;
}

export const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({
  isOpen,
  onClose,
  activePath,
  activeTitle,
  existingGroups,
  onBookmarkSaved,
}) => {
  const [path, setPath] = useState(activePath || '');
  const [title, setTitle] = useState(activeTitle || '');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPath(activePath || '');
      const defaultTitle = activeTitle || (activePath ? activePath.split('/').pop()?.replace(/\.md$/i, '') : '') || '';
      setTitle(defaultTitle);
      setSelectedGroup('');
      setNewGroupName('');
      setIsCreatingNewGroup(false);
      setError(null);
    }
  }, [isOpen, activePath, activeTitle]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPath = path.trim();
    if (!cleanPath) {
      setError('Please provide a note path to bookmark.');
      return;
    }

    const cleanTitle = title.trim() || cleanPath.split('/').pop()?.replace(/\.md$/i, '') || cleanPath;
    let groupToUse = selectedGroup;

    if (isCreatingNewGroup) {
      if (!newGroupName.trim()) {
        setError('Please enter a name for the new bookmark group.');
        return;
      }
      groupToUse = newGroupName.trim();
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await saveBookmarkItem({
        type: 'file',
        path: cleanPath,
        title: cleanTitle,
        groupTitle: groupToUse || undefined,
      });

      onBookmarkSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save bookmark');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden font-sans">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Bookmark Note
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
              Note Path
            </label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="e.g. Recipes/Pasta.md"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bookmark Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Artisanal Fresh Pasta"
              autoFocus
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Bookmark Group
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingNewGroup((prev) => !prev)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FolderPlus className="w-3 h-3" />
                <span>{isCreatingNewGroup ? 'Choose existing' : 'New Group'}</span>
              </button>
            </div>

            {isCreatingNewGroup ? (
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter new group name..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
              >
                <option value="">None (Root / Top-level)</option>
                {existingGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            )}
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
              <BookmarkPlus className="w-4 h-4" />
              <span>Save Bookmark</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
