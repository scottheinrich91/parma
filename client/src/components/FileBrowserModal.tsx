import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  CornerLeftUp, 
  Check, 
  X, 
  RefreshCw, 
  AlertCircle,
  HardDrive,
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import { browseFilesystem, FsEntry, FsBrowseResult } from '../api';

interface FileBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedPath: string) => void;
  title?: string;
  initialPath?: string;
  filter?: 'all' | 'notes' | 'images' | 'folders';
  useRelativePath?: boolean;
}

export const FileBrowserModal: React.FC<FileBrowserModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Browse Files',
  initialPath = '',
  filter = 'all',
  useRelativePath = true,
}) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [entries, setEntries] = useState<FsEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<FsEntry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPath(initialPath);
    }
  }, [isOpen, initialPath, filter]);

  const loadPath = async (targetPath: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSelectedEntry(null);

    try {
      const data: FsBrowseResult = await browseFilesystem(targetPath, filter);
      setCurrentPath(data.currentPath);
      setParentPath(data.parentPath);
      setEntries(data.entries);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to browse directory');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEntryClick = (entry: FsEntry) => {
    if (entry.isDirectory) {
      loadPath(entry.path);
    } else {
      setSelectedEntry(entry);
    }
  };

  const handleConfirm = () => {
    if (filter === 'folders') {
      // In folder mode, confirm current directory if no subfolder selected
      const resultPath = selectedEntry 
        ? (useRelativePath ? selectedEntry.relativePath : selectedEntry.path)
        : currentPath;
      onSelect(resultPath);
      onClose();
    } else if (selectedEntry) {
      const resultPath = useRelativePath ? selectedEntry.relativePath : selectedEntry.path;
      onSelect(resultPath);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-[#1f2326] dark:bg-[#181a1c] text-[#e5a00d] dark:text-[#e5a00d] rounded-xl shadow-2xl max-w-2xl w-full border border-neutral-800 overflow-hidden font-sans flex flex-col h-[520px]">
        {/* Plex Style Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#191c1e] border-b border-neutral-800">
          <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
            <Folder className="w-4 h-4 text-[#e5a00d]" />
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Path Bar */}
        <div className="p-4 bg-[#1f2326] border-b border-neutral-800">
          <div className="flex items-center gap-2 px-3 py-2 rounded bg-[#141618] border border-neutral-800 text-xs font-mono text-neutral-200">
            <HardDrive className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
            <span className="truncate flex-1">{currentPath}</span>
          </div>
        </div>

        {/* File / Folder Grid (Plex Style) */}
        <div className="flex-1 p-4 overflow-y-auto bg-[#1a1d20]">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-neutral-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#e5a00d]" />
              <span>Scanning directory...</span>
            </div>
          ) : errorMsg ? (
            <div className="flex items-center gap-2 p-3 rounded bg-red-950/40 border border-red-900 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-neutral-300">
              {/* Back to Parent Directory */}
              {parentPath && (
                <div
                  onClick={() => loadPath(parentPath)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded bg-neutral-800/40 hover:bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer transition-colors border border-transparent hover:border-neutral-700"
                >
                  <CornerLeftUp className="w-4 h-4 text-neutral-400" />
                  <span className="font-semibold truncate">.. [Back]</span>
                </div>
              )}

              {/* Entries */}
              {entries.map((entry) => {
                const isSelected = selectedEntry?.path === entry.path;
                const isImg = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico', '.gif'].includes(entry.extension);

                return (
                  <div
                    key={entry.path}
                    onClick={() => handleEntryClick(entry)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-[#e5a00d]/20 border-[#e5a00d] text-[#e5a00d] font-semibold'
                        : 'bg-neutral-800/40 hover:bg-neutral-800 text-neutral-300 hover:text-white border-transparent hover:border-neutral-700'
                    }`}
                  >
                    {entry.isDirectory ? (
                      <Folder className="w-4 h-4 text-[#e5a00d] flex-shrink-0" />
                    ) : isImg ? (
                      <ImageIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    )}
                    <span className="truncate flex-1 font-mono">{entry.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#e5a00d] flex-shrink-0" />}
                  </div>
                );
              })}

              {entries.length === 0 && !parentPath && (
                <div className="col-span-2 text-center py-12 text-neutral-500 italic text-xs">
                  No matching files or folders found in this directory.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Plex Style Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#191c1e] border-t border-neutral-800">
          <div className="text-xs text-neutral-400 truncate max-w-[280px] font-mono">
            {selectedEntry ? (
              <span>Selected: <strong className="text-neutral-200">{selectedEntry.name}</strong></span>
            ) : filter === 'folders' ? (
              <span>Current Folder Selected</span>
            ) : (
              <span>No file selected</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-xs font-semibold bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedEntry && filter !== 'folders'}
              onClick={handleConfirm}
              className="px-5 py-2 rounded text-xs font-semibold bg-[#cc7b19] hover:bg-[#e5a00d] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
            >
              {filter === 'folders' ? 'Add Folder' : 'Select'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
