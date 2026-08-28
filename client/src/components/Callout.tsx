import React, { useState, useEffect } from 'react';
import { 
  Info, 
  Lightbulb, 
  AlertTriangle, 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle, 
  Flame, 
  CheckSquare, 
  Bug, 
  Bookmark, 
  Quote, 
  FileText, 
  Zap, 
  XCircle, 
  ChevronDown, 
  ChevronRight 
} from 'lucide-react';
import {
  getParsedCustomCallouts,
  getCalloutIcon,
  CUSTOM_CALLOUTS_EVENT,
  CustomCalloutDef,
} from '../customCallouts';

export interface CalloutProps {
  type: string;
  title?: string;
  isFoldable?: boolean;
  defaultFolded?: boolean;
  children?: React.ReactNode;
}

export const CALLOUT_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  border: string;
  bg: string;
  titleColor: string;
  defaultTitle: string;
}> = {
  note: {
    icon: Info,
    border: 'border-l-blue-500',
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    titleColor: 'text-blue-600 dark:text-blue-400',
    defaultTitle: 'Note',
  },
  abstract: {
    icon: FileText,
    border: 'border-l-cyan-500',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    titleColor: 'text-cyan-600 dark:text-cyan-400',
    defaultTitle: 'Abstract',
  },
  summary: {
    icon: FileText,
    border: 'border-l-cyan-500',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    titleColor: 'text-cyan-600 dark:text-cyan-400',
    defaultTitle: 'Summary',
  },
  tldr: {
    icon: Zap,
    border: 'border-l-cyan-500',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    titleColor: 'text-cyan-600 dark:text-cyan-400',
    defaultTitle: 'TL;DR',
  },
  info: {
    icon: Info,
    border: 'border-l-sky-500',
    bg: 'bg-sky-500/10 dark:bg-sky-500/15',
    titleColor: 'text-sky-600 dark:text-sky-400',
    defaultTitle: 'Info',
  },
  todo: {
    icon: CheckSquare,
    border: 'border-l-indigo-500',
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    titleColor: 'text-indigo-600 dark:text-indigo-400',
    defaultTitle: 'Todo',
  },
  tip: {
    icon: Lightbulb,
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    titleColor: 'text-emerald-600 dark:text-emerald-400',
    defaultTitle: 'Tip',
  },
  hint: {
    icon: Lightbulb,
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    titleColor: 'text-emerald-600 dark:text-emerald-400',
    defaultTitle: 'Hint',
  },
  important: {
    icon: AlertCircle,
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    titleColor: 'text-emerald-600 dark:text-emerald-400',
    defaultTitle: 'Important',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-l-orange-500',
    bg: 'bg-orange-500/10 dark:bg-orange-500/15',
    titleColor: 'text-orange-600 dark:text-orange-400',
    defaultTitle: 'Warning',
  },
  caution: {
    icon: ShieldAlert,
    border: 'border-l-orange-500',
    bg: 'bg-orange-500/10 dark:bg-orange-500/15',
    titleColor: 'text-orange-600 dark:text-orange-400',
    defaultTitle: 'Caution',
  },
  attention: {
    icon: AlertTriangle,
    border: 'border-l-orange-500',
    bg: 'bg-orange-500/10 dark:bg-orange-500/15',
    titleColor: 'text-orange-600 dark:text-orange-400',
    defaultTitle: 'Attention',
  },
  danger: {
    icon: Flame,
    border: 'border-l-rose-600',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    titleColor: 'text-rose-600 dark:text-rose-400',
    defaultTitle: 'Danger',
  },
  error: {
    icon: XCircle,
    border: 'border-l-rose-600',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    titleColor: 'text-rose-600 dark:text-rose-400',
    defaultTitle: 'Error',
  },
  bug: {
    icon: Bug,
    border: 'border-l-pink-500',
    bg: 'bg-pink-500/10 dark:bg-pink-500/15',
    titleColor: 'text-pink-600 dark:text-pink-400',
    defaultTitle: 'Bug',
  },
  failure: {
    icon: XCircle,
    border: 'border-l-red-500',
    bg: 'bg-red-500/10 dark:bg-red-500/15',
    titleColor: 'text-red-600 dark:text-red-400',
    defaultTitle: 'Failure',
  },
  fail: {
    icon: XCircle,
    border: 'border-l-red-500',
    bg: 'bg-red-500/10 dark:bg-red-500/15',
    titleColor: 'text-red-600 dark:text-red-400',
    defaultTitle: 'Fail',
  },
  missing: {
    icon: AlertCircle,
    border: 'border-l-red-500',
    bg: 'bg-red-500/10 dark:bg-red-500/15',
    titleColor: 'text-red-600 dark:text-red-400',
    defaultTitle: 'Missing',
  },
  success: {
    icon: CheckCircle2,
    border: 'border-l-green-500',
    bg: 'bg-green-500/10 dark:bg-green-500/15',
    titleColor: 'text-green-600 dark:text-green-400',
    defaultTitle: 'Success',
  },
  check: {
    icon: CheckCircle2,
    border: 'border-l-green-500',
    bg: 'bg-green-500/10 dark:bg-green-500/15',
    titleColor: 'text-green-600 dark:text-green-400',
    defaultTitle: 'Check',
  },
  done: {
    icon: CheckCircle2,
    border: 'border-l-green-500',
    bg: 'bg-green-500/10 dark:bg-green-500/15',
    titleColor: 'text-green-600 dark:text-green-400',
    defaultTitle: 'Done',
  },
  question: {
    icon: HelpCircle,
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    titleColor: 'text-amber-600 dark:text-amber-400',
    defaultTitle: 'Question',
  },
  help: {
    icon: HelpCircle,
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    titleColor: 'text-amber-600 dark:text-amber-400',
    defaultTitle: 'Help',
  },
  faq: {
    icon: HelpCircle,
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    titleColor: 'text-amber-600 dark:text-amber-400',
    defaultTitle: 'FAQ',
  },
  quote: {
    icon: Quote,
    border: 'border-l-slate-400',
    bg: 'bg-slate-500/10 dark:bg-slate-500/15',
    titleColor: 'text-slate-600 dark:text-slate-400',
    defaultTitle: 'Quote',
  },
  cite: {
    icon: Quote,
    border: 'border-l-slate-400',
    bg: 'bg-slate-500/10 dark:bg-slate-500/15',
    titleColor: 'text-slate-600 dark:text-slate-400',
    defaultTitle: 'Cite',
  },
  example: {
    icon: Bookmark,
    border: 'border-l-purple-500',
    bg: 'bg-purple-500/10 dark:bg-purple-500/15',
    titleColor: 'text-purple-600 dark:text-purple-400',
    defaultTitle: 'Example',
  },
};

export const Callout: React.FC<CalloutProps> = ({
  type,
  title,
  isFoldable = false,
  defaultFolded = false,
  children,
}) => {
  const [isFolded, setIsFolded] = useState(defaultFolded);
  const [customDefs, setCustomDefs] = useState<CustomCalloutDef[]>(() => {
    return typeof window !== 'undefined' ? getParsedCustomCallouts() : [];
  });

  useEffect(() => {
    const handleUpdate = () => {
      setCustomDefs(getParsedCustomCallouts());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(CUSTOM_CALLOUTS_EVENT, handleUpdate);
      return () => window.removeEventListener(CUSTOM_CALLOUTS_EVENT, handleUpdate);
    }
  }, []);

  const normalizedType = (type || 'note').toLowerCase();
  const standardConfig = CALLOUT_CONFIG[normalizedType];
  const customDef = customDefs.find((c) => c.id === normalizedType);

  let IconComponent: React.ComponentType<{ className?: string }> = Info;
  let defaultTitle = normalizedType
    .split(/[-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  let customStyle: React.CSSProperties | undefined = undefined;

  if (standardConfig) {
    IconComponent = standardConfig.icon;
    defaultTitle = standardConfig.defaultTitle;
  } else if (customDef) {
    IconComponent = getCalloutIcon(customDef.iconName);
    defaultTitle = customDef.name;
    customStyle = {
      ['--callout-color' as any]: customDef.color,
    };
  } else {
    IconComponent = AlertCircle;
  }

  const displayTitle = title || defaultTitle;
  const hasChildren = Boolean(children) && (typeof children !== 'string' || children.trim() !== '');

  return (
    <div
      className="my-4 rounded-lg border-l-4 p-4 text-sm font-sans shadow-sm transition-all callout"
      data-callout={normalizedType}
      data-callout-type={normalizedType}
      data-callout-fold={isFoldable ? (defaultFolded ? '-' : '+') : undefined}
      data-callout-title={title || undefined}
      style={customStyle}
    >
      <div 
        className={`callout-header flex items-center gap-2 font-semibold ${isFoldable ? 'cursor-pointer select-none' : ''}`}
        onClick={() => isFoldable && setIsFolded(!isFolded)}
      >
        {isFoldable && (
          <span className="text-slate-500">
            {isFolded ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        )}
        <span className="callout-icon flex-shrink-0">
          <IconComponent className="w-4 h-4 flex-shrink-0" />
        </span>
        <span className="callout-title text-sm font-medium tracking-wide uppercase">{displayTitle}</span>
      </div>
      {!isFolded && hasChildren && (
        <div className="callout-content mt-2 text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
          {children}
        </div>
      )}
    </div>
  );
};
