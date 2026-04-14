const isBrowser = typeof window !== "undefined";

export function readJSON<T>(key: string): T | null {
  if (!isBrowser) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeKey(key: string): void {
  if (!isBrowser) return;
  window.localStorage.removeItem(key);
}

export function listKeys(prefix: string): string[] {
  if (!isBrowser) return [];
  const out: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(prefix)) out.push(k);
  }
  return out;
}
