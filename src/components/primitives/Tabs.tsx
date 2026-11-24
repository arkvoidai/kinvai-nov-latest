import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: number;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  className?: string;
}

export function Tabs({ items, activeId, onChange, ariaLabel, className = '' }: TabsProps) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIdx: number) => {
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight') nextIdx = (currentIdx + 1) % items.length;
    else if (e.key === 'ArrowLeft') nextIdx = (currentIdx - 1 + items.length) % items.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = items.length - 1;

    if (nextIdx !== null) {
      e.preventDefault();
      const target = items[nextIdx];
      onChange(target.id);
      const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[nextIdx]?.focus();
    }
  };

  const activeTab = items.find((i) => i.id === activeId) ?? items[0];

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={ariaLabel}
        className="inline-flex items-center gap-1 p-1 rounded-full bg-stone border border-line max-w-full overflow-x-auto"
      >
        {items.map((item, idx) => {
          const isSelected = item.id === activeTab?.id;
          return (
            <button
              key={item.id}
              id={`${baseId}-tab-${item.id}`}
              role="tab"
              type="button"
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange(item.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`inline-flex items-center gap-2 min-h-[38px] px-4 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-ink text-white'
                  : 'text-ink-2 hover:text-ink hover:bg-surface/60'
              }`}
            >
              <span>{item.label}</span>
              {typeof item.badge === 'number' && (
                <span
                  className={`font-mono text-[11px] tabular-nums ${
                    isSelected ? 'text-white/75' : 'text-ink-2'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab && (
        <div
          id={`${baseId}-panel-${activeTab.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${activeTab.id}`}
          tabIndex={0}
          className="mt-6 focus-visible:outline-none"
        >
          {activeTab.content}
        </div>
      )}
    </div>
  );
}
