// Lapisan penyimpanan lokal + sinkronisasi server agar data bersama (ruang, akun, ide, program)
// tetap konsisten antar tab, perangkat, maupun jendela incognito, serta mudah diganti ke Firebase.

export const STORAGE_KEYS = {
  USERS: 'ideacard_users_v1',
  SESSION: 'ideacard_session_v1',
  WORKSPACES: 'ideacard_workspaces_v1',
  IDEAS: 'ideacard_ideas_v1',
  ANON_VAULT: 'ideacard_anon_vault_v1',
  REPORTS: 'ideacard_reports_v1',
  REFLECTIONS: 'ideacard_reflections_v1',
  NOTIFICATIONS: 'ideacard_notifications_v1',
  PROGRAMS: 'ideacard_programs_v1',
  MONTHLY_NOTES: 'ideacard_monthly_notes_v1',
  BIDANG_PROPOSALS: 'ideacard_bidang_proposals_v1',
  THEME_MODE: 'ideacard_theme_mode_v1',
  SEEDED: 'ideacard_seeded_v1',
} as const;

const SHARED_SYNC_KEYS = new Set<string>([
  STORAGE_KEYS.USERS,
  STORAGE_KEYS.WORKSPACES,
  STORAGE_KEYS.IDEAS,
  STORAGE_KEYS.ANON_VAULT,
  STORAGE_KEYS.REPORTS,
  STORAGE_KEYS.REFLECTIONS,
  STORAGE_KEYS.NOTIFICATIONS,
  STORAGE_KEYS.PROGRAMS,
  STORAGE_KEYS.MONTHLY_NOTES,
  STORAGE_KEYS.BIDANG_PROPOSALS,
  STORAGE_KEYS.SEEDED,
]);

let syncChannel: BroadcastChannel | null = null;
if (typeof BroadcastChannel !== 'undefined') {
  syncChannel = new BroadcastChannel('ideacard_sync_v1');
}

export function onExternalSync(callback: () => void): () => void {
  const handleStorage = (e: StorageEvent) => {
    if (e.key && SHARED_SYNC_KEYS.has(e.key)) callback();
  };
  const handleMessage = () => callback();
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }
  syncChannel?.addEventListener('message', handleMessage);
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
    syncChannel?.removeEventListener('message', handleMessage);
  };
}

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T, skipRemoteSync = false): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Gagal menyimpan data ke localStorage:', err);
  }

  if (!skipRemoteSync && SHARED_SYNC_KEYS.has(key)) {
    syncChannel?.postMessage({ key });
    if (typeof fetch !== 'undefined') {
      fetch(`/api/state/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      }).catch(() => {
        // Fallback diam-diam ke localStorage jika server offline
      });
    }
  }
}

export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function mergeArrayById<T extends Record<string, unknown>>(
  serverArr: T[],
  localArr: T[],
  idField = 'id'
): { merged: T[]; localHadExtras: boolean } {
  const map = new Map<string, T>();
  serverArr.forEach((item) => {
    const k = String(item[idField] ?? '');
    if (k) map.set(k, item);
  });
  let localHadExtras = false;
  localArr.forEach((item) => {
    const k = String(item[idField] ?? '');
    if (k && !map.has(k)) {
      map.set(k, item);
      localHadExtras = true;
    }
  });
  return { merged: Array.from(map.values()), localHadExtras };
}

export async function hydrateFromServer(): Promise<void> {
  if (typeof fetch === 'undefined') return;
  try {
    const res = await fetch('/api/state', { cache: 'no-store' });
    if (!res.ok) return;
    const serverState = (await res.json()) as Record<string, unknown>;
    const hasServerWorkspaces =
      Array.isArray(serverState[STORAGE_KEYS.WORKSPACES]) &&
      (serverState[STORAGE_KEYS.WORKSPACES] as unknown[]).length > 0;

    if (!hasServerWorkspaces) {
      // Jika server masih kosong tetapi browser ini sudah punya data, dorong ke server
      const localWorkspaces = readStorage<unknown[]>(STORAGE_KEYS.WORKSPACES, []);
      if (localWorkspaces.length > 0) {
        await Promise.all(
          Array.from(SHARED_SYNC_KEYS).map((key) => {
            const val = readStorage<unknown>(key, null);
            if (val === null) return Promise.resolve();
            return fetch(`/api/state/${encodeURIComponent(key)}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ value: val }),
            }).catch(() => undefined);
          })
        );
      }
      return;
    }

    // Gabungkan data server & data lokal yang belum sempat tersinkronisasi
    for (const key of SHARED_SYNC_KEYS) {
      const serverVal = serverState[key];
      if (serverVal === undefined) continue;

      if (Array.isArray(serverVal)) {
        const localVal = readStorage<Record<string, unknown>[]>(key, []);
        const idField = key === STORAGE_KEYS.ANON_VAULT ? 'ideaId' : 'id';
        const { merged, localHadExtras } = mergeArrayById(
          serverVal as Record<string, unknown>[],
          localVal,
          idField
        );
        writeStorage(key, merged, !localHadExtras);
      } else {
        writeStorage(key, serverVal, true);
      }
    }
  } catch {
    // Tetap berjalan normal menggunakan localStorage
  }
}

export function normalizeJoinCode(raw: string): string {
  let value = raw.trim();
  try {
    if (value.includes('http://') || value.includes('https://') || value.includes('?')) {
      const urlCandidate = value.startsWith('http')
        ? value
        : `https://example.com/${value.replace(/^\/+/, '')}`;
      const parsed = new URL(urlCandidate);
      const fromQuery = parsed.searchParams.get('ruang') || parsed.searchParams.get('gabung');
      if (fromQuery) value = fromQuery;
    }
  } catch {
    // Abaikan jika bukan format URL
  }
  value = value.replace(/^kode(\s+gabung|\s+ruang)?\s*[:=]\s*/i, '');
  value = value.replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\s+/g, '');
  return value.toUpperCase();
}

export function stripHyphens(code: string): string {
  return code.replace(/[^A-Z0-9]/g, '');
}

export function generateId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// Hash password menggunakan Web Crypto SHA-256 + salt (fallback aman jika subtle unavailable)
export async function hashSecret(secret: string, salt: string): Promise<string> {
  const payload = `${salt}:${secret}:ideacard_salt_v1`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fallback_${(hash >>> 0).toString(16)}`;
}

export function generateSalt(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// Pemetaan username ke alamat internal untuk kesiapan migrasi ke Firebase Authentication
export function mapUsernameToInternalEmail(username: string): string {
  const sanitized = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return `${sanitized}@ideacard.app`;
}
