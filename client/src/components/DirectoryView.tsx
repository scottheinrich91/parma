import React from 'react';
import { 
  Folder, 
  FileText, 
  ChevronRight, 
  Calendar, 
  HardDrive,
  BookOpen,
  Layers
} from 'lucide-react';
import { VaultNode } from '../types';

interface DirectoryViewProps {
  directoryPath: string;
  tree: VaultNode[];
  onOpenNote: (path: string) => void;
  onOpenDirectory: (path: string) => void;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  directoryPath,
  tree,
  onOpenNote,
  onOpenDirectory,
}) => {
  // Find the target directory node in the tree recursively
  const findDirectory = (nodes: VaultNode[], targetPath: string): VaultNode | null => {
    for (const node of nodes) {
      if (node.type === 'directory') {
        if (node.path === targetPath || node.path.toLowerCase() === targetPath.toLowerCase()) {
          return node;
        }
        if (node.children) {
          const found = findDirectory(node.children, targetPath);
          if (found) return found;
        }
      }
    }
    return null;
  };

  const targetDir = findDirectory(tree, directoryPath);
  const dirName = targetDir?.name || directoryPath.split('/').pop() || directoryPath;

  const children = targetDir?.children || [];
  const subDirectories = children.filter((c) => c.type === 'directory');
  const files = children.filter(
    (c) => c.type === 'file' && (c.name.endsWith('.md') || c.name.endsWith('.markdown'))
  );

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-6 font-sans space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
          <Layers className="w-4 h-4" />
          <span>Category / Directory Index</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 shadow-xs">
            <Folder className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
              {dirName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              📁 {directoryPath}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
          <span>{subDirectories.length} subfolders</span>
          <span>•</span>
          <span>{files.length} notes</span>
        </div>
      </div>

      {/* Sub-directories Section */}
      {subDirectories.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Folder className="w-4 h-4 text-amber-500" />
            <span>Sub-Folders</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {subDirectories.map((sub) => {
              const subCount = sub.children ? sub.children.length : 0;
              return (
                <div
                  key={sub.path}
                  onClick={() => onOpenDirectory(sub.path)}
                  className="group flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/60 shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-500 group-hover:scale-105 transition-transform">
                      <Folder className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {sub.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {subCount} items
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-500 transition-all" />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Notes / Documents in Directory */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-500" />
          <span>Documents & Notes ({files.length})</span>
        </h2>

        {files.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            No markdown documents found directly in this folder.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {files.map((file) => {
              const cleanTitle = file.name.replace(/\.md$|\.markdown$/i, '');
              const dateStr = file.updatedAt ? new Date(file.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;
              const sizeKb = file.size ? `${(file.size / 1024).toFixed(1)} KB` : null;

              return (
                <div
                  key={file.path}
                  onClick={() => onOpenNote(file.path)}
                  className="group flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/60 shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform flex-shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {cleanTitle}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                        {file.path}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-400">
                    {dateStr ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{dateStr}</span>
                      </span>
                    ) : <span />}
                    {sizeKb && (
                      <span className="flex items-center gap-1 font-mono">
                        <HardDrive className="w-3 h-3 text-slate-400" />
                        <span>{sizeKb}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
