import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export interface NewTabLandingProps {
  onCreateNewNote: () => void;
  onQuickOpen: () => void;
  onCloseTab: () => void;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
}

export const NewTabLanding: React.FC<NewTabLandingProps> = ({
  onCreateNewNote,
  onQuickOpen,
  onCloseTab,
  onNavigateBack,
  onNavigateForward,
}) => {
  const isMac =
    typeof navigator !== 'undefined' &&
    /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent || '');
  const modKey = isMac ? '⌘' : 'Ctrl+';

  const handleBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  const handleForward = () => {
    if (onNavigateForward) {
      onNavigateForward();
    } else if (typeof window !== 'undefined') {
      window.history.forward();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 select-none overflow-hidden font-sans">
      {/* Obsidian Pane Navigation Header */}
      <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 border-b border-slate-200/70 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 text-xs flex-shrink-0">
        <button
          type="button"
          onClick={handleBack}
          title="Back"
          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer focus:outline-hidden"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleForward}
          title="Forward"
          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer focus:outline-hidden"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <span className="ml-2 font-medium text-slate-700 dark:text-slate-300 text-xs">
          New tab
        </span>
      </div>

      {/* Centered Obsidian-style Action Menu */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 -mt-8">
        <div className="flex flex-col items-center space-y-3.5 text-center">
          <button
            type="button"
            onClick={onCreateNewNote}
            className="text-sm font-normal text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors hover:underline cursor-pointer bg-transparent border-0 p-1 focus:outline-hidden"
          >
            Create new note ({modKey} N)
          </button>

          <button
            type="button"
            onClick={onQuickOpen}
            className="text-sm font-normal text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors hover:underline cursor-pointer bg-transparent border-0 p-1 focus:outline-hidden"
          >
            Go to file ({modKey} O)
          </button>

          <button
            type="button"
            onClick={onCloseTab}
            className="text-sm font-normal text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors hover:underline cursor-pointer bg-transparent border-0 p-1 focus:outline-hidden"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
