import React, { useRef, useEffect } from 'react';
import {
  FileText,
  Folder,
  X,
  Plus,
  Pin,
} from 'lucide-react';
import { NoteTab } from '../types';

export interface NoteTabsProps {
  tabs: NoteTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
  onTabContextMenu: (tab: NoteTab, e: React.MouseEvent) => void;
}

export const NoteTabs: React.FC<NoteTabsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onTabContextMenu,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [activeTabId]);

  return (
    <div className="h-9 flex items-center w-full bg-slate-200/60 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 px-1 select-none flex-shrink-0 relative overflow-hidden font-sans">
      {/* Scrollable Tab List */}
      <div
        ref={scrollContainerRef}
        className="flex items-center flex-1 h-full overflow-x-auto no-scrollbar gap-0.5 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const cleanTitle = tab.title || (tab.path ? tab.path.split('/').pop()?.replace(/\.md$/i, '') : 'New tab') || 'New tab';

          return (
            <div
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              onClick={() => onSelectTab(tab.id)}
              onAuxClick={(e) => {
                // Middle click closes tab (if not pinned)
                if (e.button === 1 && !tab.isPinned) {
                  e.preventDefault();
                  onCloseTab(tab.id);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                onTabContextMenu(tab, e);
              }}
              title={`${cleanTitle}${tab.path ? ` (${tab.path})` : ''}${tab.isPinned ? ' [Pinned]' : ''}`}
              className={`group relative flex items-center h-[30px] rounded-t-lg text-xs transition-all cursor-pointer ${
                tab.isPinned ? 'px-2 min-w-[36px] max-w-[130px]' : 'px-3 min-w-[100px] max-w-[200px]'
              } ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium shadow-xs z-10'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 font-normal hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {/* Tab Icon */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {tab.isPinned ? (
                  <Pin className="w-3 h-3 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                ) : tab.isDir ? (
                  <Folder className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                ) : (
                  <FileText
                    className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 dark:text-slate-500"
                  />
                )}
                <span className="truncate text-xs tracking-tight">{cleanTitle}</span>
              </div>

              {/* Close Button (Hidden for Pinned Tabs) */}
              {!tab.isPinned && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  title="Close tab (⌘W)"
                  className={`p-0.5 ml-1.5 rounded-md transition-opacity cursor-pointer ${
                    isActive
                      ? 'opacity-70 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'
                      : 'opacity-0 group-hover:opacity-70 hover:!opacity-100 hover:bg-slate-300/60 dark:hover:bg-slate-700/60 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Plus Button to Open New Tab */}
      <button
        type="button"
        onClick={onNewTab}
        title="New tab (⌘T)"
        className="p-1.5 mx-1 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors cursor-pointer flex-shrink-0"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
