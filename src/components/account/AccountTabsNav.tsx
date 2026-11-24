import type { KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { FolderDown, Heart, ReceiptText, UserRound } from 'lucide-react';
import { ACCOUNT_TABS, type AccountTab } from '../../lib/account/accountHelpers';
import { KINVAI_SPRING, useReducedMotion } from '../../lib/motion';

export interface AccountTabsNavProps {
  activeTab: AccountTab;
  onSelectTab: (tab: AccountTab) => void;
  counts: {
    library: number | null;
    saved: number;
    orders: number | null;
  };
}

const TAB_META: Record<
  AccountTab,
  { label: string; icon: typeof FolderDown }
> = {
  library: { label: 'Library', icon: FolderDown },
  saved: { label: 'Saved', icon: Heart },
  orders: { label: 'Orders', icon: ReceiptText },
  profile: { label: 'Profile', icon: UserRound },
};

/**
 * URL-synced account tab bar:
 * - Sticky below mobile header for smooth thumb switching on phones.
 * - Clean pill row on desktop with sliding spring indicator, real count badges, and full keyboard navigation.
 */
export function AccountTabsNav({ activeTab, onSelectTab, counts }: AccountTabsNavProps) {
  const reduced = useReducedMotion();

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % ACCOUNT_TABS.length;
    else if (e.key === 'ArrowLeft')
      nextIndex = (currentIndex - 1 + ACCOUNT_TABS.length) % ACCOUNT_TABS.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = ACCOUNT_TABS.length - 1;
    else return;

    e.preventDefault();
    const nextTab = ACCOUNT_TABS[nextIndex];
    onSelectTab(nextTab);
    document.getElementById(`kv-account-tab-${nextTab}`)?.focus();
  };

  return (
    <div className="sticky top-[68px] lg:static z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 py-1.5 lg:py-0 bg-page/92 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none">
      <div
        role="tablist"
        aria-label="Account sections"
        className="flex items-center gap-1 overflow-x-auto no-scrollbar rounded-full bg-surface border border-line p-1.5 w-full lg:w-fit"
      >
        {ACCOUNT_TABS.map((tab, idx) => {
          const { label, icon: Icon } = TAB_META[tab];
          const isActive = tab === activeTab;
          const badge =
            tab === 'library'
              ? counts.library
              : tab === 'saved'
                ? counts.saved
                : tab === 'orders'
                  ? counts.orders
                  : null;

          return (
            <button
              key={tab}
              id={`kv-account-tab-${tab}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`kv-account-panel-${tab}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelectTab(tab)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`relative inline-flex items-center justify-center gap-2 min-h-[44px] px-4 sm:px-5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer kv-press focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 ${
                isActive
                  ? 'text-white'
                  : 'text-ink-2 hover:text-ink hover:bg-stone/70'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId={reduced ? undefined : 'kv-account-active-pill'}
                  transition={reduced ? { duration: 0.01 } : KINVAI_SPRING}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-ink"
                />
              )}
              <Icon size={16} strokeWidth={1.75} className="relative z-10" aria-hidden="true" />
              <span className="relative z-10">{label}</span>
              {typeof badge === 'number' && badge > 0 && (
                <span
                  className={`relative z-10 font-mono text-[11px] px-1.5 py-0.5 rounded-full tabular-nums leading-none ${
                    isActive ? 'bg-white/18 text-white' : 'bg-page text-ink-2 border border-line'
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
