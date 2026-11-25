/**
 * SSR-safe Web Storage helpers protecting against private-browsing SecurityErrors,
 * QuotaExceededError exceptions, and malformed JSON payloads.
 */

type StorageKind = "local" | "session";

function getStorage(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "session" ? window.sessionStorage : window.localStorage;
  } catch (_err) {
    return null;
  }
}

/**
 * Safely reads a plain string value from localStorage or sessionStorage.
 */
export function readStorageString(key: string, kind: StorageKind = "local"): string | null {
  const storage = getStorage(kind);
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch (_err) {
    return null;
  }
}

/**
 * Safely persists a plain string value to localStorage or sessionStorage.
 */
export function writeStorageString(
  key: string,
  value: string,
  kind: StorageKind = "local"
): void {
  const storage = getStorage(kind);
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch (_err) {
    // Ignore storage quota or private browsing write errors
  }
}

/**
 * Safely reads and parses JSON from browser storage, returning `fallback` on failure.
 */
export function readStorageJson<T>(
  key: string,
  fallback: T,
  kind: StorageKind = "local"
): T {
  const raw = readStorageString(key, kind);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (_err) {
    return fallback;
  }
}

/**
 * Safely serializes and writes JSON data to browser storage.
 */
export function writeStorageJson<T>(
  key: string,
  value: T,
  kind: StorageKind = "local"
): void {
  try {
    writeStorageString(key, JSON.stringify(value), kind);
  } catch (_err) {
    // Ignore non-serializable payloads or storage restrictions
  }
}
