import React from 'react';
import { Link2, FileText, CornerDownRight } from 'lucide-react';
import { BacklinkItem } from '../types';

interface BacklinksPanelProps {
  backlinks: BacklinkItem[];
  onOpenNote: (path: string) => void;
}

export const BacklinksPanel: React.FC<BacklinksPanelProps> = ({ backlinks, onOpenNote }) => {
  if (!backlinks || backlinks.length === 0) {
    return (
      <div className="bg-slate-50/80 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 text-xs font-sans">
        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-200 pb-2 mb-2 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
          <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Backlinks (0)</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-xs italic">No other notes link to this page yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/80 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 text-xs font-sans">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider text-[11px]">
          <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Backlinks ({backlinks.length})</span>
        </div>
      </div>
      <div className="space-y-3 max-h-[320px] overflow-y-auto">
        {backlinks.map((link, idx) => (
          <div 
            key={idx}
            onClick={() => onOpenNote(link.sourcePath)}
            className="group cursor-pointer p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-xs"
          >
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium group-hover:underline truncate">
              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{link.sourceTitle}</span>
            </div>
            {link.excerpt && (
              <div className="mt-1 flex items-start gap-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic bg-slate-50 dark:bg-slate-900/40 p-1.5 rounded">
                <CornerDownRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400" />
                <span className="truncate">{link.excerpt}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
