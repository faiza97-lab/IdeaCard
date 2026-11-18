import { User } from '../types/ideacard';
import {
  STORAGE_KEYS,
  generateId,
  generateSalt,
  hashSecret,
  hydrateFromServer,
  mapUsernameToInternalEmail,
  readStorage,
  removeStorage,
  writeStorage,
} from './storageService';

export interface SessionState {
  userId: string | null;
  isGuest: boolean;
  activeWorkspaceId: string | null;
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Terlalu Pendek' | 'Lemah' | 'Sedang' | 'Kuat' | 'Sangat Kuat';
  hint: string;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) {
    return {
      score: 0,
      label: 'Terlalu Pendek',
      hint: 'Minimal 8 karakter agar akun tetap aman.',
    };
  }
  let score = 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { score: 1, label: 'Lemah', hint: 'Tambahkan huruf besar atau angka.' };
  }
  if (score === 2) {
    return { score: 2, label: 'Sedang', hint: 'Cukup baik, kombinasi angka & simbol membuatnya lebih kuat.' };
  }
  if (score === 3) {
    return { score: 3, label: 'Kuat', hint: 'Kata sandi sudah kuat.' };
  }
  return { score: 4, label: 'Sangat Kuat', hint: 'Kombinasi kata sandi sangat aman.' };
}

export function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `IC-${part(4)}-${part(4)}`;
}

export function getUsers(): User[] {
  return readStorage<User[]>(STORAGE_KEYS.USERS, []);
}

export function getUserById(userId: string): User | undefined {
  return getUsers().find((u) => u.id === userId);
}

export function getSession(): SessionState {
  return readStorage<SessionState>(STORAGE_KEYS.SESSION, {
    userId: null,
    isGuest: false,
    activeWorkspaceId: null,
  });
}

export function setSession(session: SessionState): void {
  writeStorage(STORAGE_KEYS.SESSION, session);
}

export function clearSession(): void {
  removeStorage(STORAGE_KEYS.SESSION);
}

export async function registerUser(params: {
  username: string;
  password: string;
  displayName?: string;
}): Promise<{ user: User; recoveryCode: string } | { error: string }> {
  const cleanUsername = params.username.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,24}$/.test(cleanUsername)) {
    return {
      error: 'Username harus 3–24 karakter dan hanya berisi huruf kecil, angka, titik, atau garis bawah.',
    };
  }
  if (params.password.length < 8) {
    return { error: 'Password minimal 8 karakter.' };
  }

  await hydrateFromServer();

  const users = getUsers();
  if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return { error: 'Username sudah digunakan. Silakan pilih username lain.' };
  }

  const salt = generateSalt();
  const passwordHash = await hashSecret(params.password, salt);
  const recoveryCode = generateRecoveryCode();
  const recoveryCodeHash = await hashSecret(recoveryCode.toUpperCase(), salt);

  const newUser: User = {
    id: generateId('usr'),
    username: cleanUsername,
    displayName: params.displayName?.trim() || cleanUsername,
    passwordHash,
    passwordSalt: salt,
    recoveryCodeHash,
    internalAuthEmail: mapUsernameToInternalEmail(cleanUsername),
    createdAt: new Date().toISOString(),
  };

  writeStorage(STORAGE_KEYS.USERS, [...users, newUser]);
  setSession({ userId: newUser.id, isGuest: false, activeWorkspaceId: null });

  return { user: newUser, recoveryCode };
}

export async function loginUser(params: {
  username: string;
  password: string;
}): Promise<{ user: User } | { error: string }> {
  await hydrateFromServer();

  const cleanUsername = params.username.trim().toLowerCase();
  const users = getUsers();
  const user = users.find((u) => u.username.toLowerCase() === cleanUsername);

  if (!user) {
    return { error: 'Username tidak ditemukan. Periksa kembali atau buat akun baru.' };
  }

  const candidateHash = await hashSecret(params.password, user.passwordSalt);
  if (candidateHash !== user.passwordHash) {
    return { error: 'Password salah. Gunakan kode pemulihan atau hubungi admin ruang untuk reset.' };
  }

  const currentSession = getSession();
  setSession({
    userId: user.id,
    isGuest: false,
    activeWorkspaceId: currentSession.activeWorkspaceId,
  });
  return { user };
}

export async function resetPasswordWithRecoveryCode(params: {
  username: string;
  recoveryCode: string;
  newPassword: string;
}): Promise<{ ok: true } | { error: string }> {
  const cleanUsername = params.username.trim().toLowerCase();
  if (params.newPassword.length < 8) {
    return { error: 'Password baru minimal 8 karakter.' };
  }

  await hydrateFromServer();

  const users = getUsers();
  const idx = users.findIndex((u) => u.username.toLowerCase() === cleanUsername);
  if (idx === -1) {
    return { error: 'Username tidak ditemukan.' };
  }

  const user = users[idx];
  const candidateRecoveryHash = await hashSecret(
    params.recoveryCode.trim().toUpperCase(),
    user.passwordSalt
  );
  if (candidateRecoveryHash !== user.recoveryCodeHash) {
    return { error: 'Kode pemulihan tidak cocok.' };
  }

  const newSalt = generateSalt();
  const newPasswordHash = await hashSecret(params.newPassword, newSalt);
  const newRecoveryHash = await hashSecret(params.recoveryCode.trim().toUpperCase(), newSalt);

  users[idx] = {
    ...user,
    passwordSalt: newSalt,
    passwordHash: newPasswordHash,
    recoveryCodeHash: newRecoveryHash,
    mustChangePassword: false,
  };
  writeStorage(STORAGE_KEYS.USERS, users);
  return { ok: true };
}

// Reset password oleh Admin Ruang untuk anggota yang lupa kode pemulihan
export async function adminResetMemberPassword(
  targetUserId: string
): Promise<{ tempPassword: string } | { error: string }> {
  await hydrateFromServer();
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === targetUserId);
  if (idx === -1) {
    return { error: 'Akun anggota tidak ditemukan.' };
  }

  const tempPassword = `Idea${Math.random().toString(36).slice(2, 8)}!`;
  const newSalt = generateSalt();
  const newHash = await hashSecret(tempPassword, newSalt);

  users[idx] = {
    ...users[idx],
    passwordSalt: newSalt,
    passwordHash: newHash,
    mustChangePassword: true,
  };
  writeStorage(STORAGE_KEYS.USERS, users);
  return { tempPassword };
}

export function enterGuestMode(sampleWorkspaceId: string): void {
  setSession({
    userId: null,
    isGuest: true,
    activeWorkspaceId: sampleWorkspaceId,
  });
}

export function logoutUser(): void {
  clearSession();
}
