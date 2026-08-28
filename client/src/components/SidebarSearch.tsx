import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  FileText,
  SlidersHorizontal,
  ChevronsUpDown,
  ChevronsDownUp,
  AlignLeft,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Loader2,
  Filter,
  Check,
} from 'lucide-react';
import { searchNotes } from '../api';
import { SearchResult } from '../types';

interface SidebarSearchProps {
  onOpenNote: (path: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
}

const SEARCH_OPTIONS = [
  { prefix: 'path:', label: 'path:', desc: 'match path of the file', example: 'path:recipes' },
  { prefix: 'file:', label: 'file:', desc: 'match file name', example: 'file:Pasta' },
  { prefix: 'tag:', label: 'tag:', desc: 'search for tags', example: 'tag:dinner' },
  { prefix: 'line:', label: 'line:', desc: 'search keywords on same line', example: 'line:(garlic olive)' },
  { prefix: 'section:', label: 'section:', desc: 'search keywords under same heading', example: 'section:Ingredients' },
  { prefix: '[property]', label: '[property]', desc: 'match property', example: '[tags:pasta]' },
];

export const SidebarSearch: React.FC<SidebarSearchProps> = ({
  onOpenNote,
  searchQuery,
  onSearchQueryChange,
}) => {
  const [query, setQuery] = useState(searchQuery || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery || '');
  const [matchCase, setMatchCase] = useState(false);
  const [collapseResults, setCollapseResults] = useState(false);
  const [showMoreContext, setShowMoreContext] = useState(false);
  const [explainTerms, setExplainTerms] = useState(false);
  const [showSearchOptions, setShowSearchOptions] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== query) {
      setQuery(searchQuery);
      setDebouncedQuery(searchQuery);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [searchQuery]);

  // Debounce query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  // Execute search when debounced query or matchCase changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    let isCurrent = true;
    setLoading(true);

    searchNotes(debouncedQuery, matchCase)
      .then((res) => {
        if (isCurrent) {
          setResults(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          console.error('Sidebar search error:', err);
          setResults([]);
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [debouncedQuery, matchCase]);

  // Close options menu when clicking outside
  useEffect(() => {
    if (!showSearchOptions) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setShowSearchOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchOptions]);

  // Total matching line counts across files
  const totalMatchesCount = useMemo(() => {
    return results.reduce((acc, r) => acc + (r.matches?.length || 1), 0);
  }, [results]);

  // Insert syntax into search bar
  const handleInsertSyntax = (syntax: string) => {
    let insertText = syntax;
    if (syntax === '[property]') {
      insertText = '[key:value]';
    }
    setQuery((prev) => (prev ? `${prev.trim()} ${insertText}` : insertText));
    setShowSearchOptions(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Toggle individual file collapse
  const toggleFileCollapse = (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  };

  // Term explanation breakdown
  const parsedExplanation = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const tokens = debouncedQuery.trim().split(/\s+/).filter(Boolean);
    return tokens.map((token) => {
      if (token.toLowerCase().startsWith('path:')) {
        return { token, desc: `Filter path containing: "${token.slice(5)}"` };
      }
      if (token.toLowerCase().startsWith('file:')) {
        return { token, desc: `Filter file name containing: "${token.slice(5)}"` };
      }
      if (token.toLowerCase().startsWith('tag:')) {
        return { token, desc: `Search tag: "${token.slice(4)}"` };
      }
      if (token.toLowerCase().startsWith('line:')) {
        return { token, desc: `Same line match: "${token.slice(5)}"` };
      }
      if (token.toLowerCase().startsWith('section:')) {
        return { token, desc: `Heading section: "${token.slice(8)}"` };
      }
      if (token.startsWith('[') && token.endsWith(']')) {
        return { token, desc: `Frontmatter property: "${token.slice(1, -1)}"` };
      }
      return { token, desc: `Keyword: "${token}" (${matchCase ? 'exact case' : 'case-insensitive'})` };
    });
  }, [debouncedQuery, matchCase]);

  // Highlight helper for snippet keywords
  const highlightSnippet = (text: string) => {
    if (!debouncedQuery.trim()) return text;
    // Extract keywords without operator prefixes
    const rawTokens = debouncedQuery.split(/\s+/).filter(Boolean);
    const keywords = rawTokens
      .map((t) => t.replace(/^(?:path|file|tag|line|section):|[\[\]\(\)"]/g, ''))
      .filter((k) => k.length > 0);

    if (keywords.length === 0) return text;

    try {
      const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      const regex = new RegExp(`(${escaped})`, matchCase ? 'g' : 'gi');
      const parts = text.split(regex);

      return parts.map((part, i) => {
        if (keywords.some((k) => (matchCase ? k === part : k.toLowerCase() === part.toLowerCase()))) {
          return (
            <mark
              key={i}
              className="bg-amber-200/90 dark:bg-amber-900/60 text-slate-900 dark:text-slate-100 rounded-xs px-0.5 font-semibold"
            >
              {part}
            </mark>
          );
        }
        return part;
      });
    } catch {
      return text;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      {/* Search Input Bar with 'Aa' Match Case & Options Filter Toggle */}
      <div className="p-2 border-b border-slate-200/80 dark:border-slate-800/80 flex-shrink-0 space-y-2">
        <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
          <Search className="w-3.5 h-3.5 text-slate-400 ml-2.5 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full py-1.5 px-2 text-xs bg-transparent border-none outline-hidden text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />

          {loading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 mr-1.5 flex-shrink-0" />
          )}

          {query && !loading && (
            <button
              onClick={() => {
                setQuery('');
                setDebouncedQuery('');
                setResults([]);
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-1 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* 'Aa' Match Case Toggle */}
          <button
            type="button"
            onClick={() => setMatchCase((prev) => !prev)}
            title="Match case"
            className={`px-1.5 py-0.5 mr-1 text-[11px] font-bold rounded cursor-pointer transition-colors ${
              matchCase
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Aa
          </button>

          {/* 'Show search options' Filter Button */}
          <div className="relative" ref={optionsMenuRef}>
            <button
              type="button"
              onClick={() => setShowSearchOptions((prev) => !prev)}
              title="Show search options"
              className={`p-1 mr-1 rounded cursor-pointer transition-colors ${
                showSearchOptions
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {showSearchOptions && (
              <div className="absolute right-0 origin-top-right top-full mt-1.5 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 px-1 z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
                <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700/50">
                  Search Operators
                </div>
                <div className="mt-1 space-y-0.5">
                  {SEARCH_OPTIONS.map((opt) => (
                    <button
                      key={opt.prefix}
                      onClick={() => handleInsertSyntax(opt.prefix)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 text-xs">
                          {opt.label}
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300">
                          {opt.desc}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono pl-0.5 mt-0.5">
                        e.g. {opt.example}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Toggles Toolbar: 'Collapse results', 'Show more context', 'Explain search terms' */}
        <div className="flex items-center justify-between px-1 text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-medium text-slate-400">
            {debouncedQuery.trim() ? (
              `${results.length} files (${totalMatchesCount} matches)`
            ) : (
              'Search vault'
            )}
          </span>

          <div className="flex items-center gap-1">
            {/* Collapse Results Toggle */}
            <button
              onClick={() => setCollapseResults((prev) => !prev)}
              title={collapseResults ? 'Expand results' : 'Collapse results'}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                collapseResults
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                  : 'hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {collapseResults ? (
                <ChevronsUpDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronsDownUp className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Show More Context Toggle */}
            <button
              onClick={() => setShowMoreContext((prev) => !prev)}
              title={showMoreContext ? 'Show less context' : 'Show more context'}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                showMoreContext
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                  : 'hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>

            {/* Explain Search Terms Toggle */}
            <button
              onClick={() => setExplainTerms((prev) => !prev)}
              title="Explain search terms"
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                explainTerms
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                  : 'hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Explain Search Terms Card */}
        {explainTerms && debouncedQuery.trim() && (
          <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg space-y-1 animate-in fade-in duration-150">
            <div className="font-semibold text-blue-900 dark:text-blue-200 text-[11px] mb-1">
              Search Terms Explanation
            </div>
            {parsedExplanation.map((p, idx) => (
              <div key={idx} className="flex items-baseline gap-1 text-[11px] text-slate-700 dark:text-slate-300">
                <span className="font-mono font-semibold text-blue-700 dark:text-blue-300">{p.token}:</span>
                <span>{p.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {!debouncedQuery.trim() ? (
          <div className="p-6 text-center text-slate-400 space-y-2">
            <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
            <p className="text-xs">Type a query above to search note titles, headings, and contents.</p>
            <div className="text-[11px] text-slate-400 pt-2 space-y-1">
              <div>Try <code className="bg-slate-200/60 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">tag:dinner</code></div>
              <div>Try <code className="bg-slate-200/60 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">path:recipes</code></div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center p-8 text-slate-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Searching vault...</span>
          </div>
        ) : results.length === 0 ? (
          <div className="p-6 text-center text-slate-400 space-y-1">
            <p className="font-medium text-slate-600 dark:text-slate-300">No matches found.</p>
            <p className="text-[11px]">No notes in vault matched your search criteria.</p>
          </div>
        ) : (
          results.map((res) => {
            const isFileCollapsed = collapseResults || collapsedFiles.has(res.path);
            const matchesCount = res.matches?.length || 1;

            return (
              <div
                key={res.path}
                className="bg-white/80 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-2xs transition-all hover:border-blue-300 dark:hover:border-blue-700/60"
              >
                {/* Document Header */}
                <div
                  onClick={() => onOpenNote(res.path)}
                  className="flex items-center justify-between p-2 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      onClick={(e) => toggleFileCollapse(res.path, e)}
                      className="p-0.5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                    >
                      {isFileCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </span>
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {res.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {res.path}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex-shrink-0 ml-1">
                    {matchesCount}
                  </span>
                </div>

                {/* Match Snippets */}
                {!isFileCollapsed && res.matches && res.matches.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 p-1.5 space-y-1 font-mono text-[11px]">
                    {res.matches.map((m, idx) => (
                      <div
                        key={idx}
                        onClick={() => onOpenNote(res.path)}
                        className="flex items-start gap-2 p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-800/80 cursor-pointer text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <span className="text-[10px] text-slate-400 font-semibold select-none flex-shrink-0 pt-0.5">
                          L{m.line}
                        </span>
                        <div
                          className={`font-sans leading-relaxed text-slate-700 dark:text-slate-300 min-w-0 ${
                            showMoreContext ? 'whitespace-pre-wrap' : 'line-clamp-2'
                          }`}
                        >
                          {highlightSnippet(m.text)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
