import { useSyncExternalStore } from 'react';
import { dedupeIds } from '../cart/cartStore';

export const WISHLIST_STORAGE_KEY = 'kinvai.wishlist.v2';
const LEGACY_WISHLIST_KEY = 'kinvai.saved.v1';
export const WISHLIST_SCHEMA_VERSION = 2;

export interface PersistedWishlistV2 {
  version: typeof WISHLIST_SCHEMA_VERSION;
  productIds: string[];
}

type Listener = () => void;
const listeners = new Set<Listener>();

export function parsePersistedWishlist(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      (parsed as { version?: unknown }).version === WISHLIST_SCHEMA_VERSION &&
      Array.isArray((parsed as { productIds?: unknown }).productIds)
    ) {
      return dedupeIds((parsed as { productIds: unknown[] }).productIds);
    }
    if (Array.isArray(parsed)) {
      return dedupeIds(parsed);
    }
    return [];
  } catch {
    return [];
  }
}

export function serializePersistedWishlist(productIds: readonly string[]): string {
  const payload: PersistedWishlistV2 = {
    version: WISHLIST_SCHEMA_VERSION,
    productIds: dedupeIds(productIds),
  };
  return JSON.stringify(payload);
}

/**
 * Pure merge helper used when a guest with local saved items signs in:
 * returns the union of remote + guest IDs plus the list of guest-only IDs to upsert.
 */
export function mergeWishlistIds(
  guestIds: readonly string[],
  remoteIds: readonly string[]
): { merged: string[]; toInsert: string[] } {
  const remoteSet = new Set(dedupeIds(remoteIds));
  const cleanGuest = dedupeIds(guestIds);
  const toInsert = cleanGuest.filter((id) => !remoteSet.has(id));
  const merged = dedupeIds([...remoteIds, ...toInsert]);
  return { merged, toInsert };
}

function readInitialWishlistIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const v2 = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (v2 !== null) return parsePersistedWishlist(v2);
    const v1 = window.localStorage.getItem(LEGACY_WISHLIST_KEY);
    if (v1 !== null) {
      const migrated = parsePersistedWishlist(v1);
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, serializePersistedWishlist(migrated));
      window.localStorage.removeItem(LEGACY_WISHLIST_KEY);
      return migrated;
    }
  } catch {
    return [];
  }
  return [];
}

let savedProductIds: string[] = readInitialWishlistIds();
const SERVER_EMPTY: string[] = [];

function emit(next: string[], persistLocal = true): void {
  savedProductIds = dedupeIds(next);
  if (persistLocal && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, serializePersistedWishlist(savedProductIds));
    } catch {
      // Ignore quota errors
    }
  }
  listeners.forEach((listener) => listener());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === WISHLIST_STORAGE_KEY) {
      savedProductIds = parsePersistedWishlist(e.newValue);
      listeners.forEach((listener) => listener());
    }
  });
}

export const wishlistStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot(): string[] {
    return savedProductIds;
  },
  getServerSnapshot(): string[] {
    return SERVER_EMPTY;
  },
  getGuestLocalIds(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      return parsePersistedWishlist(window.localStorage.getItem(WISHLIST_STORAGE_KEY));
    } catch {
      return [];
    }
  },
  clearGuestLocalIds(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(WISHLIST_STORAGE_KEY);
    } catch {
      // Ignore
    }
  },
  set(ids: string[], persistLocal = true): void {
    emit(ids, persistLocal);
  },
  toggleOptimistic(productId: string, persistLocal = true): {
    nowSaved: boolean;
    previous: string[];
  } {
    const previous = [...savedProductIds];
    const exists = savedProductIds.includes(productId);
    const next = exists
      ? savedProductIds.filter((id) => id !== productId)
      : [...savedProductIds, productId];
    emit(next, persistLocal);
    return { nowSaved: !exists, previous };
  },
};

export function useWishlistIds(): string[] {
  return useSyncExternalStore(
    wishlistStore.subscribe,
    wishlistStore.getSnapshot,
    wishlistStore.getServerSnapshot
  );
}
