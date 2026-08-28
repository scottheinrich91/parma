import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bookmark,
  BookmarkPlus,
  FolderPlus,
  ChevronsUpDown,
  ChevronsDownUp,
  Filter,
  Trash2,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileText,
  Loader2,
  X,
  Search,
} from 'lucide-react';
import { fetchBookmarks, saveBookmarkItem, deleteBookmark } from '../api';
import { BookmarkItem } from '../types';

interface BookmarksViewProps {
  activePath: string;
  activeNoteTitle: string;
  onOpenNote: (path: string) => void;
  onOpenAddBookmarkModal: () => void;
  bookmarksVersion?: number;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  activePath,
  activeNoteTitle,
  onOpenNote,
  onOpenAddBookmarkModal,
  bookmarksVersion = 0,
}) => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');

  // Load bookmarks from server
  const loadBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchBookmarks();
      setBookmarks(data.items || []);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks, bookmarksVersion]);

  // Extract all group titles
  const allGroupTitles = useMemo(() => {
    const groups: string[] = [];
    const collect = (items: BookmarkItem[]) => {
      for (const item of items) {
        if (item.type === 'group' && item.title) {
          groups.push(item.title);
          if (item.items) collect(item.items);
        }
      }
    };
    collect(bookmarks);
    return groups;
  }, [bookmarks]);

  // Determine if all groups are currently collapsed
  const areAllGroupsCollapsed = useMemo(() => {
    if (allGroupTitles.length === 0) return false;
    return allGroupTitles.every((g) => collapsedGroups.has(g));
  }, [allGroupTitles, collapsedGroups]);

  // Toggle Collapse all / Expand all
  const handleToggleCollapseAll = () => {
    if (areAllGroupsCollapsed) {
      setCollapsedGroups(new Set());
    } else {
      setCollapsedGroups(new Set(allGroupTitles));
    }
  };

  // Toggle single group collapse
  const toggleGroupCollapse = (groupTitle: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupTitle)) {
        next.delete(groupTitle);
      } else {
        next.add(groupTitle);
      }
      return next;
    });
  };

  // Create new group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newGroupTitle.trim();
    if (!title) {
      setIsCreatingGroup(false);
      return;
    }

    try {
      await saveBookmarkItem({
        type: 'group',
        title,
        items: [],
      });
      setNewGroupTitle('');
      setIsCreatingGroup(false);
      await loadBookmarks();
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  // Delete a bookmark or group
  const handleDelete = async (item: BookmarkItem, groupTitle?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      if (item.type === 'group') {
        await deleteBookmark({ title: item.title, type: 'group' });
      } else if (item.path) {
        await deleteBookmark({ path: item.path, groupTitle });
      }
      await loadBookmarks();
    } catch (err) {
      console.error('Failed to delete bookmark:', err);
    }
  };

  // Filter bookmarks recursively
  const filteredBookmarks = useMemo(() => {
    const clean = filterQuery.trim().toLowerCase();
    if (!clean) return bookmarks;

    const filterList = (list: BookmarkItem[]): BookmarkItem[] => {
      const matched: BookmarkItem[] = [];
      for (const item of list) {
        const titleMatch = item.title?.toLowerCase().includes(clean);
        const pathMatch = item.path?.toLowerCase().includes(clean);

        if (item.type === 'group') {
          const subMatches = item.items ? filterList(item.items) : [];
          if (titleMatch || subMatches.length > 0) {
            matched.push({
              ...item,
              items: titleMatch ? item.items : subMatches,
            });
          }
        } else if (titleMatch || pathMatch) {
          matched.push(item);
        }
      }
      return matched;
    };

    return filterList(bookmarks);
  }, [bookmarks, filterQuery]);

  // Recursive bookmark renderer
  const renderBookmarkItem = (item: BookmarkItem, depth: number = 0, parentGroup?: string) => {
    if (item.type === 'group') {
      const isCollapsed = collapsedGroups.has(item.title || '');
      const groupItemsCount = item.items?.length || 0;

      return (
        <div key={`group-${item.title}-${depth}`} className="select-none group/bookmark-group">
          <div
            onClick={() => toggleGroupCollapse(item.title || '')}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            style={{ paddingLeft: `${Math.max(8, depth * 14 + 8)}px` }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="p-0.5 rounded hover:bg-slate-300/40 dark:hover:bg-slate-700/40 transition-colors">
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                )}
              </span>
              {isCollapsed ? (
                <Folder className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              ) : (
                <FolderOpen className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              )}
              <span className="truncate">{item.title}</span>
              <span className="text-[10px] text-slate-400 font-normal font-mono">
                ({groupItemsCount})
              </span>
            </div>

            <button
              onClick={(e) => handleDelete(item, undefined, e)}
              title="Delete group"
              className="opacity-0 group-hover/bookmark-group:opacity-100 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-all cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {!isCollapsed && item.items && (
            <div className="space-y-0.5 mt-0.5">
              {item.items.length === 0 ? (
                <div
                  className="text-[11px] italic text-slate-400 py-1"
                  style={{ paddingLeft: `${(depth + 1) * 14 + 20}px` }}
                >
                  Empty group
                </div>
              ) : (
                item.items.map((sub) => renderBookmarkItem(sub, depth + 1, item.title))
              )}
            </div>
          )}
        </div>
      );
    }

    // File bookmark
    const isActive = activePath && item.path && (activePath === item.path || activePath.toLowerCase() === item.path.toLowerCase());
    const displayTitle = item.title || item.path?.split('/').pop()?.replace(/\.md$/i, '') || item.path || 'Untitled';

    return (
      <div
        key={`item-${item.path || item.title}-${depth}`}
        onClick={() => item.path && onOpenNote(item.path)}
        className={`group/bookmark-item flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 font-normal'
        }`}
        style={{ paddingLeft: `${Math.max(8, depth * 14 + 8)}px` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Bookmark
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              isActive ? 'text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400' : 'text-blue-500/80 fill-blue-500/20'
            }`}
          />
          <div className="truncate">
            <span className="truncate">{displayTitle}</span>
            {item.path && item.title && item.title !== item.path && (
              <span className="text-[10px] text-slate-400 ml-1.5 truncate">
                {item.path}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={(e) => handleDelete(item, parentGroup, e)}
          title="Remove bookmark"
          className="opacity-0 group-hover/bookmark-item:opacity-100 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-all cursor-pointer flex-shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      {/* Top Action Buttons Toolbar */}
      <div className="p-2 border-b border-slate-200/80 dark:border-slate-800/80 flex-shrink-0 space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
            Bookmarks
          </span>

          <div className="flex items-center gap-1">
            {/* Bookmark the active tab... */}
            <button
              onClick={onOpenAddBookmarkModal}
              title="Bookmark the active tab..."
              className="p-1 rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
            </button>

            {/* New Group */}
            <button
              onClick={() => setIsCreatingGroup((prev) => !prev)}
              title="New Group"
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isCreatingGroup
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                  : 'hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>

            {/* Collapse all / Expand all */}
            <button
              onClick={handleToggleCollapseAll}
              title={areAllGroupsCollapsed ? 'Expand all' : 'Collapse all'}
              className="p-1 rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              {areAllGroupsCollapsed ? (
                <ChevronsUpDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronsDownUp className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Show search filter */}
            <button
              onClick={() => {
                setShowFilter((prev) => !prev);
                if (showFilter) setFilterQuery('');
              }}
              title="Show search filter"
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                showFilter
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                  : 'hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Inline New Group Input */}
        {isCreatingGroup && (
          <form onSubmit={handleCreateGroup} className="flex items-center gap-1 mt-1 animate-in fade-in duration-150">
            <input
              type="text"
              value={newGroupTitle}
              onChange={(e) => setNewGroupTitle(e.target.value)}
              placeholder="Group name..."
              autoFocus
              className="flex-1 py-1 px-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-2 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingGroup(false);
                setNewGroupTitle('');
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Search filter input */}
        {showFilter && (
          <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs animate-in fade-in duration-150">
            <Search className="w-3.5 h-3.5 text-slate-400 ml-2 flex-shrink-0" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter bookmarks..."
              autoFocus
              className="w-full py-1 px-2 text-xs bg-transparent border-none outline-hidden text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 mr-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {loading ? (
          <div className="flex items-center justify-center p-8 text-slate-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading bookmarks...</span>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
            <Bookmark className="w-8 h-8 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
            <p className="font-medium text-slate-600 dark:text-slate-300">
              No bookmarks found
            </p>
            <p className="text-[11px] max-w-[200px]">
              Bookmark notes and sections for quick access anytime.
            </p>
            {activePath && (
              <button
                onClick={onOpenAddBookmarkModal}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Bookmark active tab</span>
              </button>
            )}
          </div>
        ) : (
          filteredBookmarks.map((item) => renderBookmarkItem(item, 0))
        )}
      </div>
    </div>
  );
};
