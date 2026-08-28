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
  FileText,
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
} from 'lucide-react';
import {
  fetchVaultTree,
  fetchNote,
  saveNote,
  deleteItem,
  fetchBacklinks,
} from './api';
import { VaultNode, NoteData, BacklinkItem } from './types';
import { NoteView } from './components/NoteView';
import { NoteEditor } from './components/NoteEditor';
import { DirectoryView } from './components/DirectoryView';
import { TableOfContents } from './components/TableOfContents';
import { BacklinksPanel } from './components/BacklinksPanel';
import { GraphView } from './components/GraphView';
import { SearchModal } from './components/SearchModal';
import { NewNoteModal } from './components/NewNoteModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [tree, setTree] = useState<VaultNode[]>([]);
  const [vaultRoot, setVaultRoot] = useState<string>('Vault');
  const [activePath, setActivePath] = useState<string>('');
  const [activeNote, setActiveNote] = useState<NoteData | null>(null);
  const [backlinks, setBacklinks] = useState<BacklinkItem[]>([]);
  const [isLoadingNote, setIsLoadingNote] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [isDirectoryView, setIsDirectoryView] = useState<boolean>(false);

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
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [newNoteDefaultFolder, setNewNoteDefaultFolder] = useState<string>('');

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

  // Open a specific note (with clean history push)
  const handleOpenNote = useCallback((path: string, pushToHistory: boolean = true) => {
    setActivePath(path);
    setIsDirectoryView(false);
    loadNote(path);

    if (pushToHistory && typeof window !== 'undefined') {
      const targetUrl = getCleanUrl(path);
      if (window.location.pathname + window.location.search !== targetUrl) {
        window.history.pushState({ path, isDir: false }, '', targetUrl);
      }
    }

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [loadNote, getCleanUrl]);

  // Open a directory view (with clean history push)
  const handleOpenDirectory = useCallback((folderPath: string, pushToHistory: boolean = true) => {
    setActivePath(folderPath);
    setActiveNote(null);
    setIsDirectoryView(true);
    setIsEditing(false);

    if (pushToHistory && typeof window !== 'undefined') {
      const targetUrl = getCleanUrl(folderPath);
      if (window.location.pathname + window.location.search !== targetUrl) {
        window.history.pushState({ path: folderPath, isDir: true }, '', targetUrl);
      }
    }

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [getCleanUrl]);

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
      setCollapsedFolders(allDirs);

      // Route from active URL path on initial tree load
      const urlPath = getPathFromUrl();
      if (urlPath) {
        if (urlPath.endsWith('.md') || urlPath.endsWith('.markdown')) {
          handleOpenNote(urlPath, false);
        } else {
          const mdCandidate = urlPath + '.md';
          const match = data.tree.some((n) => n.path === urlPath || n.path === mdCandidate);
          if (match) {
            handleOpenNote(mdCandidate, false);
          } else {
            handleOpenDirectory(urlPath, false);
          }
        }
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

        const targetFirst = flat.find((p) => p.toLowerCase() === customHome.toLowerCase()) ||
                            flat.find((p) => p.toLowerCase() === 'home.md' || p.toLowerCase() === 'index.md') ||
                            flat[0] || '';

        if (targetFirst) {
          handleOpenNote(targetFirst, false);
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
          handleOpenDirectory(targetPath, false);
        }
      } else {
        handleNavigateHome(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleOpenNote, handleOpenDirectory, handleNavigateHome, getPathFromUrl]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K for Search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      // ⌘G or Ctrl+G for Graph
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        setIsGraphOpen((prev) => !prev);
      }
      // ⌘N or Ctrl+N for New Note
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        setNewNoteDefaultFolder('');
        setIsNewNoteOpen(true);
      }
      // ⌘E or Ctrl+E for Edit/View toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'e' && activeNote && !isDirectoryView) {
        e.preventDefault();
        setIsEditing((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNote, isDirectoryView]);

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
      return next;
    });
  };

  // Render tree node recursive
  const renderTreeNode = (node: VaultNode, depth: number = 0) => {
    if (node.type === 'directory') {
      const isCollapsed = collapsedFolders.has(node.path);
      const isSelected = activePath === node.path;

      return (
        <div key={node.path} className="select-none">
          <div
            onClick={() => handleOpenDirectory(node.path)}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              isSelected
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
            style={{ paddingLeft: `${Math.max(8, depth * 14 + 8)}px` }}
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
              {node.children
                .slice()
                .sort((a, b) => {
                  if (a.type === 'directory' && b.type !== 'directory') return -1;
                  if (a.type !== 'directory' && b.type === 'directory') return 1;
                  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
                })
                .map((child) => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    if (node.type === 'file') {
      const isMd = node.name.endsWith('.md') || node.name.endsWith('.markdown');
      if (!isMd) return null;

      // Filter out root Home.md from repeating in the list below
      if (depth === 0 && (node.name.toLowerCase() === 'home.md' || node.path.toLowerCase() === homeNote.toLowerCase())) {
        return null;
      }

      const isActive = activePath === node.path;
      const cleanName = node.name.replace(/\.md$|\.markdown$/i, '');

      return (
        <div
          key={node.path}
          onClick={() => handleOpenNote(node.path)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
            isActive
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 font-normal'
          }`}
          style={{ paddingLeft: `${Math.max(8, depth * 14 + 8)}px` }}
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

  // Root Directories sorted alphabetically
  const rootDirectories = useMemo(() => {
    return tree
      .filter((n) => n.type === 'directory')
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [tree]);

  // Root Markdown Files (excluding Home) sorted alphabetically
  const rootFiles = useMemo(() => {
    const customHomeClean = (homeNote || 'Home.md').toLowerCase();
    return tree
      .filter((n) => n.type === 'file' && (n.name.endsWith('.md') || n.name.endsWith('.markdown')))
      .filter((n) => n.path.toLowerCase() !== customHomeClean && n.name.toLowerCase() !== 'home.md' && n.name.toLowerCase() !== 'index.md')
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [tree, homeNote]);

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
            <button
              onClick={() => {
                setNewNoteDefaultFolder('');
                setIsNewNoteOpen(true);
              }}
              title="New Note"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              title="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Search Button */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Quick open...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Vault File Tree with Home pinned at Top, then Directories alphabetically */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {/* Pinned Home Row */}
          <div
            onClick={() => handleNavigateHome(true)}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors mb-1 ${
              (activePath === (rootHomeNode?.path || homeNote) || activePath.toLowerCase() === 'home.md' || activePath === '') && !isDirectoryView
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold'
                : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 font-medium'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="truncate">Home</span>
          </div>

          {/* Root Directories (Collapsed by default, Alphabetical) */}
          {rootDirectories.map((dir) => renderTreeNode(dir, 0))}

          {/* Root Files (Alphabetical) */}
          {rootFiles.map((file) => renderTreeNode(file, 0))}
        </div>

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
                <span className="italic">No document selected</span>
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

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Article, Directory Index, or Editor */}
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
                  onClick={() => setIsNewNoteOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Note</span>
                </button>
              </div>
            )}
          </div>

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
        }}
      />

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
        }}
      />
    </div>
  );
}
