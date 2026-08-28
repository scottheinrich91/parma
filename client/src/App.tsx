import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Network,
  Edit3,
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
  Search,
  Settings,
  BookOpen,
} from 'lucide-react';
import {
  fetchVaultTree,
  fetchNote,
  saveNote,
  deleteItem,
  fetchBacklinks,
} from './api';
import { VaultNode, NoteData, BacklinkItem } from './types';
import { TengwarLogo } from './components/TengwarLogo';
import { NoteView } from './components/NoteView';
import { NoteEditor } from './components/NoteEditor';
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

  // Modals & Panels
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isGraphOpen, setIsGraphOpen] = useState<boolean>(false);
  const [isNewNoteOpen, setIsNewNoteOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [newNoteDefaultFolder, setNewNoteDefaultFolder] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

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
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('parma-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('parma-theme', 'light');
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

  // Navigate to configured Home Note
  const handleNavigateHome = useCallback(() => {
    if (allNotePaths.length === 0) return;

    const target = (homeNote || 'Home.md').trim();
    const cleanTarget = target.replace(/\.md$/i, '').toLowerCase();

    // Check exact path match or base name match or case-insensitive match
    const found = allNotePaths.find((p) => {
      const pClean = p.replace(/\.md$/i, '').toLowerCase();
      const baseName = pClean.includes('/') ? pClean.substring(pClean.lastIndexOf('/') + 1) : pClean;
      return pClean === cleanTarget || baseName === cleanTarget || p === target;
    });

    if (found) {
      setActivePath(found);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    } else {
      // Fallback: Home.md -> Index.md -> first note
      const fallback =
        allNotePaths.find((p) => p.toLowerCase() === 'home.md' || p.toLowerCase() === 'index.md') ||
        allNotePaths[0];
      if (fallback) {
        setActivePath(fallback);
        if (window.innerWidth < 768) {
          setSidebarOpen(false);
        }
      }
    }
  }, [allNotePaths, homeNote]);

  // Load Tree & initial note
  const loadTree = useCallback(async () => {
    try {
      const data = await fetchVaultTree();
      setTree(data.tree);
      setVaultRoot(data.root);

      // Default to configured Home Note, Index.md, or first file if no active path
      if (!activePath && data.tree.length > 0) {
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

        const target = (homeNote || 'Home.md').trim().toLowerCase();
        const cleanTarget = target.replace(/\.md$/i, '');

        const defaultNote =
          flat.find((p) => {
            const pClean = p.toLowerCase().replace(/\.md$/i, '');
            const baseName = pClean.includes('/') ? pClean.substring(pClean.lastIndexOf('/') + 1) : pClean;
            return pClean === cleanTarget || baseName === cleanTarget || p.toLowerCase() === target;
          }) ||
          flat.find((p) => p.toLowerCase() === 'home.md' || p.toLowerCase() === 'index.md') ||
          flat[0];

        if (defaultNote) {
          setActivePath(defaultNote);
        }
      }
    } catch (err) {
      console.error('Failed to load vault tree:', err);
    }
  }, [activePath, homeNote]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  // Load Active Note & Backlinks
  const loadNote = useCallback(async (path: string) => {
    if (!path) return;
    setIsLoadingNote(true);
    try {
      const note = await fetchNote(path);
      setActiveNote(note);
      setIsEditing(false);

      // Fetch backlinks
      try {
        const bl = await fetchBacklinks(path);
        setBacklinks(bl);
      } catch {
        setBacklinks([]);
      }
    } catch (err) {
      console.error(`Failed to load note ${path}:`, err);
      setActiveNote(null);
    } finally {
      setIsLoadingNote(false);
    }
  }, []);

  useEffect(() => {
    if (activePath) {
      loadNote(activePath);
    }
  }, [activePath, loadNote]);

  // Update browser document title
  useEffect(() => {
    const pageTitle = activeNote?.path
      ? `${activeNote.path.replace(/\.md$/i, '')} — ${wikiTitle}`
      : wikiTitle;
    document.title = pageTitle;
  }, [activeNote, wikiTitle]);

  // Keyboard shortcuts (Cmd+K / Ctrl+K for search, Cmd+E for edit, Cmd+G for graph)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (activeNote) {
          setIsEditing((prev) => !prev);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setIsGraphOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNote]);

  const handleOpenNote = (path: string) => {
    setActivePath(path);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleSaveNote = async (newContent: string) => {
    if (!activePath) return;
    await saveNote(activePath, newContent, activeNote?.frontmatter);
    await loadNote(activePath);
    await loadTree();
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

    // Instant local state update for smooth UX
    setActiveNote((prev) => (prev ? { ...prev, content: newContent } : null));

    // Persist to disk
    try {
      await saveNote(activePath, newContent, activeNote.frontmatter);
    } catch (err) {
      console.error('Failed to sync checklist toggle to disk:', err);
      await loadNote(activePath);
    }
  };

  const handleDeleteNote = async () => {
    if (!activePath) return;
    if (!window.confirm(`Are you sure you want to delete "${activePath}"?`)) return;

    try {
      await deleteItem(activePath);
      setActiveNote(null);
      setActivePath('');
      await loadTree();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete note');
    }
  };

  const handleQuickCreateNote = (targetName: string) => {
    const filename = targetName.endsWith('.md') ? targetName : `${targetName}.md`;
    setNewNoteDefaultFolder(filename.includes('/') ? filename.substring(0, filename.lastIndexOf('/')) : '');
    setIsNewNoteOpen(true);
  };

  const toggleFolder = (folderPath: string) => {
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
      return (
        <div key={node.path} className="select-none">
          <div
            onClick={() => toggleFolder(node.path)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
            style={{ paddingLeft: `${Math.max(8, depth * 14 + 8)}px` }}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            )}
            {isCollapsed ? (
              <Folder className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            ) : (
              <FolderOpen className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            )}
            <span className="truncate">{node.name}</span>
          </div>
          {!isCollapsed && node.children && (
            <div className="space-y-0.5">
              {node.children.map((child) => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    if (node.type === 'file') {
      const isMd = node.name.endsWith('.md') || node.name.endsWith('.markdown');
      if (!isMd) return null;

      const isActive = activePath === node.path;
      const cleanName = node.name.replace(/\.md$|\.markdown$/i, '');

      return (
        <div
          key={node.path}
          onClick={() => handleOpenNote(node.path)}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
            isActive
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold border-l-2 border-blue-600 dark:border-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 flex flex-col w-64 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden'
        }`}
      >
        {/* Header / Logo with navigation to Home Note */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200 dark:border-slate-800">
          <div
            onClick={handleNavigateHome}
            className="flex items-center gap-2 font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 cursor-pointer hover:opacity-80 transition-opacity select-none"
            title={`Go to Home (${homeNote || 'Home.md'})`}
          >
            <TengwarLogo className="h-7 w-auto text-slate-800 dark:text-slate-100" />
            <span className="truncate max-w-[100px]">{wikiTitle}</span>
            <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              Wiki
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
        <div className="p-3 border-b border-slate-200 dark:border-slate-800">
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

        {/* Vault File Tree */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {vaultRoot}
          </div>
          {tree.map((node) => renderTreeNode(node, 0))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{allNotePaths.length} notes</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsGraphOpen(true)}
              title="Knowledge Graph (⌘G)"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Network className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsDark((d) => !d)}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Settings & Identity"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-slate-900">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle Sidebar"
            >
              <SidebarIcon className="w-4 h-4" />
            </button>

            {/* Breadcrumb Path */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
              <button
                onClick={handleNavigateHome}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer p-0.5 rounded"
                title={`Go to Home (${homeNote || 'Home.md'})`}
              >
                <Home className="w-3.5 h-3.5" />
              </button>
              <span>/</span>
              {activePath ? (
                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {activePath}
                </span>
              ) : (
                <span className="italic">No note selected</span>
              )}
            </div>
          </div>

          {/* Top-Right Action Bar: ONLY Graph toggle button and Edit / Viewing toggle button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGraphOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Knowledge Graph (⌘G)"
            >
              <Network className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Graph</span>
            </button>

            {activeNote && (
              <button
                onClick={() => setIsEditing((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isEditing
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={isEditing ? 'Switch to Reader Mode' : 'Edit Note (⌘E)'}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Viewing' : 'Edit'}</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Article or Editor */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
            {isLoadingNote ? (
              <div className="flex items-center justify-center h-64 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                <span>Loading note...</span>
              </div>
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
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Note</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar: Table of Contents & Backlinks (only in View Mode) */}
          {!isEditing && activeNote && (
            <aside className="hidden xl:flex flex-col w-72 p-6 border-l border-slate-200 dark:border-slate-800 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
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
        onSaveWikiTitle={setWikiTitle}
        homeNote={homeNote}
        onSaveHomeNote={setHomeNote}
        allNotePaths={allNotePaths}
      />
    </div>
  );
}
