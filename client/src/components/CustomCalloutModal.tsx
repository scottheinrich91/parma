import React, { useState, useEffect } from 'react';
import { X, Sparkles, Code2, RotateCcw, Check, Palette } from 'lucide-react';
import {
  DEFAULT_CUSTOM_CALLOUT_CSS,
  getCustomCalloutsCSS,
  saveCustomCalloutsCSS,
  parseCustomCallouts,
  getCalloutIcon,
  CustomCalloutDef,
} from '../customCallouts';

interface CustomCalloutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const CustomCalloutModal: React.FC<CustomCalloutModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [cssCode, setCssCode] = useState<string>(DEFAULT_CUSTOM_CALLOUT_CSS);
  const [previewList, setPreviewList] = useState<CustomCalloutDef[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getCustomCalloutsCSS();
      setCssCode(current || DEFAULT_CUSTOM_CALLOUT_CSS);
      setPreviewList(parseCustomCallouts(current || DEFAULT_CUSTOM_CALLOUT_CSS));
      setIsSaved(false);
    }
  }, [isOpen]);

  const handleCodeChange = (newCode: string) => {
    setCssCode(newCode);
    setPreviewList(parseCustomCallouts(newCode));
  };

  const handleReset = () => {
    setCssCode(DEFAULT_CUSTOM_CALLOUT_CSS);
    setPreviewList(parseCustomCallouts(DEFAULT_CUSTOM_CALLOUT_CSS));
  };

  const handleSave = () => {
    saveCustomCalloutsCSS(cssCode);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onSaved?.();
      onClose();
    }, 600);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Custom Obsidian Callouts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define custom callout styling with CSS variables. Saved to local storage.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Syntax Hint */}
          <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-sans leading-relaxed">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Obsidian CSS Syntax: </span>
            Use <code className="text-purple-600 dark:text-purple-400 font-mono bg-purple-50 dark:bg-purple-950/50 px-1 py-0.5 rounded border border-purple-200/50 dark:border-purple-800/50">--callout-color</code> and <code className="text-purple-600 dark:text-purple-400 font-mono bg-purple-50 dark:bg-purple-950/50 px-1 py-0.5 rounded border border-purple-200/50 dark:border-purple-800/50">--callout-icon: lucide-[icon-name]</code> (e.g. <code className="font-mono text-slate-700 dark:text-slate-300">lucide-alert-circle</code>, <code className="font-mono text-slate-700 dark:text-slate-300">lucide-flame</code>, <code className="font-mono text-slate-700 dark:text-slate-300">lucide-zap</code>).
          </div>

          {/* CSS Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5" />
                CSS Stylesheet
              </span>
              <span>parma_custom_callouts</span>
            </div>
            <div className="relative rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 overflow-hidden shadow-inner">
              <textarea
                value={cssCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                rows={8}
                placeholder={DEFAULT_CUSTOM_CALLOUT_CSS}
                className="w-full p-4 font-mono text-xs sm:text-sm text-slate-100 bg-transparent outline-hidden resize-y leading-relaxed"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Live Preview of Defined Custom Callouts */}
          {previewList.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Detected Custom Callouts ({previewList.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {previewList.map((item) => {
                  const IconComp = getCalloutIcon(item.iconName);
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border-l-4 border bg-slate-50/70 dark:bg-slate-950/40 text-xs flex items-center justify-between gap-2 shadow-2xs"
                      style={{
                        borderLeftColor: item.color,
                        borderColor: 'rgba(128, 128, 128, 0.15)',
                        borderLeftWidth: '4px',
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="p-1.5 rounded-lg flex-shrink-0"
                          style={{
                            backgroundColor: `${item.color}15`,
                            color: item.color,
                          }}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate uppercase tracking-wider text-[11px]">
                            {item.name}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400 truncate">
                            &gt; [!{item.id.toUpperCase()}]
                          </p>
                        </div>
                      </div>
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10 flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                        title={item.color}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-all"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Callouts</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
