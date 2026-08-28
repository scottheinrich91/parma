import React, { useState, useEffect } from 'react';
import { X, Globe, FileText, Check, Settings as SettingsIcon, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wikiTitle: string;
  onSaveWikiTitle: (title: string) => void;
  homeNote: string;
  onSaveHomeNote: (homeNote: string) => void;
  allNotePaths: string[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  wikiTitle,
  onSaveWikiTitle,
  homeNote,
  onSaveHomeNote,
  allNotePaths,
}) => {
  const [localTitle, setLocalTitle] = useState(wikiTitle);
  const [localHomeNote, setLocalHomeNote] = useState(homeNote);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalTitle(wikiTitle);
      setLocalHomeNote(homeNote);
      setSavedSuccess(false);
    }
  }, [isOpen, wikiTitle, homeNote]);

  if (!isOpen) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalTitle = localTitle.trim() || 'Parma';
    const finalHome = localHomeNote.trim() || 'Home.md';

    onSaveWikiTitle(finalTitle);
    onSaveHomeNote(finalHome);
    localStorage.setItem('parma-wiki-title', finalTitle);
    localStorage.setItem('parma-home-note', finalHome);

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
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden font-sans flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 font-semibold text-base text-slate-900 dark:text-slate-100">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <span>Settings</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Settings Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Wiki Identity & Home Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Wiki Identity & Home</span>
              </div>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title="Reset to defaults"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            </div>

            {/* Wiki Title Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Wiki Title
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                The name of your knowledge base shown in the sidebar header and browser title.
              </p>
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="Parma"
                className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Designated Home Note Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Designated Home Note
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                The primary document loaded when clicking the logo or starting a session.
              </p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <FileText className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  list="available-home-notes"
                  value={localHomeNote}
                  onChange={(e) => setLocalHomeNote(e.target.value)}
                  placeholder="Home.md"
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
                <datalist id="available-home-notes">
                  {allNotePaths.map((path) => (
                    <option key={path} value={path} />
                  ))}
                </datalist>
              </div>
              {allNotePaths.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-medium">Quick suggestions:</span>
                  {allNotePaths.slice(0, 4).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setLocalHomeNote(p)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-colors ${
                        localHomeNote === p
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
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
        </form>
      </div>
    </div>
  );
};
