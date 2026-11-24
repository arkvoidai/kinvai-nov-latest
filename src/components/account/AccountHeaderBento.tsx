import { useState } from 'react';
import { ArrowUpRight, FolderDown, Heart, LogOut, Shield } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { COUNTRY_OPTIONS, type AccountTab } from '../../lib/account/accountHelpers';
import type { Profile } from '../../lib/data/types';
import { Button, IconButton, Skeleton, TagPill, Tile, useToast } from '../primitives';

export interface AccountHeaderBentoProps {
  user: User;
  profile: Profile | null;
  isAdmin: boolean;
  ownedCount: number | null;
  savedCount: number;
  onSelectTab: (tab: AccountTab) => void;
  onSignOut: () => Promise<{ error: string | null }>;
}

/**
 * Promax-inspired asymmetric customer account header bento:
 * - Left 8 cols (desktop): White identity tile with avatar, display name, email, and explicit Sign out.
 * - Right 4 cols (desktop): Warm stone quick-stats tile with real Owned & Saved counts + arrow link to /shop.
 */
export function AccountHeaderBento({
  user,
  profile,
  isAdmin,
  ownedCount,
  savedCount,
  onSelectTab,
  onSignOut,
}: AccountHeaderBentoProps) {
  const { toast } = useToast();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const displayName =
    profile?.display_name?.trim() || user.email?.split('@')[0] || 'Kinvai member';
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const showAvatarImg = Boolean(profile?.avatar_url) && !avatarFailed;
  const countryLabel = profile?.country_code
    ? COUNTRY_OPTIONS.find((c) => c.value === profile.country_code?.toUpperCase())?.label ||
      profile.country_code.toUpperCase()
    : null;

  const handleConfirmSignOut = async () => {
    setSignOutError(null);
    setSigningOut(true);
    const res = await onSignOut();
    if (res.error) {
      setSignOutError(res.error);
      setSigningOut(false);
      toast({
        title: 'Sign-out failed',
        description: res.error,
        tone: 'error',
      });
      return;
    }
    setSigningOut(false);
    setConfirmingSignOut(false);
    toast({
      title: 'Signed out',
      description: 'You can sign back in anytime to access your library.',
    });
  };

  return (
    <section aria-label="Account overview" className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Identity Tile (8 cols desktop) */}
      <Tile
        variant="white"
        radius="xl"
        padding="lg"
        className="lg:col-span-8 flex flex-col justify-between gap-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <TagPill>Member</TagPill>
            {isAdmin && <TagPill tone="brand">Owner</TagPill>}
            {countryLabel && (
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2">
                {countryLabel}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <Button
                variant="secondary"
                size="sm"
                to="/admin"
                icon={<Shield size={16} strokeWidth={1.75} aria-hidden="true" />}
              >
                Owner dashboard
              </Button>
            )}

            {!confirmingSignOut ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSignOutError(null);
                  setConfirmingSignOut(true);
                }}
                icon={<LogOut size={16} strokeWidth={1.75} aria-hidden="true" />}
              >
                Sign out
              </Button>
            ) : (
              <div
                className="flex items-center gap-1.5 rounded-full bg-page border border-line-strong p-1 pl-3"
                role="group"
                aria-label="Confirm sign out"
              >
                <span className="text-xs font-medium text-ink mr-1">Sign out?</span>
                <Button
                  variant="primary"
                  size="sm"
                  loading={signingOut}
                  onClick={handleConfirmSignOut}
                  className="!min-h-[36px] !px-3.5 !text-xs"
                >
                  Confirm
                </Button>
                <Button
                  variant="quiet"
                  size="sm"
                  disabled={signingOut}
                  onClick={() => setConfirmingSignOut(false)}
                  className="!min-h-[36px] !px-3 !text-xs"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          {showAvatarImg && profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={`${displayName} avatar`}
              width={64}
              height={64}
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border border-line shrink-0"
            />
          ) : (
            <div
              aria-hidden="true"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-ink text-white text-xl sm:text-2xl font-semibold inline-flex items-center justify-center shrink-0"
            >
              {avatarInitial}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="type-h2 font-semibold text-ink truncate">{displayName}</h1>
            {user.email && (
              <p className="text-sm sm:text-base text-ink-2 truncate mt-0.5">{user.email}</p>
            )}
          </div>
        </div>

        {signOutError && (
          <p
            role="alert"
            className="text-xs text-error bg-error-bg rounded-[14px] px-3.5 py-2.5"
          >
            {signOutError}
          </p>
        )}
      </Tile>

      {/* Quick Stats Tile (4 cols desktop) — strictly real owned & saved counts */}
      <Tile
        variant="stone"
        radius="xl"
        padding="lg"
        className="lg:col-span-4 flex flex-col justify-between gap-5"
      >
        <div className="flex items-center justify-between gap-3">
          <TagPill className="bg-surface">At a glance</TagPill>
          <IconButton
            label="Explore the shop"
            icon={<ArrowUpRight size={18} strokeWidth={1.75} className="kv-arrow-icon" />}
            variant="surface"
            size="sm"
            to="/shop"
            className="kv-arrow-trigger"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSelectTab('library')}
            className="group text-left rounded-[20px] bg-surface border border-line p-3.5 sm:p-4 cursor-pointer kv-press kv-bento-tile min-h-[92px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 text-ink-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em]">Owned</span>
              <FolderDown size={15} strokeWidth={1.75} aria-hidden="true" />
            </div>
            {ownedCount === null ? (
              <Skeleton className="h-8 w-10 mt-2" rounded="sm" />
            ) : (
              <span
                data-testid="account-stat-owned"
                className="font-mono text-2xl sm:text-3xl font-semibold text-ink tabular-nums mt-1"
              >
                {ownedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('saved')}
            className="group text-left rounded-[20px] bg-surface border border-line p-3.5 sm:p-4 cursor-pointer kv-press kv-bento-tile min-h-[92px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 text-ink-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em]">Saved</span>
              <Heart size={15} strokeWidth={1.75} aria-hidden="true" />
            </div>
            <span
              data-testid="account-stat-saved"
              className="font-mono text-2xl sm:text-3xl font-semibold text-ink tabular-nums mt-1"
            >
              {savedCount}
            </span>
          </button>
        </div>

        <p className="text-xs text-ink-2 leading-relaxed">
          1 licence per product. Yours for life.
        </p>
      </Tile>
    </section>
  );
}
