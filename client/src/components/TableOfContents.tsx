import React, { useMemo } from 'react';
import { ListTree } from 'lucide-react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  onNavigateHeading?: (id: string) => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ content, onNavigateHeading }) => {
  const headings = useMemo(() => {
    const items: TOCItem[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const rawText = match[2].trim();
        // Strip markdown formatting from heading text
        const cleanText = rawText.replace(/[*_`[\]]/g, '');
        const id = cleanText
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        
        items.push({ id, text: cleanText, level });
      }
    }
    return items;
  }, [content]);

  if (headings.length <= 1) {
    return null;
  }

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (onNavigateHeading) {
      onNavigateHeading(id);
    } else {
      const elem = document.getElementById(id);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="bg-slate-50/80 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 text-xs font-sans">
      <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-200 pb-2 mb-2 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
        <ListTree className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span>Contents</span>
      </div>
      <nav className="space-y-1 max-h-[300px] overflow-y-auto">
        {headings.map((h, i) => (
          <a
            key={i}
            href={`#${h.id}`}
            onClick={(e) => handleClick(e, h.id)}
            style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
            className="block py-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate transition-colors leading-tight"
            title={h.text}
          >
            {h.text}
          </a>
        ))}
      </nav>
    </div>
  );
};
