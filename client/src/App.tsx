import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Network,
  Edit3,
  Trash2,
  Folder,
  FolderOpen,
  FolderPlus,
  FileText,
  FilePlus,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  X,
  Sidebar as SidebarIcon,
  Home,
  RefreshCw,
  Settings as SettingsIcon,
  PanelRight,
  CheckCircle2,
  Bookmark,
  ArrowUpDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Check,
  Pin,
  PinOff,
  Copy,
  ExternalLink,
  FolderInput,
  FileInput,
  Share2,
  Layers,
  ArrowRightToLine,
} from 'lucide-react';
import {
  fetchVaultTree,
  fetchNote,
  saveNote,
  deleteItem,
  fetchBacklinks,
  fetchThemeConfig,
  fetchBookmarks,
  duplicatePath,
  renamePath,
  movePath,
  VaultThemeResponse,
} from './api';
import { VaultNode, NoteData, BacklinkItem, SortOrder, BookmarkItem, NoteTab } from './types';
import { NoteView } from './components/NoteView';
import { NoteEditor } from './components/NoteEditor';
import { DirectoryView } from './components/DirectoryView';
import { TableOfContents } from './components/TableOfContents';
import { BacklinksPanel } from './components/BacklinksPanel';
import { GraphView } from './components/GraphView';
import { SearchModal } from './components/SearchModal';
import { NewNoteModal } from './components/NewNoteModal';
import { NewFolderModal } from './components/NewFolderModal';
import { SettingsModal } from './components/SettingsModal';
import { SidebarSearch } from './components/SidebarSearch';
import { BookmarksView } from './components/BookmarksView';
import { AddBookmarkModal } from './components/AddBookmarkModal';
import { NoteTabs } from './components/NoteTabs';
import { NewTabLanding } from './components/NewTabLanding';
import { ContextMenu, ContextMenuItem } from './components/ContextMenu';
import { RenameModal } from './components/RenameModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { FileBrowserModal } from './components/FileBrowserModal';
import { injectCustomCalloutsCSS } from './customCallouts';
import {
  applyTheme,
  getSavedThemeId,
  saveSelectedTheme,
  getSavedCustomCss,
  saveCustomCss,
  resolveEffectiveTheme,
} from './themes';


// Helper to sort vault nodes according to chosen sort order
const sortNodes = (nodes: VaultNode[], order: SortOrder): VaultNode[] => {
  return [...nodes].sort((a, b) => {
    // Directories always appear before files
    if (a.type === 'directory' && b.type !== 'directory') return -1;
    if (a.type !== 'directory' && b.type === 'directory') return 1;

    switch (order) {
      case 'name-asc':
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      case 'name-desc':
        return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
      case 'mtime-desc': {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
      case 'mtime-asc': {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        if (timeA !== timeB) return timeA - timeB;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
      case 'ctime-desc': {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
        if (timeB !== timeA) return timeB - timeA;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
      case 'ctime-asc': {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
        if (timeA !== timeB) return timeA - timeB;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
      default:
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    }
  });
};

// Helper to get ancestor directory paths for any given file or folder path
const getAncestorPaths = (targetPath: string): string[] => {
  if (!targetPath) return [];
  const clean = targetPath.replace(/^\/+|\/+$/g, '');
  const segments = clean.split('/').filter(Boolean);
  const ancestors: string[] = [];
  for (let i = 1; i < segments.length; i++) {
    ancestors.push(segments.slice(0, i).join('/'));
  }
  return ancestors;
};

// Helpers for localStorage persistence of collapsed folders ('parma_collapsed_folders')
const loadSavedCollapsedFolders = (): Set<string> | null => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('parma_collapsed_folders');
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return new Set<string>(parsed);
      }
    }
  } catch (err) {
    console.error('Failed to load collapsed folders from localStorage:', err);
  }
  return null;
};

const persistCollapsedFolders = (folders: Set<string>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('parma_collapsed_folders', JSON.stringify(Array.from(folders)));
  } catch (err) {
    console.error('Failed to persist collapsed folders to localStorage:', err);
  }
};

// Helpers for localStorage persistence of Note Tabs ('parma_open_tabs' and 'parma_active_tab_id')
const loadSavedTabs = (): NoteTab[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('parma_open_tabs');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load tabs from localStorage:', err);
  }
  return [];
};

const loadSavedActiveTabId = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('parma_active_tab_id') || '';
};

// Helper to recursively find a node in the vault tree
const findNodeInTree = (nodes: VaultNode[], targetPath: string): VaultNode | null => {
  const cleanTarget = targetPath.toLowerCase().replace(/^\/+|\/+$/g, '');
  for (const n of nodes) {
    if (n.path.toLowerCase() === cleanTarget) return n;
    if (n.type === 'directory' && n.children) {
      const found = findNodeInTree(n.children, targetPath);
      if (found) return found;
    }
  }
  return null;
};

export default function App() {
  const [vaultThemeData, setVaultThemeData] = useState<VaultThemeResponse | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string>(() => getSavedThemeId());
  const [customCss, setCustomCss] = useState<string>(() => getSavedCustomCss());

  const loadAndApplyTheme = useCallback(async () => {
    try {
      const themeData = await fetchThemeConfig();
      setVaultThemeData(themeData);
      const saved = getSavedThemeId();
      const effective = resolveEffectiveTheme(saved, themeData);
      const savedCss = getSavedCustomCss();
      applyTheme(effective, themeData, savedCss);
    } catch (err) {
      console.warn('Failed to load vault theme config:', err);
      const saved = getSavedThemeId();
      const effective = resolveEffectiveTheme(saved, null);
      const savedCss = getSavedCustomCss();
      applyTheme(effective, null, savedCss);
    }
  }, []);

  useEffect(() => {
    injectCustomCalloutsCSS();
    loadAndApplyTheme();
  }, [loadAndApplyTheme]);

  const handleThemeSelected = useCallback((newThemeId: string) => {
    setSelectedThemeId(newThemeId);
    saveSelectedTheme(newThemeId);
    applyTheme(newThemeId, vaultThemeData, customCss);
  }, [vaultThemeData, customCss]);

  const handleSaveCustomCss = useCallback((newCss: string) => {
    setCustomCss(newCss);
    saveCustomCss(newCss);
    const effective = selectedThemeId || resolveEffectiveTheme(null, vaultThemeData);
    applyTheme(effective, vaultThemeData, newCss);
  }, [selectedThemeId, vaultThemeData]);

  const [tree, setTree] = useState<VaultNode[]>([]);
  const [vaultRoot, setVaultRoot] = useState<string>('Vault');
  const [vaultFullPath, setVaultFullPath] = useState<string>('');
  const [activePath, setActivePath] = useState<string>('');
  const [activeNote, setActiveNote] = useState<NoteData | null>(null);
  const [backlinks, setBacklinks] = useState<BacklinkItem[]>([]);
  const [isLoadingNote, setIsLoadingNote] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(() => {
    const saved = loadSavedCollapsedFolders();
    return saved !== null ? saved : new Set<string>();
  });
  const [isDirectoryView, setIsDirectoryView] = useState<boolean>(false);

  // Note Tabs state ('parma_open_tabs' and 'parma_active_tab_id')
  const [tabs, setTabs] = useState<NoteTab[]>(() => loadSavedTabs());
  const [activeTabId, setActiveTabId] = useState<string>(() => loadSavedActiveTabId());
  const currentActiveTab = tabs.find((t) => t.id === activeTabId);

  // Search query for SidebarSearch
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState<string>('');

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  // Modals for Context Menu Actions
  const [renameModalTarget, setRenameModalTarget] = useState<{ path: string; isDir: boolean } | null>(null);
  const [deleteModalTarget, setDeleteModalTarget] = useState<{ path: string; isDir: boolean } | null>(null);
  const [moveModalTarget, setMoveModalTarget] = useState<{ path: string; isDir: boolean } | null>(null);
  const [bookmarkModalPath, setBookmarkModalPath] = useState<string>('');
  const [bookmarkModalTitle, setBookmarkModalTitle] = useState<string>('');

  // Persistent Right Sidebar Open State
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parma-right-sidebar-open');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const toggleRightSidebar = () => {
    setRightSidebarOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('parma-right-sidebar-open', next.toString());
      }
      return next;
    });
  };

  // Persistent Left Sidebar Open State (Desktop respects saved, Mobile defaults to closed)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return false;
      const saved = localStorage.getItem('parma-sidebar-open');
      return saved !== null ? saved === 'true' : true;
    }
    return false;
  });

  const toggleLeftSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        localStorage.setItem('parma-sidebar-open', next.toString());
      }
      return next;
    });
  };

  // Resizable Sidebar Widths
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parma-left-sidebar-width');
      return saved ? parseInt(saved, 10) : 256;
    }
    return 256;
  });

  const [rightWidth, setRightWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parma-right-sidebar-width');
      return saved ? parseInt(saved, 10) : 288;
    }
    return 288;
  });

  const leftWidthRef = useRef(leftWidth);
  leftWidthRef.current = leftWidth;
  const rightWidthRef = useRef(rightWidth);
  rightWidthRef.current = rightWidth;

  // Drag handler for Left Sidebar
  const handleLeftMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidthRef.current;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.min(Math.max(startWidth + (moveEvent.clientX - startX), 180), 480);
      setLeftWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem('parma-left-sidebar-width', leftWidthRef.current.toString());
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Drag handler for Right Sidebar
  const handleRightMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidthRef.current;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.min(Math.max(startWidth - (moveEvent.clientX - startX), 200), 520);
      setRightWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem('parma-right-sidebar-width', rightWidthRef.current.toString());
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Wiki Identity & Home Configuration
  const [wikiTitle, setWikiTitle] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('parma-wiki-title') || 'Parma';
    }
    return 'Parma';
  });

  const [homeNote, setHomeNote] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('parma-home-note') || 'Home.md';
    }
    return 'Home.md';
  });

  const [lightLogo, setLightLogo] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('parma-light-logo') || '/parma_dark.png';
    }
    return '/parma_dark.png';
  });

  const [darkLogo, setDarkLogo] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('parma-dark-logo') || '/parma_light.png';
    }
    return '/parma_light.png';
  });

  const [faviconUrl, setFaviconUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('parma-favicon-url') || '/favicon.png';
    }
    return '/favicon.png';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;

      // Apple Touch Icons for iOS Home Screen
      const appleIcons = document.querySelectorAll("link[rel*='apple-touch-icon']");
      appleIcons.forEach((el) => {
        (el as HTMLLinkElement).href = faviconUrl;
      });

      localStorage.setItem('parma-favicon-url', faviconUrl);
    }
  }, [faviconUrl]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const appleTitleMeta = document.getElementById('apple-app-title');
      if (appleTitleMeta) {
        appleTitleMeta.setAttribute('content', wikiTitle);
      }
      document.title = `${wikiTitle} — Lightweight Web Wiki`;
    }
  }, [wikiTitle]);

  // Clean URL Helpers
  const getCleanUrl = useCallback((rawPath: string) => {
    if (!rawPath) return '/';
    const customHome = (homeNote || 'Home.md').toLowerCase();
    if (rawPath.toLowerCase() === customHome || rawPath.toLowerCase() === 'home.md' || rawPath.toLowerCase() === 'index.md') {
      return '/';
    }
    return '/' + rawPath.split('/').map(encodeURIComponent).join('/');
  }, [homeNote]);

  const getPathFromUrl = useCallback((): string => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    const legacyNoteParam = params.get('note');
    if (legacyNoteParam) return legacyNoteParam;

    const pathname = window.location.pathname.replace(/^\/+/, '');
    if (!pathname) return '';
    return decodeURIComponent(pathname);
  }, []);

  // Modals & Panels
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isGraphOpen, setIsGraphOpen] = useState<boolean>(false);
  const [isNewNoteOpen, setIsNewNoteOpen] = useState<boolean>(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState<boolean>(false);
  const [newNoteDefaultFolder, setNewNoteDefaultFolder] = useState<string>('');
  const [newFolderDefaultParent, setNewFolderDefaultParent] = useState<string>('');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Obsidian Sidebar Tabs: 'files' (default) | 'search' | 'bookmarks'
  const [activeTab, setActiveTab] = useState<'files' | 'search' | 'bookmarks'>('files');

  // Files Tab Sort Order
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parma_sort_order');
      if (saved) return saved as SortOrder;
    }
    return 'name-asc';
  });
  const [isSortMenuOpen, setIsSortMenuOpen] = useState<boolean>(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Auto-reveal state (Obsidian Crosshair toggle)
  const [isAutoRevealActive, setIsAutoRevealActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parma_auto_reveal');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  // Bookmarks State & Groups
  const [bookmarksVersion, setBookmarksVersion] = useState<number>(0);
  const [existingBookmarkGroups, setExistingBookmarkGroups] = useState<string[]>([]);

  const loadBookmarkGroups = useCallback(async () => {
    try {
      const res = await fetchBookmarks();
      const groups: string[] = [];
      const collect = (items: BookmarkItem[]) => {
        for (const item of items) {
          if (item.type === 'group' && item.title) {
            groups.push(item.title);
            if (item.items) collect(item.items);
          }
        }
      };
      collect(res.items || []);
      setExistingBookmarkGroups(groups);
    } catch {
      // Ignored if offline
    }
  }, []);

  useEffect(() => {
    loadBookmarkGroups();
  }, [loadBookmarkGroups, bookmarksVersion]);

  // Click-outside handler for sort menu
  useEffect(() => {
    if (!isSortMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortMenuOpen]);

  const addMenuRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Click-outside and Escape key handling to close the '+' dropdown menu
  useEffect(() => {
    if (!isAddMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAddMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isAddMenuOpen]);


  // Dark mode
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('parma-theme') === 'dark' ||
        (!localStorage.getItem('parma-theme') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  useEffect(() => {
    const themeColor = isDark ? '#0f172a' : '#f8fafc';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('parma-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('parma-theme', 'light');
    }

    if (typeof document !== 'undefined') {
      document.documentElement.style.backgroundColor = themeColor;
      document.body.style.backgroundColor = themeColor;

      // Force WebKit / iOS Safari to update status bar color live
      const existingMetas = document.querySelectorAll("meta[name='theme-color']");
      existingMetas.forEach((m) => m.remove());

      const newMeta = document.createElement('meta');
      newMeta.setAttribute('name', 'theme-color');
      newMeta.setAttribute('content', themeColor);
      document.head.appendChild(newMeta);
    }
  }, [isDark]);

  // Extract flat list of note paths
  const allNotePaths = useMemo(() => {
    const paths: string[] = [];
    const traverse = (nodes: VaultNode[]) => {
      for (const node of nodes) {
        if (node.type === 'file' && (node.name.endsWith('.md') || node.name.endsWith('.markdown'))) {
          paths.push(node.path);
        } else if (node.type === 'directory' && node.children) {
          traverse(node.children);
        }
      }
    };
    traverse(tree);
    return paths;
  }, [tree]);

  // Load Note
  const loadNote = useCallback(async (path: string) => {
    if (!path) return;
    setIsLoadingNote(true);
    setIsDirectoryView(false);
    try {
      const data = await fetchNote(path);
      setActiveNote(data);
      setIsEditing(false);

      // Load backlinks in background
      try {
        const bls = await fetchBacklinks(path);
        setBacklinks(bls);
      } catch (err) {
        setBacklinks([]);
      }
    } catch (err: any) {
      console.error('Failed to load note:', err);
    } finally {
      setIsLoadingNote(false);
    }
  }, []);

  const expandAncestors = useCallback((targetPath: string) => {
    const ancestors = getAncestorPaths(targetPath);
    if (ancestors.length === 0) return;

    setCollapsedFolders((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const anc of ancestors) {
        if (next.has(anc)) {
          next.delete(anc);
          changed = true;
        }
      }
      if (changed) {
        persistCollapsedFolders(next);
        return next;
      }
      return prev;
    });
  }, []);

  // Tab synchronization helper
  const syncTabOnOpen = useCallback(
    (targetPath: string, isDir: boolean, customTitle?: string, forceNewTab: boolean = false) => {
      setTabs((prevTabs) => {
        const tabTitle =
          customTitle ||
          (targetPath ? targetPath.split('/').pop()?.replace(/\.md$/i, '') : 'Home') ||
          'Home';

        const currentActiveIndex = prevTabs.findIndex((t) => t.id === activeTabId);
        const currentActiveTab = currentActiveIndex >= 0 ? prevTabs[currentActiveIndex] : null;

        // If currently on a 'New tab' (path === ''), update current active tab directly
        if (currentActiveTab && currentActiveTab.path === '' && !forceNewTab) {
          const updatedTabs = [...prevTabs];
          updatedTabs[currentActiveIndex] = {
            ...currentActiveTab,
            path: targetPath,
            title: tabTitle,
            isDir,
          };
          localStorage.setItem('parma_open_tabs', JSON.stringify(updatedTabs));
          return updatedTabs;
        }

        if (forceNewTab) {
          const newTab: NoteTab = {
            id: `tab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            path: targetPath,
            title: tabTitle,
            isPinned: false,
            isDir,
          };
          const next = [...prevTabs, newTab];
          setActiveTabId(newTab.id);
          localStorage.setItem('parma_active_tab_id', newTab.id);
          localStorage.setItem('parma_open_tabs', JSON.stringify(next));
          return next;
        }

        // Check if existing tab matches targetPath and isDir
        const existingIndex = prevTabs.findIndex(
          (t) => t.path.toLowerCase() === targetPath.toLowerCase() && t.isDir === isDir
        );

        if (existingIndex >= 0) {
          const targetId = prevTabs[existingIndex].id;
          setActiveTabId(targetId);
          localStorage.setItem('parma_active_tab_id', targetId);
          return prevTabs;
        }

        // Check if current active tab is unpinned and can be navigated
        if (currentActiveIndex >= 0 && !prevTabs[currentActiveIndex].isPinned) {
          const updatedTabs = [...prevTabs];
          updatedTabs[currentActiveIndex] = {
            ...updatedTabs[currentActiveIndex],
            path: targetPath,
            title: tabTitle,
            isDir,
          };
          localStorage.setItem('parma_open_tabs', JSON.stringify(updatedTabs));
          return updatedTabs;
        }

        // Otherwise append new tab
        const newTab: NoteTab = {
          id: `tab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          path: targetPath,
          title: tabTitle,
          isPinned: false,
          isDir,
        };
        const next = [...prevTabs, newTab];
        setActiveTabId(newTab.id);
        localStorage.setItem('parma_active_tab_id', newTab.id);
        localStorage.setItem('parma_open_tabs', JSON.stringify(next));
        return next;
      });
    },
    [activeTabId]
  );

  // Open a specific note (with clean history push & tab sync)
  const handleOpenNote = useCallback(
    (
      path: string,
      pushToHistory: boolean = true,
      syncTab: boolean = true,
      forceNewTab: boolean = false
    ) => {
      setActivePath(path);
      setIsDirectoryView(false);
      loadNote(path);
      if (isAutoRevealActive) {
        expandAncestors(path);
      }

      if (pushToHistory && typeof window !== 'undefined') {
        const targetUrl = getCleanUrl(path);
        if (window.location.pathname + window.location.search !== targetUrl) {
          window.history.pushState({ path, isDir: false }, '', targetUrl);
        }
      }

      if (syncTab) {
        syncTabOnOpen(path, false, undefined, forceNewTab);
      }

      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    },
    [loadNote, getCleanUrl, expandAncestors, isAutoRevealActive, syncTabOnOpen]
  );

  // Open a directory view (with clean history push & tab sync)
  const handleOpenDirectory = useCallback(
    (
      folderPath: string,
      pushToHistory: boolean = true,
      syncTab: boolean = true,
      forceNewTab: boolean = false
    ) => {
      setActivePath(folderPath);
      setActiveNote(null);
      setIsDirectoryView(true);
      setIsEditing(false);
      if (isAutoRevealActive) {
        expandAncestors(folderPath);
      }

      if (pushToHistory && typeof window !== 'undefined') {
        const targetUrl = getCleanUrl(folderPath);
        if (window.location.pathname + window.location.search !== targetUrl) {
          window.history.pushState({ path: folderPath, isDir: true }, '', targetUrl);
        }
      }

      if (syncTab) {
        syncTabOnOpen(folderPath, true, undefined, forceNewTab);
      }

      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    },
    [getCleanUrl, expandAncestors, isAutoRevealActive, syncTabOnOpen]
  );

  // Note Tab Operations
  const handleSelectTab = useCallback(
    (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return;
      setActiveTabId(tabId);
      localStorage.setItem('parma_active_tab_id', tabId);
      if (tab.path === '') {
        setActivePath('');
        setActiveNote(null);
        setIsDirectoryView(false);
        setIsEditing(false);
        setBacklinks([]);
        if (typeof window !== 'undefined') {
          window.history.pushState({ path: '', isDir: false }, '', '/');
        }
      } else if (tab.isDir) {
        handleOpenDirectory(tab.path, true, false);
      } else {
        handleOpenNote(tab.path, true, false);
      }
    },
    [tabs, handleOpenDirectory, handleOpenNote]
  );

  const handleCloseTab = useCallback(
    (tabId: string) => {
      setTabs((prevTabs) => {
        const tabToClose = prevTabs.find((t) => t.id === tabId);
        if (!tabToClose) return prevTabs;

        const closeIndex = prevTabs.findIndex((t) => t.id === tabId);
        const nextTabs = prevTabs.filter((t) => t.id !== tabId);

        if (nextTabs.length === 0) {
          const defaultTab: NoteTab = {
            id: `tab_${Date.now()}`,
            path: '',
            title: 'New tab',
            isPinned: false,
            isDir: false,
          };
          const result = [defaultTab];
          setActiveTabId(defaultTab.id);
          localStorage.setItem('parma_active_tab_id', defaultTab.id);
          localStorage.setItem('parma_open_tabs', JSON.stringify(result));
          setActivePath('');
          setActiveNote(null);
          setIsDirectoryView(false);
          setIsEditing(false);
          setBacklinks([]);
          if (typeof window !== 'undefined') {
            window.history.pushState({ path: '', isDir: false }, '', '/');
          }
          return result;
        }

        // If closed tab was active, switch to adjacent tab
        if (tabId === activeTabId) {
          const nextActiveIndex = Math.min(closeIndex, nextTabs.length - 1);
          const nextActiveTab = nextTabs[nextActiveIndex];
          setActiveTabId(nextActiveTab.id);
          localStorage.setItem('parma_active_tab_id', nextActiveTab.id);
          if (nextActiveTab.path === '') {
            setActivePath('');
            setActiveNote(null);
            setIsDirectoryView(false);
            setIsEditing(false);
            setBacklinks([]);
            if (typeof window !== 'undefined') {
              window.history.pushState({ path: '', isDir: false }, '', '/');
            }
          } else if (nextActiveTab.isDir) {
            handleOpenDirectory(nextActiveTab.path, true, false);
          } else {
            handleOpenNote(nextActiveTab.path, true, false);
          }
        }

        localStorage.setItem('parma_open_tabs', JSON.stringify(nextTabs));
        return nextTabs;
      });
    },
    [activeTabId, handleOpenNote, handleOpenDirectory]
  );

  const handleCloseOtherTabs = useCallback(
    (targetTabId: string) => {
      setTabs((prevTabs) => {
        const nextTabs = prevTabs.filter((t) => t.id === targetTabId || t.isPinned);
        localStorage.setItem('parma_open_tabs', JSON.stringify(nextTabs));
        if (activeTabId !== targetTabId) {
          setActiveTabId(targetTabId);
          localStorage.setItem('parma_active_tab_id', targetTabId);
          const targetTab = prevTabs.find((t) => t.id === targetTabId);
          if (targetTab) {
            if (targetTab.path === '') {
              setActivePath('');
              setActiveNote(null);
              setIsDirectoryView(false);
              setIsEditing(false);
              setBacklinks([]);
              if (typeof window !== 'undefined') {
                window.history.pushState({ path: '', isDir: false }, '', '/');
              }
            } else if (targetTab.isDir) {
              handleOpenDirectory(targetTab.path, true, false);
            } else {
              handleOpenNote(targetTab.path, true, false);
            }
          }
        }
        return nextTabs;
      });
    },
    [activeTabId, handleOpenDirectory, handleOpenNote]
  );

  const handleCloseTabsToRight = useCallback(
    (targetTabId: string) => {
      setTabs((prevTabs) => {
        const targetIndex = prevTabs.findIndex((t) => t.id === targetTabId);
        if (targetIndex < 0) return prevTabs;

        const nextTabs = prevTabs.filter((t, idx) => idx <= targetIndex || t.isPinned);
        localStorage.setItem('parma_open_tabs', JSON.stringify(nextTabs));

        if (!nextTabs.some((t) => t.id === activeTabId)) {
          setActiveTabId(targetTabId);
          localStorage.setItem('parma_active_tab_id', targetTabId);
          const targetTab = prevTabs[targetIndex];
          if (targetTab) {
            if (targetTab.path === '') {
              setActivePath('');
              setActiveNote(null);
              setIsDirectoryView(false);
              setIsEditing(false);
              setBacklinks([]);
              if (typeof window !== 'undefined') {
                window.history.pushState({ path: '', isDir: false }, '', '/');
              }
            } else if (targetTab.isDir) {
              handleOpenDirectory(targetTab.path, true, false);
            } else {
              handleOpenNote(targetTab.path, true, false);
            }
          }
        }
        return nextTabs;
      });
    },
    [activeTabId, handleOpenDirectory, handleOpenNote]
  );

  const handleDuplicateTab = useCallback((targetTabId: string) => {
    setTabs((prevTabs) => {
      const targetIndex = prevTabs.findIndex((t) => t.id === targetTabId);
      if (targetIndex < 0) return prevTabs;
      const sourceTab = prevTabs[targetIndex];
      const dupTab: NoteTab = {
        id: `tab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        path: sourceTab.path,
        title: sourceTab.title,
        isPinned: false,
        isDir: sourceTab.isDir,
      };
      const nextTabs = [...prevTabs];
      nextTabs.splice(targetIndex + 1, 0, dupTab);
      setActiveTabId(dupTab.id);
      localStorage.setItem('parma_active_tab_id', dupTab.id);
      localStorage.setItem('parma_open_tabs', JSON.stringify(nextTabs));
      if (sourceTab.path === '') {
        setActivePath('');
        setActiveNote(null);
        setIsDirectoryView(false);
        setIsEditing(false);
        setBacklinks([]);
        if (typeof window !== 'undefined') {
          window.history.pushState({ path: '', isDir: false }, '', '/');
        }
      }
      return nextTabs;
    });
  }, []);

  const handleTogglePinTab = useCallback((targetTabId: string) => {
    setTabs((prevTabs) => {
      const nextTabs = prevTabs.map((t) =>
        t.id === targetTabId ? { ...t, isPinned: !t.isPinned } : t
      );
      localStorage.setItem('parma_open_tabs', JSON.stringify(nextTabs));
      return nextTabs;
    });
  }, []);

  const handleNewTab = useCallback(() => {
    const newTab: NoteTab = {
      id: `tab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      path: '',
      title: 'New tab',
      isPinned: false,
      isDir: false,
    };
    setTabs((prev) => {
      const next = [...prev, newTab];
      localStorage.setItem('parma_open_tabs', JSON.stringify(next));
      return next;
    });
    setActiveTabId(newTab.id);
    localStorage.setItem('parma_active_tab_id', newTab.id);
    setActivePath('');
    setActiveNote(null);
    setIsDirectoryView(false);
    setIsEditing(false);
    setBacklinks([]);
    if (typeof window !== 'undefined') {
      window.history.pushState({ path: '', isDir: false }, '', '/');
    }
  }, []);

  // Navigate to designated home note
  const handleNavigateHome = useCallback((pushToHistory: boolean = true) => {
    const customHome = homeNote || localStorage.getItem('parma-home-note') || 'Home.md';
    const targetHome = allNotePaths.find(
      (p) =>
        p.toLowerCase() === customHome.toLowerCase() ||
        p.toLowerCase() === 'home.md' ||
        p.toLowerCase() === 'index.md'
    ) || allNotePaths[0] || 'Home.md';

    handleOpenNote(targetHome, pushToHistory);
  }, [allNotePaths, homeNote, handleOpenNote]);

  // Load Tree
  const loadTree = useCallback(async () => {
    try {
      const data = await fetchVaultTree();
      setTree(data.tree);
      setVaultRoot(data.root);
      if (data.vaultPath) {
        setVaultFullPath(data.vaultPath);
      }

      // Collect all directories to collapse them by default
      const allDirs = new Set<string>();
      const collectDirs = (nodes: VaultNode[]) => {
        for (const n of nodes) {
          if (n.type === 'directory') {
            allDirs.add(n.path);
            if (n.children) collectDirs(n.children);
          }
        }
      };
      collectDirs(data.tree);

      // Load saved collapsed folders or default to all directories collapsed
      const saved = loadSavedCollapsedFolders();
      let initialCollapsed: Set<string>;
      if (saved !== null) {
        initialCollapsed = new Set(saved);
      } else {
        initialCollapsed = new Set(allDirs);
      }

      // Route from active URL path on initial tree load
      const urlPath = getPathFromUrl();
      let targetPath = '';
      let isDir = false;

      if (urlPath) {
        if (urlPath.endsWith('.md') || urlPath.endsWith('.markdown')) {
          targetPath = urlPath;
        } else {
          const mdCandidate = urlPath + '.md';
          const match = findNodeInTree(data.tree, urlPath) || findNodeInTree(data.tree, mdCandidate);
          if (match) {
            if (match.type === 'file') {
              targetPath = match.path;
            } else {
              targetPath = match.path;
              isDir = true;
            }
          } else {
            targetPath = urlPath;
            isDir = true;
          }
        }
      } else {
        const savedTabs = loadSavedTabs();
        const savedActiveId = loadSavedActiveTabId();
        const savedActiveTab =
          savedTabs.find((t) => t.id === savedActiveId) || (savedTabs.length > 0 ? savedTabs[0] : null);

        if (savedActiveTab && savedActiveTab.path === '') {
          targetPath = '';
        } else if (savedActiveTab && savedActiveTab.path) {
          targetPath = savedActiveTab.path;
          isDir = savedActiveTab.isDir;
        } else {
          const customHome = localStorage.getItem('parma-home-note') || 'Home.md';
          const flat: string[] = [];
          const findFirst = (nodes: VaultNode[]) => {
            for (const n of nodes) {
              if (n.type === 'file' && (n.name.endsWith('.md') || n.name.endsWith('.markdown'))) {
                flat.push(n.path);
              } else if (n.children) {
                findFirst(n.children);
              }
            }
          };
          findFirst(data.tree);

          targetPath =
            flat.find((p) => p.toLowerCase() === customHome.toLowerCase()) ||
            flat.find((p) => p.toLowerCase() === 'home.md' || p.toLowerCase() === 'index.md') ||
            flat[0] ||
            '';
        }
      }

      // Auto-expand ancestors for the initial target
      if (targetPath) {
        const ancestors = getAncestorPaths(targetPath);
        for (const anc of ancestors) {
          initialCollapsed.delete(anc);
        }
      }

      setCollapsedFolders(initialCollapsed);
      persistCollapsedFolders(initialCollapsed);

      if (targetPath) {
        if (isDir) {
          handleOpenDirectory(targetPath, false);
        } else {
          handleOpenNote(targetPath, false);
        }
      }
    } catch (err: any) {
      console.error('Failed to load vault tree:', err);
    }
  }, [handleOpenNote, handleOpenDirectory, getPathFromUrl]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  // Listen to Browser Back / Forward buttons (PopState)
  useEffect(() => {
    const handlePopState = () => {
      const targetPath = getPathFromUrl();
      if (targetPath) {
        if (targetPath.endsWith('.md') || targetPath.endsWith('.markdown')) {
          handleOpenNote(targetPath, false);
        } else {
          const mdCandidate = targetPath + '.md';
          const match = findNodeInTree(tree, targetPath) || findNodeInTree(tree, mdCandidate);
          if (match && match.type === 'file') {
            handleOpenNote(match.path, false);
          } else if (match && match.type === 'directory') {
            handleOpenDirectory(match.path, false);
          } else {
            handleOpenDirectory(targetPath, false);
          }
        }
      } else if (typeof window !== 'undefined' && window.history.state && window.history.state.path === '') {
        setActivePath('');
        setActiveNote(null);
        setIsDirectoryView(false);
        setIsEditing(false);
        setBacklinks([]);
      } else {
        handleNavigateHome(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tree, handleOpenNote, handleOpenDirectory, handleNavigateHome, getPathFromUrl]);

  // Tab Right-Click Context Menu
  const handleTabContextMenu = useCallback(
    (tab: NoteTab, e: React.MouseEvent) => {
      e.preventDefault();
      const items: ContextMenuItem[] = [
        {
          id: 'close',
          label: 'Close',
          icon: <X className="w-4 h-4" />,
          disabled: tab.isPinned,
          shortcut: '⌘W',
          onClick: () => handleCloseTab(tab.id),
        },
        {
          id: 'close-others',
          label: 'Close others',
          icon: <Layers className="w-4 h-4" />,
          onClick: () => handleCloseOtherTabs(tab.id),
        },
        {
          id: 'close-to-right',
          label: 'Close to the right',
          icon: <ArrowRightToLine className="w-4 h-4" />,
          onClick: () => handleCloseTabsToRight(tab.id),
        },
        { divider: true, label: '' },
        {
          id: 'duplicate-tab',
          label: 'Duplicate tab',
          icon: <Copy className="w-4 h-4" />,
          onClick: () => handleDuplicateTab(tab.id),
        },
        {
          id: 'pin-tab',
          label: tab.isPinned ? 'Unpin tab' : 'Pin tab',
          icon: tab.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />,
          onClick: () => handleTogglePinTab(tab.id),
        },
      ];

      setContextMenu({
        isOpen: true,
        x: e.clientX,
        y: e.clientY,
        items,
      });
    },
    [
      handleCloseTab,
      handleCloseOtherTabs,
      handleCloseTabsToRight,
      handleDuplicateTab,
      handleTogglePinTab,
    ]
  );

  // Folder Right-Click Context Menu
  const handleFolderContextMenu = useCallback(
    (folderPath: string, e: React.MouseEvent) => {
      e.preventDefault();
      const folderName = folderPath.split('/').pop() || folderPath;
      const fullPath = vaultFullPath
        ? folderPath
          ? `${vaultFullPath}/${folderPath}`
          : vaultFullPath
        : folderPath;

      const items: ContextMenuItem[] = [
        {
          id: 'new-note',
          label: 'New note',
          icon: <FilePlus className="w-4 h-4 text-blue-500" />,
          onClick: () => {
            setNewNoteDefaultFolder(folderPath);
            setIsNewNoteOpen(true);
          },
        },
        {
          id: 'new-folder',
          label: 'New folder',
          icon: <FolderPlus className="w-4 h-4 text-amber-500" />,
          onClick: () => {
            setNewFolderDefaultParent(folderPath);
            setIsNewFolderOpen(true);
          },
        },
        { divider: true, label: '' },
        {
          id: 'duplicate',
          label: 'Duplicate',
          icon: <Copy className="w-4 h-4 text-slate-500" />,
          onClick: async () => {
            try {
              const res = await duplicatePath(folderPath);
              await loadTree();
              showToast(`Folder duplicated: ${res.path.split('/').pop()}`);
            } catch (err: any) {
              showToast(err.message || 'Failed to duplicate folder');
            }
          },
        },
        {
          id: 'move',
          label: 'Move folder to...',
          icon: <FolderInput className="w-4 h-4 text-slate-500" />,
          onClick: () => {
            setMoveModalTarget({ path: folderPath, isDir: true });
          },
        },
        {
          id: 'search',
          label: 'Search in folder',
          icon: <Search className="w-4 h-4 text-slate-500" />,
          onClick: () => {
            setSidebarSearchQuery(`path:${folderPath} `);
            setActiveTab('search');
          },
        },
        {
          id: 'bookmark',
          label: 'Bookmark...',
          icon: <Bookmark className="w-4 h-4 text-blue-500" />,
          onClick: () => {
            setBookmarkModalPath(folderPath);
            setBookmarkModalTitle(folderName);
            setIsAddBookmarkOpen(true);
          },
        },
        { divider: true, label: '' },
        {
          id: 'copy-path',
          label: 'Copy path',
          icon: <Share2 className="w-4 h-4 text-slate-500" />,
          children: [
            {
              id: 'copy-vault',
              label: 'from vault folder',
              onClick: () => {
                navigator.clipboard.writeText(folderPath);
                showToast('Relative path copied');
              },
            },
            {
              id: 'copy-root',
              label: 'from system root',
              onClick: () => {
                navigator.clipboard.writeText(fullPath);
                showToast('Full path copied');
              },
            },
          ],
        },
        { divider: true, label: '' },
        {
          id: 'rename',
          label: 'Rename...',
          icon: <Edit3 className="w-4 h-4 text-slate-500" />,
          onClick: () => {
            setRenameModalTarget({ path: folderPath, isDir: true });
          },
        },
        {
          id: 'delete',
          label: 'Delete',
          danger: true,
          icon: <Trash2 className="w-4 h-4 text-rose-500" />,
          onClick: () => {
            setDeleteModalTarget({ path: folderPath, isDir: true });
          },
        },
      ];

      setContextMenu({
        isOpen: true,
        x: e.clientX,
        y: e.clientY,
        items,
      });
    },
    [vaultFullPath, loadTree, showToast]
  );

  // Note Right-Click Context Menu
  const handleNoteContextMenu = useCallback(
    (notePath: string, e: React.MouseEvent) => {
      e.preventDefault();
      const cleanTitle = notePath.split('/').pop()?.replace(/\.md$|\.markdown$/i, '') || notePath;
      const fullPath = vaultFullPath
        ? notePath
          ? `${vaultFullPath}/${notePath}`
          : vaultFullPath
        : notePath;

      const items: ContextMenuItem[] = [
        {
          id: 'open-new-tab',
          label: 'Open in new tab',
          icon: <FilePlus className="w-4 h-4 text-blue-500" />,
          onClick: () => {
            handleOpenNote(notePath, true, true, true);
          },
        },
        {
          id: 'open-to-right',
          label: 'Open to the right',
          icon: <ArrowRightToLine className="w-4 h-4 text-blue-500" />,
          onClick: () => {
            setTabs((prevTabs) => {
              const newTab: NoteTab = {
                id: `tab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                path: notePath,
                title: cleanTitle,
                isPinned: false,
                isDir: false,
              };
              const currentIdx = prevTabs.findIndex((t) => t.id === activeTabId);
              const nextTabs = [...prevTabs];
              if (currentIdx >= 0) {
                nextTabs.splice(currentIdx + 1, 0, newTab);
              } else {
                nextTabs.push(newTab);
              }
              setActiveTabId(newTab.id);
              localStorage.setItem('parma_active_tab_id', newTab.id);
              localStorage.setItem('parma_open_tabs', JSON.stringify(nextTabs));
              handleOpenNote(notePath, true, false);
              return nextTabs;
            });
          },
        },
        {
          id: 'open-new-window',
          label: 'Open in new window',
          icon: <ExternalLink className="w-4 h-4 text-slate-500" />,
          onClick: () => {
            window.open(getCleanUrl(notePath), '_blank');
          },
        },
        { divider: true, label: '' },
        {
          id: 'duplicate',
          label: 'Duplicate',
          icon: <Copy className="w-4 h-4 text-slate-500" />,
          onClick: async () => {
            try {
              const res = await duplicatePath(notePath);
              await loadTree();
              handleOpenNote(res.path, true, true, true);
              showToast(`Duplicated note: ${res.path.split('/').pop()}`);
            } catch (err: any) {
              showToast(err.message || 'Failed to duplicate note');
            }
          },
        },
        {
          id: 'move',
          label: 'Move file to...',
          icon: <FileInput className="w-4 h-4 text-slate-500" />,
          onClick: () => {
            setMoveModalTarget({ path: notePath, isDir: false });
          },
        },
        {
          id: 'bookmark',
          label: 'Bookmark...',
          icon: <Bookmark className="w-4 h-4 text-blue-500" />,
          onClick: () => {
            setBookmarkModalPath(notePath);
            setBookmarkModalTitle(cleanTitle);
            setIsAddBookmarkOpen(true);
          },
        },
        { divider: true, label: '' },
        {
          id: 'copy-path',
          label: 'Copy path',
          icon: <Share2 className="w-4 h-4 text-slate-500" />,
          children: [
            {
              id: 'copy-obsidian-url',
              label: 'as Obsidian URL',
              onClick: () => {
                const obsidianUrl = `obsidian://open?vault=${encodeURIComponent(vaultRoot)}&file=${encodeURIComponent(notePath)}`;
                navigator.clipboard.writeText(obsidianUrl);
                showToast('Obsidian URL copied');
              },
            },
            {
              id: 'copy-vault',
              label: 'from vault folder',
              onClick: () => {
                navigator.clipboard.writeText(notePath);
                showToast('Relative path copied');
              },
            },
            {
              id: 'copy-root',
              label: 'from system root',
              onClick: () => {
                navigator.clipboard.writeText(fullPath);
                showToast('Full path copied');
              },
            },
          ],
        },
        { divider: true, label: '' },
        {
          id: 'rename',
          label: 'Rename...',
          icon: <Edit3 className="w-4 h-4 text-slate-500" />,
          onClick: () => {
            setRenameModalTarget({ path: notePath, isDir: false });
          },
        },
        {
          id: 'delete',
          label: 'Delete',
          danger: true,
          icon: <Trash2 className="w-4 h-4 text-rose-500" />,
          onClick: () => {
            setDeleteModalTarget({ path: notePath, isDir: false });
          },
        },
      ];

      setContextMenu({
        isOpen: true,
        x: e.clientX,
        y: e.clientY,
        items,
      });
    },
    [vaultFullPath, vaultRoot, handleOpenNote, activeTabId, getCleanUrl, loadTree, showToast]
  );

  // Move Destination Handler
  const handleConfirmMove = useCallback(
    async (destinationFolder: string) => {
      if (!moveModalTarget) return;
      const { path: srcPath, isDir } = moveModalTarget;
      try {
        const res = await movePath(srcPath, destinationFolder);
        await loadTree();

        // Update tabs matching moved path
        setTabs((prevTabs) => {
          const nextTabs = prevTabs.map((t) => {
            if (isDir) {
              if (t.path === srcPath) {
                return {
                  ...t,
                  path: res.newPath,
                  title: res.newPath.split('/').pop() || res.newPath,
                };
              }
              if (t.path.startsWith(`${srcPath}/`)) {
                const relSuffix = t.path.substring(srcPath.length + 1);
                return { ...t, path: `${res.newPath}/${relSuffix}` };
              }
            } else {
              if (t.path === srcPath) {
                return {
                  ...t,
                  path: res.newPath,
                  title: res.newPath.split('/').pop()?.replace(/\.md$/i, '') || res.newPath,
                };
              }
            }
            return t;
          });
          localStorage.setItem('parma_open_tabs', JSON.stringify(nextTabs));
          return nextTabs;
        });

        if (activePath === srcPath) {
          if (isDir) {
            handleOpenDirectory(res.newPath, true, false);
          } else {
            handleOpenNote(res.newPath, true, false);
          }
        }

        showToast(`Moved to ${destinationFolder || 'Root Vault'}`);
      } catch (err: any) {
        showToast(err.message || 'Failed to move item');
      } finally {
        setMoveModalTarget(null);
      }
    },
    [moveModalTarget, loadTree, activePath, handleOpenDirectory, handleOpenNote, showToast]
  );

  // Rename Confirmation Handler
  const handleRenamed = useCallback(
    async (oldPath: string, newPath: string) => {
      await loadTree();
      const isDir = renameModalTarget?.isDir ?? false;
      const newName = newPath.split('/').pop() || newPath;
      const newTitle = isDir ? newName : newName.replace(/\.md$|\.markdown$/i, '');

      // Update tabs
      setTabs((prevTabs) => {
        const nextTabs = prevTabs.map((t) => {
          if (isDir) {
            if (t.path === oldPath) {
              return { ...t, path: newPath, title: newTitle };
            }
            if (t.path.startsWith(`${oldPath}/`)) {
              const relSuffix = t.path.substring(oldPath.length + 1);
              return { ...t, path: `${newPath}/${relSuffix}` };
            }
          } else {
            if (t.path === oldPath) {
              return { ...t, path: newPath, title: newTitle };
            }
          }
          return t;
        });
        localStorage.setItem('parma_open_tabs', JSON.stringify(nextTabs));
        return nextTabs;
      });

      if (activePath === oldPath) {
        if (isDir) {
          handleOpenDirectory(newPath, true, false);
        } else {
          handleOpenNote(newPath, true, false);
        }
      }

      showToast(`Renamed to "${newTitle}"`);
      setRenameModalTarget(null);
    },
    [renameModalTarget, loadTree, activePath, handleOpenDirectory, handleOpenNote, showToast]
  );

  // Delete Confirmation Handler
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteModalTarget) return;
    const { path: targetPath, isDir } = deleteModalTarget;
    try {
      await deleteItem(targetPath);
      await loadTree();

      // Close tabs for deleted item or children
      setTabs((prevTabs) => {
        const nextTabs = prevTabs.filter((t) => {
          if (isDir) {
            return t.path !== targetPath && !t.path.startsWith(`${targetPath}/`);
          }
          return t.path !== targetPath;
        });

        if (nextTabs.length === 0) {
          const defaultTab: NoteTab = {
            id: `tab_${Date.now()}`,
            path: '',
            title: 'New tab',
            isPinned: false,
            isDir: false,
          };
          localStorage.setItem('parma_open_tabs', JSON.stringify([defaultTab]));
          setActiveTabId(defaultTab.id);
          localStorage.setItem('parma_active_tab_id', defaultTab.id);
          setActivePath('');
          setActiveNote(null);
          setIsDirectoryView(false);
          setIsEditing(false);
          setBacklinks([]);
          if (typeof window !== 'undefined') {
            window.history.pushState({ path: '', isDir: false }, '', '/');
          }
          return [defaultTab];
        }

        if (!nextTabs.some((t) => t.id === activeTabId)) {
          const firstTab = nextTabs[0];
          setActiveTabId(firstTab.id);
          localStorage.setItem('parma_active_tab_id', firstTab.id);
          if (firstTab.path === '') {
            setActivePath('');
            setActiveNote(null);
            setIsDirectoryView(false);
            setIsEditing(false);
            setBacklinks([]);
            if (typeof window !== 'undefined') {
              window.history.pushState({ path: '', isDir: false }, '', '/');
            }
          } else if (firstTab.isDir) {
            handleOpenDirectory(firstTab.path, true, false);
          } else {
            handleOpenNote(firstTab.path, true, false);
          }
        }

        localStorage.setItem('parma_open_tabs', JSON.stringify(nextTabs));
        return nextTabs;
      });

      showToast(`Deleted ${targetPath.split('/').pop()}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete item');
    } finally {
      setDeleteModalTarget(null);
    }
  }, [
    deleteModalTarget,
    loadTree,
    homeNote,
    activeTabId,
    handleOpenNote,
    handleOpenDirectory,
    showToast,
  ]);

  // Helper to calculate the current active folder
  const getActiveFolder = useCallback((): string => {
    if (isDirectoryView) {
      return activePath;
    }
    if (activePath && activePath.includes('/')) {
      return activePath.substring(0, activePath.lastIndexOf('/'));
    }
    return '';
  }, [isDirectoryView, activePath]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K or ⌘O / Ctrl+O for Quick Open / Search
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K' || e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      // ⌘T / Ctrl+T for New Tab
      if ((e.metaKey || e.ctrlKey) && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        handleNewTab();
      }
      // ⌘G / Ctrl+G for Graph
      if ((e.metaKey || e.ctrlKey) && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        setIsGraphOpen((prev) => !prev);
      }
      // ⌘N / Ctrl+N for New Note
      if ((e.metaKey || e.ctrlKey) && (e.key === 'n' || e.key === 'N') && !e.shiftKey) {
        e.preventDefault();
        setNewNoteDefaultFolder(getActiveFolder());
        setIsNewNoteOpen(true);
      }
      // ⌘E / Ctrl+E for Edit/View toggle
      if ((e.metaKey || e.ctrlKey) && (e.key === 'e' || e.key === 'E') && activeNote && !isDirectoryView) {
        e.preventDefault();
        setIsEditing((prev) => !prev);
      }
      // ⌘W / Ctrl+W to Close Active Tab
      if ((e.metaKey || e.ctrlKey) && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        if (activeTabId) {
          const currentTab = tabs.find((t) => t.id === activeTabId);
          if (currentTab && !currentTab.isPinned) {
            handleCloseTab(activeTabId);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeNote,
    isDirectoryView,
    activePath,
    getActiveFolder,
    activeTabId,
    tabs,
    handleCloseTab,
    handleNewTab,
  ]);

  const handleSaveNote = async (newContent: string) => {
    if (!activePath) return;
    await saveNote(activePath, newContent, activeNote?.frontmatter);
    await loadNote(activePath);
    await loadTree();
    setIsEditing(false);
  };

  // Interactive task checkbox live sync handler
  const handleToggleTask = async (lineIndex: number, newCheckedState: boolean) => {
    if (!activeNote || !activePath) return;

    const lines = activeNote.content.split('\n');
    if (lineIndex < 0 || lineIndex >= lines.length) return;

    const targetLine = lines[lineIndex];
    let updatedLine: string;
    if (newCheckedState) {
      updatedLine = targetLine.replace(/^(\s*[-*]\s+\[)\s(\])/, '$1x$2');
    } else {
      updatedLine = targetLine.replace(/^(\s*[-*]\s+\[)[xX](\])/, '$1 $2');
    }

    if (updatedLine === targetLine) return;

    lines[lineIndex] = updatedLine;
    const newContent = lines.join('\n');

    // Instant local state update for zero latency
    setActiveNote((prev) => (prev ? { ...prev, content: newContent } : null));

    // Persist to disk
    try {
      await saveNote(activePath, newContent, activeNote.frontmatter);
    } catch (err) {
      console.error('Failed to sync checklist toggle to disk:', err);
      await loadNote(activePath);
    }
  };

  const handleQuickCreateNote = (targetName: string) => {
    const filename = targetName.endsWith('.md') ? targetName : `${targetName}.md`;
    setNewNoteDefaultFolder(filename.includes('/') ? filename.substring(0, filename.lastIndexOf('/')) : '');
    setIsNewNoteOpen(true);
  };

  const toggleFolder = (folderPath: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      persistCollapsedFolders(next);
      return next;
    });
  };

  // All directory paths in tree
  const allFolderPaths = useMemo(() => {
    const paths: string[] = [];
    const collect = (nodes: VaultNode[]) => {
      for (const n of nodes) {
        if (n.type === 'directory') {
          paths.push(n.path);
          if (n.children) collect(n.children);
        }
      }
    };
    collect(tree);
    return paths;
  }, [tree]);

  const areAllFoldersCollapsed = useMemo(() => {
    if (allFolderPaths.length === 0) return false;
    return allFolderPaths.every((p) => collapsedFolders.has(p));
  }, [allFolderPaths, collapsedFolders]);

  const handleToggleCollapseAllFolders = () => {
    if (areAllFoldersCollapsed) {
      setCollapsedFolders(new Set());
      persistCollapsedFolders(new Set());
    } else {
      const allSet = new Set(allFolderPaths);
      setCollapsedFolders(allSet);
      persistCollapsedFolders(allSet);
    }
  };

  const handleAutoRevealCurrentFile = useCallback(() => {
    if (!activePath) return;
    expandAncestors(activePath);
    setTimeout(() => {
      const el =
        document.getElementById(`tree-node-${encodeURIComponent(activePath)}`) ||
        ((activePath.toLowerCase() === 'home.md' ||
          activePath.toLowerCase() === (homeNote || '').toLowerCase() ||
          activePath === '')
          ? document.getElementById('tree-node-home')
          : null);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  }, [activePath, expandAncestors, homeNote]);

  const handleToggleAutoReveal = () => {
    const next = !isAutoRevealActive;
    setIsAutoRevealActive(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('parma_auto_reveal', next.toString());
    }
    if (next) {
      handleAutoRevealCurrentFile();
      showToast('Auto-reveal enabled');
    } else {
      showToast('Auto-reveal disabled');
    }
  };

  useEffect(() => {
    if (isAutoRevealActive && activePath) {
      handleAutoRevealCurrentFile();
    }
  }, [activePath, isAutoRevealActive, handleAutoRevealCurrentFile]);

  // Render tree node recursive
  const renderTreeNode = (node: VaultNode, depth: number = 0) => {
    if (node.type === 'directory') {
      const isCollapsed = collapsedFolders.has(node.path);
      const isSelected =
        isDirectoryView &&
        (activePath === node.path || activePath.toLowerCase() === node.path.toLowerCase());

      return (
        <div key={node.path} className="select-none">
          <div
            id={`tree-node-${encodeURIComponent(node.path)}`}
            onClick={() => handleOpenDirectory(node.path)}
            onContextMenu={(e) => handleFolderContextMenu(node.path, e)}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              isSelected
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
            style={{ paddingLeft: `${depth * 24 + 8}px` }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                onClick={(e) => toggleFolder(node.path, e)}
                className="p-0.5 rounded hover:bg-slate-300/40 dark:hover:bg-slate-700/40 transition-colors"
              >
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
              <span className="truncate">{node.name}</span>
            </div>
          </div>
          {!isCollapsed && node.children && (
            <div className="space-y-0.5 mt-0.5">
              {sortNodes(node.children, sortOrder).map((child) => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    if (node.type === 'file') {
      const isMd = node.name.endsWith('.md') || node.name.endsWith('.markdown');
      if (!isMd) return null;

      // Filter out root Home.md from repeating in the list below
      if (
        depth === 0 &&
        (node.name.toLowerCase() === 'home.md' ||
          node.path.toLowerCase() === homeNote.toLowerCase())
      ) {
        return null;
      }

      const isActive =
        !isDirectoryView &&
        (activePath === node.path || activePath.toLowerCase() === node.path.toLowerCase());
      const cleanName = node.name.replace(/\.md$|\.markdown$/i, '');

      return (
        <div
          key={node.path}
          id={`tree-node-${encodeURIComponent(node.path)}`}
          onClick={() => handleOpenNote(node.path)}
          onContextMenu={(e) => handleNoteContextMenu(node.path, e)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
            isActive
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 font-normal'
          }`}
          style={{ paddingLeft: `${depth * 24 + 8}px` }}
        >
          <FileText
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
            }`}
          />
          <span className="truncate">{cleanName}</span>
        </div>
      );
    }

    return null;
  };

  // Find root Home note if present
  const rootHomeNode = useMemo(() => {
    const customHomeClean = (homeNote || 'Home.md').toLowerCase();
    return tree.find(
      (n) =>
        n.type === 'file' &&
        (n.path.toLowerCase() === customHomeClean ||
         n.name.toLowerCase() === 'home.md' ||
         n.name.toLowerCase() === 'index.md')
    );
  }, [tree, homeNote]);

  // Root Directories sorted according to sortOrder
  const rootDirectories = useMemo(() => {
    const dirs = tree.filter((n) => n.type === 'directory');
    return sortNodes(dirs, sortOrder);
  }, [tree, sortOrder]);

  // Root Markdown Files (excluding Home) sorted according to sortOrder
  const rootFiles = useMemo(() => {
    const customHomeClean = (homeNote || 'Home.md').toLowerCase();
    const files = tree
      .filter((n) => n.type === 'file' && (n.name.endsWith('.md') || n.name.endsWith('.markdown')))
      .filter((n) => n.path.toLowerCase() !== customHomeClean && n.name.toLowerCase() !== 'home.md' && n.name.toLowerCase() !== 'index.md');
    return sortNodes(files, sortOrder);
  }, [tree, homeNote, sortOrder]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans relative">
      {/* Mobile Sidebar Overlay Backdrop (Clicking outside closes sidebar on mobile) */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden transition-opacity cursor-pointer animate-in fade-in duration-150"
          title="Click to close sidebar"
        />
      )}

      {/* Left Navigation Sidebar */}
      <aside
        style={
          typeof window !== 'undefined' && window.innerWidth >= 768
            ? { width: sidebarOpen ? `${leftWidth}px` : '0px' }
            : undefined
        }
        className={`fixed md:relative inset-y-0 left-0 z-50 md:z-20 flex flex-col bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-slate-200 dark:border-slate-800 transition-all duration-200 ease-in-out ${
          sidebarOpen
            ? 'translate-x-0 w-72 max-w-[80vw] md:max-w-none md:w-auto shadow-2xl md:shadow-none'
            : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden'
        }`}
      >
        {/* Invisible Left Sidebar Resize Handle (Mouse changes to col-resize grabber on desktop when open) */}
        {sidebarOpen && (
          <div
            onMouseDown={handleLeftMouseDown}
            className="hidden md:block absolute right-0 top-0 bottom-0 w-2 cursor-col-resize select-none z-30 hover:bg-transparent"
            title="Drag to resize sidebar"
          />
        )}

        {/* Header / Logo with navigation to Home Note */}
        <div className="flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 pt-[env(safe-area-inset-top)] h-[calc(3.5rem+env(safe-area-inset-top))] sm:h-14 sm:pt-0">
          <div
            onClick={() => handleNavigateHome(true)}
            className="flex items-center gap-2.5 font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 cursor-pointer hover:opacity-85 transition-opacity select-none"
            title={`Go to Home (${homeNote || 'Home.md'})`}
          >
            <img 
              src={isDark ? darkLogo : lightLogo} 
              alt={wikiTitle} 
              className="h-6 w-auto object-contain"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <span className="font-serif font-bold text-lg tracking-wide text-slate-900 dark:text-slate-100 truncate max-w-[140px]">
              {wikiTitle}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Animated '+' Dropdown Menu */}
            <div className="relative" ref={addMenuRef}>
              <button
                onClick={() => setIsAddMenuOpen((prev) => !prev)}
                title={isAddMenuOpen ? "Close menu" : "New page or folder"}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  isAddMenuOpen
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Plus
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isAddMenuOpen ? 'rotate-45 text-blue-600 dark:text-blue-400' : 'rotate-0'
                  }`}
                />
              </button>

              {isAddMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 select-none font-sans">
                  <button
                    onClick={() => {
                      setIsAddMenuOpen(false);
                      setNewNoteDefaultFolder(getActiveFolder());
                      setIsNewNoteOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300 transition-colors cursor-pointer text-left"
                  >
                    <FilePlus className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span>New Note</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAddMenuOpen(false);
                      const def = isDirectoryView ? activePath : '';
                      setNewFolderDefaultParent(def);
                      setIsNewFolderOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-300 transition-colors cursor-pointer text-left"
                  >
                    <FolderPlus className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>New Folder</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              title="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Obsidian Sidebar Tabs: Files | Search | Bookmarks */}
        <div className="h-9 px-1.5 gap-1 flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 flex-shrink-0">
          <button
            onClick={() => setActiveTab('files')}
            className={`h-[30px] flex-1 flex items-center justify-center rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeTab === 'files'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800/90 font-semibold shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
            }`}
            title="Files"
          >
            <Folder className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`h-[30px] flex-1 flex items-center justify-center rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeTab === 'search'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800/90 font-semibold shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
            }`}
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`h-[30px] flex-1 flex items-center justify-center rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeTab === 'bookmarks'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800/90 font-semibold shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
            }`}
            title="Bookmarks"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>

        {/* Tab View Content */}
        {activeTab === 'files' ? (
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {/* Files Tab Action Toolbar Directly Above 'Home' Row */}
            <div
              ref={sortMenuRef}
              className="relative flex items-center justify-end px-2 py-1 mb-1 border-b border-slate-200/60 dark:border-slate-800/60 text-slate-500 dark:text-slate-400"
            >
              <div className="flex items-center gap-1">
                {/* Change Sort Order Dropdown */}
                <button
                  onClick={() => setIsSortMenuOpen((prev) => !prev)}
                  title="Change sort order"
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    isSortMenuOpen
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                      : 'hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>

                {/* Auto-reveal current file */}
                <button
                  onClick={handleToggleAutoReveal}
                  title={isAutoRevealActive ? 'Auto-reveal current file (Active)' : 'Auto-reveal current file'}
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    isAutoRevealActive
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                      : 'hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3.5 h-3.5"
                  >
                    <line x1="3" y1="4" x2="21" y2="4" />
                    <rect x="3" y="8" width="18" height="8" rx="2" />
                    <line x1="3" y1="20" x2="21" y2="20" />
                  </svg>
                </button>

                {/* Collapse all / Expand all */}
                <button
                  onClick={handleToggleCollapseAllFolders}
                  title={areAllFoldersCollapsed ? 'Expand all' : 'Collapse all'}
                  className="p-1 rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {areAllFoldersCollapsed ? (
                    <ChevronsUpDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronsDownUp className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {isSortMenuOpen && (
                <div className="absolute right-2 top-full mt-1 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 select-none text-xs">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700/50 mb-1">
                    Change Sort Order
                  </div>
                  {[
                    { id: 'name-asc', label: 'File name (A to Z)' },
                    { id: 'name-desc', label: 'File name (Z to A)' },
                    { id: 'mtime-desc', label: 'Modified time (new to old)' },
                    { id: 'mtime-asc', label: 'Modified time (old to new)' },
                    { id: 'ctime-desc', label: 'Created time (new to old)' },
                    { id: 'ctime-asc', label: 'Created time (old to new)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSortOrder(opt.id as SortOrder);
                        localStorage.setItem('parma_sort_order', opt.id);
                        setIsSortMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300 transition-colors cursor-pointer text-left ${
                        sortOrder === opt.id
                          ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-900/20'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortOrder === opt.id && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pinned Home Row */}
            <div
              id="tree-node-home"
              onClick={() => handleNavigateHome(true)}
              onContextMenu={(e) => {
                const homeTarget = rootHomeNode?.path || homeNote || 'Home.md';
                handleNoteContextMenu(homeTarget, e);
              }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors mb-1 ${
                (activePath === (rootHomeNode?.path || homeNote) || activePath.toLowerCase() === 'home.md' || activePath === '') && !isDirectoryView
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold'
                  : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 font-medium'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="truncate">Home</span>
            </div>

            {/* Root Directories */}
            {rootDirectories.map((dir) => renderTreeNode(dir, 0))}

            {/* Root Files */}
            {rootFiles.map((file) => renderTreeNode(file, 0))}
          </div>
        ) : activeTab === 'search' ? (
          <div className="flex-1 overflow-hidden">
            <SidebarSearch
              onOpenNote={handleOpenNote}
              searchQuery={sidebarSearchQuery}
              onSearchQueryChange={setSidebarSearchQuery}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <BookmarksView
              activePath={activePath}
              activeNoteTitle={activeNote?.title || ''}
              onOpenNote={handleOpenNote}
              onOpenAddBookmarkModal={() => setIsAddBookmarkOpen(true)}
              bookmarksVersion={bookmarksVersion}
            />
          </div>
        )}

        {/* Sidebar Footer */}
        <div className="p-3 pb-8 sm:pb-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-1.5 pl-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{allNotePaths.length} notes</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Vault Settings & Brand Config"
              className="p-2.5 sm:p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer min-w-[42px] min-h-[42px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center bg-slate-200/50 dark:bg-slate-800/60"
            >
              <SettingsIcon className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setIsGraphOpen(true)}
              title="Knowledge Graph (⌘G)"
              className="p-2.5 sm:p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer min-w-[42px] min-h-[42px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center bg-slate-200/50 dark:bg-slate-800/60"
            >
              <Network className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setIsDark((d) => !d)}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
              className="p-2.5 sm:p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer min-w-[42px] min-h-[42px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center bg-slate-200/50 dark:bg-slate-800/60"
            >
              {isDark ? <Sun className="w-5 h-5 sm:w-4 sm:h-4" /> : <Moon className="w-5 h-5 sm:w-4 sm:h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-slate-900">
        {/* Top Navbar */}
        <header className="border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-slate-900 pt-[env(safe-area-inset-top)] h-[calc(3.5rem+env(safe-area-inset-top))] sm:h-14 sm:pt-0 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={toggleLeftSidebar}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={sidebarOpen ? "Hide navigation sidebar" : "Show navigation sidebar"}
            >
              <SidebarIcon className="w-4 h-4" />
            </button>

            {/* Breadcrumb Path with Clickable Home Icon & Folder Segments */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
              <button
                onClick={() => handleNavigateHome(true)}
                title="Go to Home"
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
              </button>
              <span>/</span>
              {activePath ? (
                <div className="flex items-center gap-1 truncate font-medium text-slate-800 dark:text-slate-200">
                  {activePath.split('/').map((seg, i, arr) => {
                    const isLast = i === arr.length - 1;
                    const segPath = arr.slice(0, i + 1).join('/');
                    const isFile = seg.endsWith('.md') || seg.endsWith('.markdown');

                    return (
                      <React.Fragment key={segPath}>
                        {isLast ? (
                          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {seg}
                          </span>
                        ) : (
                          <>
                            <span
                              onClick={() => isFile ? handleOpenNote(segPath) : handleOpenDirectory(segPath)}
                              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer truncate"
                            >
                              {seg}
                            </span>
                            <span>/</span>
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                <span className="font-medium text-slate-700 dark:text-slate-300">New tab</span>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGraphOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Network className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Graph</span>
            </button>

            {activeNote && !isDirectoryView && (
              <button
                onClick={() => setIsEditing((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isEditing
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Viewing' : 'Edit'}</span>
              </button>
            )}

            {/* Desktop Right Sidebar (TOC & Backlinks) Toggle - Unobtrusive, matching Left Sidebar */}
            {!isEditing && !isDirectoryView && activeNote && (
              <button
                onClick={toggleRightSidebar}
                title={rightSidebarOpen ? "Hide Outline & Backlinks" : "Show Outline & Backlinks"}
                className="hidden xl:flex items-center p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <PanelRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Obsidian-Style Note Tabs Bar directly above main note content area */}
        <NoteTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onNewTab={handleNewTab}
          onTabContextMenu={handleTabContextMenu}
        />

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {currentActiveTab && currentActiveTab.path === '' ? (
            <NewTabLanding
              onCreateNewNote={() => {
                setNewNoteDefaultFolder(getActiveFolder());
                setIsNewNoteOpen(true);
              }}
              onQuickOpen={() => setIsSearchOpen(true)}
              onCloseTab={() => {
                if (activeTabId) {
                  handleCloseTab(activeTabId);
                }
              }}
            />
          ) : (
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
              {isLoadingNote ? (
                <div className="flex items-center justify-center h-64 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading document...</span>
                </div>
              ) : isDirectoryView ? (
                <DirectoryView
                  directoryPath={activePath}
                  tree={tree}
                  onOpenNote={handleOpenNote}
                  onOpenDirectory={handleOpenDirectory}
                  onNoteContextMenu={handleNoteContextMenu}
                  onFolderContextMenu={handleFolderContextMenu}
                />
              ) : isEditing && activeNote ? (
                <NoteEditor
                  note={activeNote}
                  allNotePaths={allNotePaths}
                  onSave={handleSaveNote}
                  onCancel={() => setIsEditing(false)}
                />
              ) : activeNote ? (
                <NoteView
                  note={activeNote}
                  allNotePaths={allNotePaths}
                  onOpenNote={handleOpenNote}
                  onQuickCreateNote={handleQuickCreateNote}
                  onToggleTask={handleToggleTask}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                    No note selected
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Select a document from the vault tree on the left, or create a new note to begin.
                  </p>
                  <button
                    onClick={() => {
                      setNewNoteDefaultFolder(getActiveFolder());
                      setIsNewNoteOpen(true);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Note</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Right Sidebar: Table of Contents & Backlinks (Toggleable & Resizable on Desktop) */}
          {!isEditing && !isDirectoryView && activeNote && rightSidebarOpen && (
            <aside 
              style={{ width: `${rightWidth}px` }}
              className="hidden xl:flex flex-col p-6 border-l border-slate-200 dark:border-slate-800 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-900/50 relative flex-shrink-0"
            >
              {/* Invisible Right Sidebar Resize Handle (Mouse changes to col-resize grabber) */}
              <div
                onMouseDown={handleRightMouseDown}
                className="hidden xl:block absolute left-0 top-0 bottom-0 w-2 cursor-col-resize select-none z-20 hover:bg-transparent"
                title="Drag to resize outline"
              />
              <TableOfContents content={activeNote.content} />
              <BacklinksPanel backlinks={backlinks} onOpenNote={handleOpenNote} />
            </aside>
          )}
        </div>
      </main>

      {/* Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectNote={(path) => {
          setIsSearchOpen(false);
          handleOpenNote(path);
        }}
      />

      <GraphView
        isOpen={isGraphOpen}
        currentNotePath={activePath}
        onClose={() => setIsGraphOpen(false)}
        onSelectNote={(path) => {
          setIsGraphOpen(false);
          handleOpenNote(path);
        }}
      />

      <NewNoteModal
        isOpen={isNewNoteOpen}
        defaultFolder={newNoteDefaultFolder}
        onClose={() => setIsNewNoteOpen(false)}
        onCreated={async (newPath) => {
          setIsNewNoteOpen(false);
          await loadTree();
          handleOpenNote(newPath);
          showToast(`Note created successfully`);
        }}
      />

      <NewFolderModal
        isOpen={isNewFolderOpen}
        defaultParent={newFolderDefaultParent}
        tree={tree}
        onClose={() => setIsNewFolderOpen(false)}
        onCreated={async (newFolderPath) => {
          setIsNewFolderOpen(false);
          await loadTree();
          expandAncestors(newFolderPath);
          setCollapsedFolders((prev) => {
            const next = new Set(prev);
            next.delete(newFolderPath);
            persistCollapsedFolders(next);
            return next;
          });
          handleOpenDirectory(newFolderPath);
          showToast(`Folder "${newFolderPath.split('/').pop() || newFolderPath}" created`);
        }}
      />

      <AddBookmarkModal
        isOpen={isAddBookmarkOpen}
        onClose={() => {
          setIsAddBookmarkOpen(false);
          setBookmarkModalPath('');
          setBookmarkModalTitle('');
        }}
        activePath={bookmarkModalPath || activePath}
        activeTitle={bookmarkModalTitle || activeNote?.title || ''}
        existingGroups={existingBookmarkGroups}
        onBookmarkSaved={() => {
          setBookmarksVersion((v) => v + 1);
          showToast('Bookmark added successfully');
        }}
      />

      {/* Move Destination Picker Modal */}
      {moveModalTarget && (
        <FileBrowserModal
          isOpen={Boolean(moveModalTarget)}
          title={`Move "${moveModalTarget.path.split('/').pop() || moveModalTarget.path}" to...`}
          filter="folders"
          useRelativePath={true}
          onClose={() => setMoveModalTarget(null)}
          onSelect={handleConfirmMove}
        />
      )}

      {/* Rename Modal */}
      {renameModalTarget && (
        <RenameModal
          isOpen={Boolean(renameModalTarget)}
          targetPath={renameModalTarget.path}
          isDir={renameModalTarget.isDir}
          onClose={() => setRenameModalTarget(null)}
          onRenamed={handleRenamed}
        />
      )}

      {/* Confirm Delete Modal */}
      {deleteModalTarget && (
        <ConfirmDeleteModal
          isOpen={Boolean(deleteModalTarget)}
          targetPath={deleteModalTarget.path}
          isDir={deleteModalTarget.isDir}
          onClose={() => setDeleteModalTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Right-Click Context Menu */}
      {contextMenu && contextMenu.isOpen && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        wikiTitle={wikiTitle}
        onSaveWikiTitle={(t) => setWikiTitle(t)}
        homeNote={homeNote}
        onSaveHomeNote={(h) => setHomeNote(h)}
        lightLogo={lightLogo}
        onSaveLightLogo={(l) => setLightLogo(l)}
        darkLogo={darkLogo}
        onSaveDarkLogo={(d) => setDarkLogo(d)}
        faviconUrl={faviconUrl}
        onSaveFaviconUrl={(f) => setFaviconUrl(f)}
        allNotePaths={allNotePaths}
        onVaultChanged={async () => {
          setActiveNote(null);
          setActivePath('');
          await loadTree();
          await loadAndApplyTheme();
        }}
        vaultThemeData={vaultThemeData}
        currentThemeId={selectedThemeId || resolveEffectiveTheme(null, vaultThemeData)}
        onThemeSelected={handleThemeSelected}
        customCss={customCss}
        onSaveCustomCss={handleSaveCustomCss}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl shadow-2xl border border-slate-700 dark:border-slate-300 text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

