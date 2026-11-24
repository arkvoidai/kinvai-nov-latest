import { useSyncExternalStore } from 'react';

export const CART_STORAGE_KEY = 'kinvai.cart.v2';
const LEGACY_CART_STORAGE_KEY = 'kinvai.cart.v1';
export const CART_SCHEMA_VERSION = 2;

export interface PersistedCartV2 {
  version: typeof CART_SCHEMA_VERSION;
  productIds: string[];
}

export interface CartFlightEvent {
  id: number;
  startX: number;
  startY: number;
}

type Listener = () => void;

const listeners = new Set<Listener>();
const flightListeners = new Set<(event: CartFlightEvent) => void>();
let flightSeq = 0;

/**
 * Pure parser for persisted cart payload. Stores product IDs only (1 licence per product).
 * Supports migrating legacy v1 array-of-objects storage cleanly.
 */
export function parsePersistedCart(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      (parsed as { version?: unknown }).version === CART_SCHEMA_VERSION &&
      Array.isArray((parsed as { productIds?: unknown }).productIds)
    ) {
      return dedupeIds((parsed as { productIds: unknown[] }).productIds);
    }

    // Legacy v1 migration: array of { productId: string }
    if (Array.isArray(parsed)) {
      const legacyIds = parsed
        .map((item) =>
          item && typeof item === 'object' && typeof (item as { productId?: unknown }).productId === 'string'
            ? (item as { productId: string }).productId
            : typeof item === 'string'
              ? item
              : null
        )
        .filter((id): id is string => Boolean(id));
      return dedupeIds(legacyIds);
    }
    return [];
  } catch {
    return [];
  }
}

export function serializePersistedCart(productIds: readonly string[]): string {
  const payload: PersistedCartV2 = {
    version: CART_SCHEMA_VERSION,
    productIds: dedupeIds(productIds),
  };
  return JSON.stringify(payload);
}

export function dedupeIds(ids: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (typeof id === 'string') {
      const trimmed = id.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        out.push(trimmed);
      }
    }
  }
  return out;
}

export function addProductIdUnique(ids: readonly string[], productId: string): {
  next: string[];
  added: boolean;
} {
  const clean = productId.trim();
  if (!clean || ids.includes(clean)) {
    return { next: [...ids], added: false };
  }
  return { next: [...ids, clean], added: true };
}

export function removeProductId(ids: readonly string[], productId: string): string[] {
  return ids.filter((id) => id !== productId);
}

function readInitialCartIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const v2 = window.localStorage.getItem(CART_STORAGE_KEY);
    if (v2 !== null) {
      return parsePersistedCart(v2);
    }
    const v1 = window.localStorage.getItem(LEGACY_CART_STORAGE_KEY);
    if (v1 !== null) {
      const migrated = parsePersistedCart(v1);
      window.localStorage.setItem(CART_STORAGE_KEY, serializePersistedCart(migrated));
      window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
      return migrated;
    }
  } catch {
    return [];
  }
  return [];
}

let cartProductIds: string[] = readInitialCartIds();
const SERVER_EMPTY_SNAPSHOT: string[] = [];

function persist(next: string[]): void {
  cartProductIds = next;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, serializePersistedCart(next));
    } catch {
      // Ignore storage quota / private-browsing errors
    }
  }
  listeners.forEach((listener) => listener());
}

// Keep multiple browser tabs synchronized
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === CART_STORAGE_KEY) {
      cartProductIds = parsePersistedCart(e.newValue);
      listeners.forEach((listener) => listener());
    }
  });
}

export const cartStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot(): string[] {
    return cartProductIds;
  },
  getServerSnapshot(): string[] {
    return SERVER_EMPTY_SNAPSHOT;
  },
  add(productId: string): boolean {
    const { next, added } = addProductIdUnique(cartProductIds, productId);
    if (added) {
      persist(next);
    }
    return added;
  },
  remove(productId: string): void {
    const next = removeProductId(cartProductIds, productId);
    if (next.length !== cartProductIds.length) {
      persist(next);
    }
  },
  clear(): void {
    if (cartProductIds.length > 0) {
      persist([]);
    }
  },
  replace(ids: string[]): void {
    persist(dedupeIds(ids));
  },
  subscribeFlight(listener: (event: CartFlightEvent) => void): () => void {
    flightListeners.add(listener);
    return () => {
      flightListeners.delete(listener);
    };
  },
  triggerFlight(startX: number, startY: number): void {
    flightSeq += 1;
    const evt: CartFlightEvent = { id: flightSeq, startX, startY };
    flightListeners.forEach((l) => l(evt));
  },
};

export function useCartProductIds(): string[] {
  return useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot
  );
}
