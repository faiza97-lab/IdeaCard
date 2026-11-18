// Lapisan penyimpanan lokal yang terpisah dari UI agar mudah diganti ke Firebase Auth + Firestore.

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

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Gagal menyimpan data ke localStorage:', err);
  }
}

export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
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
  // Fallback deterministik sederhana jika Web Crypto tidak tersedia
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
