import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  Folder, 
  Database, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  ArrowRight,
  FolderOpen,
  Image as ImageIcon,
  Globe,
  FileText,
  RotateCcw,
  Sparkles,
  Search,
  Palette,
  Code,
  Layers,
  Sliders,
  CheckCircle2,
  Paintbrush,
  ExternalLink
} from 'lucide-react';
import { fetchVaults, switchVault, VaultOption, VaultThemeResponse } from '../api';
import { BUILT_IN_THEMES, ThemePreset } from '../themes';
import { FileBrowserModal } from './FileBrowserModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wikiTitle: string;
  onSaveWikiTitle: (title: string) => void;
  homeNote: string;
  onSaveHomeNote: (homeNote: string) => void;
  lightLogo: string;
  onSaveLightLogo: (logo: string) => void;
  darkLogo: string;
  onSaveDarkLogo: (logo: string) => void;
  faviconUrl: string;
  onSaveFaviconUrl: (url: string) => void;
  allNotePaths: string[];
  onVaultChanged: () => void;
  vaultThemeData?: VaultThemeResponse | null;
  currentThemeId: string;
  onThemeSelected: (themeId: string) => void;
  customCss: string;
  onSaveCustomCss: (css: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  wikiTitle,
  onSaveWikiTitle,
  homeNote,
  onSaveHomeNote,
  lightLogo,
  onSaveLightLogo,
  darkLogo,
  onSaveDarkLogo,
  faviconUrl,
  onSaveFaviconUrl,
  allNotePaths,
  onVaultChanged,
  vaultThemeData,
  currentThemeId,
  onThemeSelected,
  customCss,
  onSaveCustomCss,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'themes' | 'vaults'>('general');
  const [localTitle, setLocalTitle] = useState(wikiTitle);
  const [localHomeNote, setLocalHomeNote] = useState(homeNote);
  const [localLightLogo, setLocalLightLogo] = useState(lightLogo);
  const [localDarkLogo, setLocalDarkLogo] = useState(darkLogo);
  const [localFavicon, setLocalFavicon] = useState(faviconUrl);
  const [useSameLogo, setUseSameLogo] = useState(lightLogo === darkLogo);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Theme & Custom CSS state
  const [localCustomCss, setLocalCustomCss] = useState(customCss);
  const [cssSavedSuccess, setCssSavedSuccess] = useState(false);

  // Vault switching state
  const [vaults, setVaults] = useState<VaultOption[]>([]);
  const [activeVault, setActiveVault] = useState<string>('');
  const [activeVaultName, setActiveVaultName] = useState<string>('');
  const [customPath, setCustomPath] = useState<string>('');
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // File Browser Modal State (Plex-style)
  const [browserConfig, setBrowserConfig] = useState<{
    isOpen: boolean;
    title: string;
    filter: 'all' | 'notes' | 'images' | 'folders';
    initialPath?: string;
    useRelativePath?: boolean;
    onSelect: (selectedPath: string) => void;
  }>({
    isOpen: false,
    title: 'Browse Files',
    filter: 'all',
    onSelect: () => {},
  });

  useEffect(() => {
    if (isOpen) {
      setLocalTitle(wikiTitle);
      setLocalHomeNote(homeNote);
      setLocalLightLogo(lightLogo);
      setLocalDarkLogo(darkLogo);
      setLocalFavicon(faviconUrl);
      setUseSameLogo(lightLogo === darkLogo && lightLogo !== '/parma_dark.png');
      setLocalCustomCss(customCss);
      setSavedSuccess(false);
      setCssSavedSuccess(false);
      loadVaults();
    }
  }, [isOpen, wikiTitle, homeNote, lightLogo, darkLogo, faviconUrl, customCss]);

  const loadVaults = async () => {
    try {
      setErrorMsg(null);
      const data = await fetchVaults();
      setVaults(data.vaults);
      setActiveVault(data.active);
      setActiveVaultName(data.activeName);
    } catch (err: any) {
      console.error('Failed to load vaults:', err);
    }
  };

  const handleSwitchVault = async (targetPath: string) => {
    if (!targetPath.trim() || isSwitching) return;
    setIsSwitching(true);
    setErrorMsg(null);

    try {
      const res = await switchVault(targetPath.trim());
      setActiveVault(res.active);
      await loadVaults();
      onVaultChanged();
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch vault');
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSaveGeneral = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalTitle = localTitle.trim() || 'Parma';
    const finalHome = localHomeNote.trim() || 'Home.md';
    const finalLightLogo = localLightLogo.trim() || '/parma_dark.png';
    const finalDarkLogo = useSameLogo ? finalLightLogo : (localDarkLogo.trim() || '/parma_light.png');
    const finalFavicon = localFavicon.trim() || '/favicon.png';

    onSaveWikiTitle(finalTitle);
    onSaveHomeNote(finalHome);
    onSaveLightLogo(finalLightLogo);
    onSaveDarkLogo(finalDarkLogo);
    onSaveFaviconUrl(finalFavicon);

    localStorage.setItem('parma-wiki-title', finalTitle);
    localStorage.setItem('parma-home-note', finalHome);
    localStorage.setItem('parma-light-logo', finalLightLogo);
    localStorage.setItem('parma-dark-logo', finalDarkLogo);
    localStorage.setItem('parma-favicon-url', finalFavicon);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 400);
  };

  const handleResetDefaults = () => {
    setLocalTitle('Parma');
    const detectedHome = allNotePaths.find(
      (p) => p.toLowerCase() === 'home.md' || p.toLowerCase() === 'index.md'
    ) || allNotePaths[0] || 'Home.md';
    setLocalHomeNote(detectedHome);
    setLocalLightLogo('/parma_dark.png');
    setLocalDarkLogo('/parma_light.png');
    setLocalFavicon('/favicon.png');
    setUseSameLogo(false);
  };

  const handleApplyCustomCss = () => {
    onSaveCustomCss(localCustomCss);
    setCssSavedSuccess(true);
    setTimeout(() => setCssSavedSuccess(false), 2000);
  };

  const handleResetCustomCss = () => {
    setLocalCustomCss('');
    onSaveCustomCss('');
    setCssSavedSuccess(true);
    setTimeout(() => setCssSavedSuccess(false), 2000);
  };

  if (!isOpen) return null;

  const isVaultActive = currentThemeId === 'vault';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden font-sans flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5 font-semibold text-base text-slate-900 dark:text-slate-100">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <span>Settings</span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activeTab === 'general'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              General & Brand
            </button>
            <button
              onClick={() => setActiveTab('themes')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'themes'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-blue-500" />
              <span>Appearance & Themes</span>
            </button>
            <button
              onClick={() => setActiveTab('vaults')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activeTab === 'vaults'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Vault Directory
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab 1: General & Brand Settings */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneral} className="p-6 space-y-6 overflow-y-auto flex-1">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  <span>Wiki Title</span>
                </label>
                <input
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  placeholder="e.g. Heinrich Wiki, Parma"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  The name displayed in the top sidebar header and browser tab.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>Designated Home Note Path</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={localHomeNote}
                    onChange={(e) => setLocalHomeNote(e.target.value)}
                    placeholder="Home.md or path/to/note.md"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBrowserConfig({
                        isOpen: true,
                        title: 'Browse for Home Note',
                        filter: 'notes',
                        initialPath: '',
                        useRelativePath: true,
                        onSelect: (selectedPath) => setLocalHomeNote(selectedPath),
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                    <span>Browse...</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  The document opened when clicking the logo or home icon in breadcrumbs.
                </p>
              </div>

              {/* Logo & Brand Icons Section */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                    <span>Logo & Brand Icons</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useSameLogo}
                      onChange={(e) => setUseSameLogo(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span>Use same logo for both modes</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Light Mode Logo
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center p-1 flex-shrink-0">
                        <img 
                          src={localLightLogo} 
                          alt="Light Logo" 
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                      <input
                        type="text"
                        value={localLightLogo}
                        onChange={(e) => setLocalLightLogo(e.target.value)}
                        placeholder="/parma_dark.png"
                        className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBrowserConfig({
                            isOpen: true,
                            title: 'Select Light Mode Logo',
                            filter: 'images',
                            initialPath: '',
                            useRelativePath: false,
                            onSelect: (p) => setLocalLightLogo(p.startsWith('/') ? p : '/' + p),
                          });
                        }}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Browse images"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                      </button>
                    </div>
                  </div>

                  {!useSameLogo && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Dark Mode Logo
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center p-1 flex-shrink-0">
                          <img 
                            src={localDarkLogo} 
                            alt="Dark Logo" 
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        </div>
                        <input
                          type="text"
                          value={localDarkLogo}
                          onChange={(e) => setLocalDarkLogo(e.target.value)}
                          placeholder="/parma_light.png"
                          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setBrowserConfig({
                              isOpen: true,
                              title: 'Select Dark Mode Logo',
                              filter: 'images',
                              initialPath: '',
                              useRelativePath: false,
                              onSelect: (p) => setLocalDarkLogo(p.startsWith('/') ? p : '/' + p),
                            });
                          }}
                          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Browse images"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Favicon Setting */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Browser Favicon URL</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center p-1 flex-shrink-0">
                      <img 
                        src={localFavicon} 
                        alt="Favicon" 
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                    <input
                      type="text"
                      value={localFavicon}
                      onChange={(e) => setLocalFavicon(e.target.value)}
                      placeholder="/favicon.png"
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBrowserConfig({
                          isOpen: true,
                          title: 'Select Favicon Image',
                          filter: 'images',
                          initialPath: '',
                          useRelativePath: false,
                          onSelect: (p) => setLocalFavicon(p.startsWith('/') ? p : '/' + p),
                        });
                      }}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Browse images"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    The icon displayed in browser tabs and bookmarks.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Appearance & Themes */}
        {activeTab === 'themes' && (
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* 1. Match Vault Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span>Obsidian Vault Synchronization</span>
                </label>
                {vaultThemeData?.hasObsidianConfig && (
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>.obsidian config active</span>
                  </span>
                )}
              </div>

              <div
                onClick={() => onThemeSelected('vault')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                  isVaultActive
                    ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/25 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg mt-0.5 ${isVaultActive ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      <Paintbrush className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Match Vault (.obsidian)
                        </span>
                        {isVaultActive && (
                          <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-0.5 bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.5 rounded">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Directly inherits installed themes, custom CSS snippets, and accent colors from your Obsidian vault.
                      </p>

                      {/* Vault Details Status */}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                        {vaultThemeData?.hasObsidianConfig ? (
                          <>
                            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                              Theme: <strong className="text-purple-600 dark:text-purple-400">{vaultThemeData.vaultThemeName || 'Obsidian Default'}</strong>
                            </span>
                            {vaultThemeData.accentColor && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/10"
                                  style={{ backgroundColor: vaultThemeData.accentColor }}
                                />
                                <span>{vaultThemeData.accentColor}</span>
                              </span>
                            )}
                            {vaultThemeData.enabledCssSnippets && vaultThemeData.enabledCssSnippets.length > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                                {vaultThemeData.enabledCssSnippets.length} {vaultThemeData.enabledCssSnippets.length === 1 ? 'snippet' : 'snippets'}
                              </span>
                            )}
                            {vaultThemeData.availableVaultThemes && vaultThemeData.availableVaultThemes.length > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]">
                                Installed: {vaultThemeData.availableVaultThemes.join(', ')}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 text-[11px] italic">
                            No .obsidian appearance configuration found in active vault. Using fallback styles.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Built-in Presets Grid */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-500" />
                  <span>Built-in Presets</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Select a curated palette
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {BUILT_IN_THEMES.map((preset) => {
                  const isSelected = currentThemeId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => onThemeSelected(preset.id)}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3.5 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/25 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40'
                      }`}
                    >
                      {/* Left Side: Theme info, repo badge, active state & palette swatches */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                              {preset.name}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">
                                <Check className="w-3 h-3" />
                                <span>Active</span>
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex items-center gap-1.5">
                            {preset.repoUrl ? (
                              <a
                                href={preset.repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-1.5 py-0.5 rounded transition-colors"
                              >
                                <svg className="w-2.5 h-2.5 fill-current flex-shrink-0" viewBox="0 0 24 24">
                                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                                </svg>
                                <span className="truncate">{preset.author}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-slate-800/60 px-1.5 py-0.5 rounded">
                                <span>{preset.author}</span>
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
                            {preset.description}
                          </p>
                        </div>

                        {/* Palette Preview Swatch */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shadow-2xs"
                              style={{ backgroundColor: preset.swatch.bg }}
                              title="Background"
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shadow-2xs"
                              style={{ backgroundColor: preset.swatch.surface }}
                              title="Surface"
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shadow-2xs"
                              style={{ backgroundColor: preset.swatch.accent }}
                              title="Accent"
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shadow-2xs"
                              style={{ backgroundColor: preset.swatch.text }}
                              title="Text"
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {preset.swatch.accent}
                          </span>
                        </div>
                      </div>

                      {/* Right side: Preview image thumbnail */}
                      {preset.previewImage && (
                        <img
                          src={preset.previewImage}
                          alt={`${preset.name} preview`}
                          className="w-28 sm:w-36 h-20 sm:h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Custom CSS / Snippet Code Editor */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-blue-500" />
                  <span>Custom CSS & Theme Snippets</span>
                </label>
                <div className="flex items-center gap-2">
                  {localCustomCss && (
                    <button
                      type="button"
                      onClick={handleResetCustomCss}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <textarea
                  value={localCustomCss}
                  onChange={(e) => setLocalCustomCss(e.target.value)}
                  placeholder={`/* Add custom CSS variables or overrides */\n:root {\n  --background-primary: #1e1e2e;\n  --interactive-accent: #cba6f7;\n}\n\n.callout[data-callout="lore"] {\n  --callout-color: #ec4899;\n}`}
                  rows={6}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 text-slate-100 border border-slate-800 text-xs font-mono leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-y"
                  spellCheck={false}
                />
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-500">
                    Supports all standard Obsidian variables: <code className="text-blue-500">--background-primary</code>, <code className="text-blue-500">--interactive-accent</code>, <code className="text-blue-500">--text-normal</code>.
                  </p>
                  <button
                    type="button"
                    onClick={handleApplyCustomCss}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    {cssSavedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Applied!</span>
                      </>
                    ) : (
                      <span>Apply Custom CSS</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Vault Directory Management */}
        {activeTab === 'vaults' && (
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Active Vault Banner */}
            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/60 flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  Active Vault
                </span>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-2">
                  {activeVaultName || 'Current Vault'}
                </h4>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 break-all mt-0.5">
                  {activeVault}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                <Database className="w-5 h-5" />
              </div>
            </div>

            {/* Presets List */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Available Preset Vaults
              </label>

              {vaults.map((v) => {
                const isActive = activeVault === v.path;
                return (
                  <div
                    key={v.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      isActive
                        ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`p-2 rounded-lg mt-0.5 ${isActive ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        <Folder className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                            {v.name}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                              <Check className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {v.description}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400 truncate block mt-1">
                          {v.path}
                        </span>
                      </div>
                    </div>

                    {!isActive && (
                      <button
                        onClick={() => handleSwitchVault(v.path)}
                        disabled={isSwitching}
                        className="ml-3 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer flex-shrink-0"
                      >
                        {isSwitching ? 'Switching...' : 'Switch'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom Path Adder (Plex Style) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mount Other Filesystem Path
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  placeholder="/vault or /path/to/custom/vault"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    setBrowserConfig({
                      isOpen: true,
                      title: 'Browse for Vault Folder',
                      filter: 'folders',
                      initialPath: customPath || activeVault,
                      useRelativePath: false,
                      onSelect: (selectedFolder) => setCustomPath(selectedFolder),
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                  <span>Browse...</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchVault(customPath)}
                  disabled={!customPath.trim() || isSwitching}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Mount
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plex Style File Browser Modal */}
      {browserConfig.isOpen && (
        <FileBrowserModal
          isOpen={browserConfig.isOpen}
          title={browserConfig.title}
          filter={browserConfig.filter}
          initialPath={browserConfig.initialPath}
          useRelativePath={browserConfig.useRelativePath}
          onClose={() => setBrowserConfig((prev) => ({ ...prev, isOpen: false }))}
          onSelect={(path) => {
            browserConfig.onSelect(path);
          }}
        />
      )}
    </div>
  );
};
