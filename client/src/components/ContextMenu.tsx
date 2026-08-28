import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

export interface ContextMenuItem {
  id?: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  shortcut?: string;
  divider?: boolean;
  children?: ContextMenuItem[];
}

export interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenuIndex, setActiveSubmenuIndex] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x, y });

  // Handle positioning & edge collisions
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const padding = 12;
    let nextX = x;
    let nextY = y;

    if (x + rect.width > window.innerWidth - padding) {
      nextX = Math.max(padding, window.innerWidth - rect.width - padding);
    }
    if (y + rect.height > window.innerHeight - padding) {
      nextY = Math.max(padding, window.innerHeight - rect.height - padding);
    }

    setCoords({ x: nextX, y: nextY });
  }, [x, y, items]);

  // Click outside, ESC key, scroll, resize handlers to close menu
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleScrollOrResize = () => {
      onClose();
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{
        top: `${coords.y}px`,
        left: `${coords.x}px`,
      }}
      className="fixed z-[100] min-w-[200px] max-w-[280px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200/90 dark:border-slate-700/90 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-sans select-none animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return (
            <div
              key={`divider-${index}`}
              className="my-1 border-t border-slate-200/70 dark:border-slate-700/70"
            />
          );
        }

        const hasSubmenu = Boolean(item.children && item.children.length > 0);
        const isSubmenuOpen = activeSubmenuIndex === index;

        return (
          <div
            key={item.id || item.label || index}
            className="relative"
            onMouseEnter={() => {
              if (hasSubmenu) {
                setActiveSubmenuIndex(index);
              } else {
                setActiveSubmenuIndex(null);
              }
            }}
          >
            <button
              type="button"
              disabled={item.disabled}
              onClick={(e) => {
                e.stopPropagation();
                if (item.disabled) return;
                if (!hasSubmenu && item.onClick) {
                  item.onClick();
                  onClose();
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors cursor-pointer ${
                item.disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : item.danger
                  ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  : 'hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {item.icon && (
                  <span
                    className={`w-4 h-4 flex-shrink-0 flex items-center justify-center ${
                      item.danger
                        ? 'text-rose-500'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.icon}
                  </span>
                )}
                <span className="truncate">{item.label}</span>
              </div>

              {hasSubmenu ? (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 ml-2 flex-shrink-0" />
              ) : item.shortcut ? (
                <span className="text-[10px] text-slate-400 font-mono ml-3 flex-shrink-0">
                  {item.shortcut}
                </span>
              ) : null}
            </button>

            {/* Submenu */}
            {hasSubmenu && isSubmenuOpen && item.children && (
              <Submenu items={item.children} onClose={onClose} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const Submenu: React.FC<{ items: ContextMenuItem[]; onClose: () => void }> = ({
  items,
  onClose,
}) => {
  const submenuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    left: '100%',
    top: '-4px',
  });

  useEffect(() => {
    if (!submenuRef.current) return;
    const rect = submenuRef.current.getBoundingClientRect();
    const newStyle: React.CSSProperties = { top: '-4px' };

    // Flip to left if overflows right edge
    if (rect.right > window.innerWidth - 8) {
      newStyle.right = '100%';
      newStyle.left = 'auto';
    } else {
      newStyle.left = '100%';
    }

    // Shift upwards if overflows bottom edge
    if (rect.bottom > window.innerHeight - 8) {
      newStyle.top = 'auto';
      newStyle.bottom = '-4px';
    }

    setStyle(newStyle);
  }, [items]);

  return (
    <div
      ref={submenuRef}
      style={style}
      className="absolute z-[101] min-w-[180px] max-w-[260px] ml-1 mr-1 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200/90 dark:border-slate-700/90 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-sans select-none animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
    >
      {items.map((sub, idx) => {
        if (sub.divider) {
          return (
            <div
              key={`sub-divider-${idx}`}
              className="my-1 border-t border-slate-200/70 dark:border-slate-700/70"
            />
          );
        }

        return (
          <button
            key={sub.id || sub.label || idx}
            type="button"
            disabled={sub.disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (sub.disabled) return;
              if (sub.onClick) {
                sub.onClick();
                onClose();
              }
            }}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors cursor-pointer ${
              sub.disabled
                ? 'opacity-40 cursor-not-allowed'
                : sub.danger
                ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                : 'hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {sub.icon && (
                <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  {sub.icon}
                </span>
              )}
              <span className="truncate">{sub.label}</span>
            </div>
            {sub.shortcut && (
              <span className="text-[10px] text-slate-400 font-mono ml-2 flex-shrink-0">
                {sub.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
