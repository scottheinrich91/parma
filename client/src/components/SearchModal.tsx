import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, CornerDownRight, Loader2 } from 'lucide-react';
import { searchNotes } from '../api';
import { SearchResult } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (path: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectNote,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchNotes(query);
        setResults(res);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        onSelectNote(results[selectedIndex].path);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden font-sans flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-3">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search notes, headings, content, recipes..."
            className="w-full text-base bg-transparent border-none outline-hidden text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400 flex-shrink-0" />
          )}
          {query && !loading && (
            <button
              onClick={() => setQuery('')}
              className="px-1.5 py-0.5 rounded text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
              title="Clear input"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-400 rounded border border-slate-200 dark:border-slate-700">ESC</kbd>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 cursor-pointer"
            title="Close search"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Type keywords to search across titles, headings, and note contents.
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No matching notes found for <span className="font-semibold text-slate-600 dark:text-slate-300">"{query}"</span>
            </div>
          ) : (
            results.map((res, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={res.path}
                  onClick={() => {
                    onSelectNote(res.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="truncate">{res.title}</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                      {res.folder}
                    </span>
                  </div>

                  {res.snippet && (
                    <div className="mt-1 flex items-start gap-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 pl-6">
                      <CornerDownRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400" />
                      <span>{res.snippet}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">↑</kbd> <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">↓</kbd></span>
          <span>Open with <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">ENTER</kbd></span>
        </div>
      </div>
    </div>
  );
};
