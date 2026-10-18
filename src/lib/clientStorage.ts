import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

// Satu-satunya modul yang boleh menyentuh window.localStorage.
const PREFIX = "pg:";

const LEGACY_EXACT_KEYS = [
  "generatorFormState",
  "generatorLastActiveChannelId",
  "scenePromptState",
  "promptgen_favorite_voices",
] as const;
const LEGACY_PREFIXES = ["generatorFormState_"] as const;

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function allKeys(s: Storage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k) keys.push(k);
  }
  return keys;
}

export function userStorageKey(userId: string, name: string): string {
  return `${PREFIX}${userId}:${name}`;
}

export function getUserItem(userId: string | null | undefined, name: string): string | null {
  const s = storage();
  if (!s || !userId) return null;
  try {
    return s.getItem(userStorageKey(userId, name));
  } catch {
    return null;
  }
}

export function setUserItem(userId: string | null | undefined, name: string, value: string): void {
  const s = storage();
  if (!s || !userId) return;
  try {
    s.setItem(userStorageKey(userId, name), value);
  } catch {
    // kuota penuh / mode privat: abaikan
  }
}

export function removeUserItem(userId: string | null | undefined, name: string): void {
  const s = storage();
  if (!s || !userId) return;
  try {
    s.removeItem(userStorageKey(userId, name));
  } catch {
    // abaikan
  }
}

/** Hapus SEMUA data ber-prefix "pg:" (semua user) + key legacy. Dipanggil saat logout. */
export function clearAllUserScopedStorage(): void {
  const s = storage();
  if (!s) return;
  for (const k of allKeys(s)) {
    if (k.startsWith(PREFIX) || isLegacyKey(k)) {
      try {
        s.removeItem(k);
      } catch {
        // abaikan
      }
    }
  }
}

/** Hapus data milik user LAIN (sisa sesi sebelumnya) dan key legacy tanpa pemilik. */
export function purgeForeignStorage(currentUserId: string): void {
  const s = storage();
  if (!s || !currentUserId) return;
  const mine = `${PREFIX}${currentUserId}:`;
  for (const k of allKeys(s)) {
    const foreign = k.startsWith(PREFIX) && !k.startsWith(mine);
    if (foreign || isLegacyKey(k)) {
      try {
        s.removeItem(k);
      } catch {
        // abaikan
      }
    }
  }
}

function isLegacyKey(k: string): boolean {
  if ((LEGACY_EXACT_KEYS as readonly string[]).includes(k)) return true;
  return LEGACY_PREFIXES.some((p) => k.startsWith(p));
}

/**
 * Hook untuk menyimpan dan membaca state ke user-scoped storage (pg:<userId>:<key>).
 * Membaca nilai awal dari storage saat mount dan menyimpan perubahan secara otomatis.
 */
export function useStorageGuard<T>(
  key: string,
  defaultValue: T,
  explicitUserId?: string
): [T, (value: T | ((prev: T) => T)) => void] {
  const session = useSession();
  const userId = explicitUserId || session?.data?.user?.id;
  const [value, setValue] = useState<T>(() => {
    if (!userId) return defaultValue;
    try {
      const raw = getUserItem(userId, key);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    if (!userId) return;
    try {
      setUserItem(userId, key, JSON.stringify(value));
    } catch {
      // abaikan
    }
  }, [value, userId, key]);

  return [value, setValue];
}

