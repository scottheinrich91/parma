import React, { useState } from 'react';
import { 
  Info, 
  Lightbulb, 
  AlertTriangle, 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle, 
  Flame,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface CalloutProps {
  type: string;
  title?: string;
  isFoldable?: boolean;
  defaultFolded?: boolean;
  children: React.ReactNode;
}

const CALLOUT_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  border: string;
  bg: string;
  titleColor: string;
  defaultTitle: string;
}> = {
  note: {
    icon: Info,
    border: 'border-blue-500/60 dark:border-blue-500/40',
    bg: 'bg-blue-50/60 dark:bg-blue-950/25',
    titleColor: 'text-blue-900 dark:text-blue-200',
    defaultTitle: 'Note',
  },
  tip: {
    icon: Lightbulb,
    border: 'border-emerald-500/60 dark:border-emerald-500/40',
    bg: 'bg-emerald-50/60 dark:bg-emerald-950/25',
    titleColor: 'text-emerald-900 dark:text-emerald-200',
    defaultTitle: 'Tip',
  },
  important: {
    icon: AlertCircle,
    border: 'border-purple-500/60 dark:border-purple-500/40',
    bg: 'bg-purple-50/60 dark:bg-purple-950/25',
    titleColor: 'text-purple-900 dark:text-purple-200',
    defaultTitle: 'Important',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-amber-500/60 dark:border-amber-500/40',
    bg: 'bg-amber-50/60 dark:bg-amber-950/25',
    titleColor: 'text-amber-900 dark:text-amber-200',
    defaultTitle: 'Warning',
  },
  caution: {
    icon: ShieldAlert,
    border: 'border-rose-500/60 dark:border-rose-500/40',
    bg: 'bg-rose-50/60 dark:bg-rose-950/25',
    titleColor: 'text-rose-900 dark:text-rose-200',
    defaultTitle: 'Caution',
  },
  danger: {
    icon: Flame,
    border: 'border-red-600/60 dark:border-red-600/40',
    bg: 'bg-red-50/60 dark:bg-red-950/25',
    titleColor: 'text-red-900 dark:text-red-200',
    defaultTitle: 'Danger',
  },
  success: {
    icon: CheckCircle2,
    border: 'border-green-500/60 dark:border-green-500/40',
    bg: 'bg-green-50/60 dark:bg-green-950/25',
    titleColor: 'text-green-900 dark:text-green-200',
    defaultTitle: 'Success',
  },
  info: {
    icon: HelpCircle,
    border: 'border-cyan-500/60 dark:border-cyan-500/40',
    bg: 'bg-cyan-50/60 dark:bg-cyan-950/25',
    titleColor: 'text-cyan-900 dark:text-cyan-200',
    defaultTitle: 'Info',
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
  const normalizedType = type.toLowerCase();
  const config = CALLOUT_CONFIG[normalizedType] || CALLOUT_CONFIG.note;
  const IconComponent = config.icon;
  const displayTitle = title || config.defaultTitle;

  return (
    <div className={`my-4 rounded-lg border-l-4 ${config.border} ${config.bg} p-4 text-sm font-sans shadow-sm transition-all`}>
      <div 
        className={`flex items-center gap-2 font-semibold ${config.titleColor} ${isFoldable ? 'cursor-pointer select-none' : ''}`}
        onClick={() => isFoldable && setIsFolded(!isFolded)}
      >
        {isFoldable && (
          <span className="text-slate-500">
            {isFolded ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        )}
        <IconComponent className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium tracking-wide uppercase">{displayTitle}</span>
      </div>
      {!isFolded && (
        <div className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
          {children}
        </div>
      )}
    </div>
  );
};
