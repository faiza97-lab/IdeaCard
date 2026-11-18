import { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import {
  evaluatePasswordStrength,
  loginUser,
  registerUser,
  resetPasswordWithRecoveryCode,
} from '../../services/authService';
import { DEMO_ACCOUNT_PREVIEWS, DEMO_PASSWORD } from '../../data/seedData';
import { User } from '../../types/ideacard';

interface AuthViewProps {
  initialMode: 'login' | 'register';
  onBack: () => void;
  onAuthenticated: (user: User) => void;
  onEnterGuest: () => void;
}

export function AuthView({
  initialMode,
  onBack,
  onAuthenticated,
  onEnterGuest,
}: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>(initialMode);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // One-time recovery code modal state after registration
  const [createdSession, setCreatedSession] = useState<{
    user: User;
    recoveryCode: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [confirmedSaved, setConfirmedSaved] = useState(false);

  const strength = evaluatePasswordStrength(password);

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    const res = await loginUser({ username, password });
    setLoading(false);
    if ('error' in res) {
      setError(res.error);
      return;
    }
    onAuthenticated(res.user);
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Konfirmasi password belum cocok.');
      return;
    }
    setLoading(true);
    const res = await registerUser({ username, password, displayName });
    setLoading(false);
    if ('error' in res) {
      setError(res.error);
      return;
    }
    setCreatedSession(res);
  }

  async function handleRecoverSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    const res = await resetPasswordWithRecoveryCode({
      username,
      recoveryCode: recoveryCodeInput,
      newPassword: password,
    });
    setLoading(false);
    if ('error' in res) {
      setError(res.error);
      return;
    }
    setSuccessMsg('Password berhasil diperbarui! Silakan masuk dengan password barumu.');
    setMode('login');
    setPassword('');
    setRecoveryCodeInput('');
  }

  async function handleQuickDemoLogin(demoUsername: string) {
    setError('');
    setLoading(true);
    const res = await loginUser({ username: demoUsername, password: DEMO_PASSWORD });
    setLoading(false);
    if ('error' in res) {
      setError(res.error);
      return;
    }
    onAuthenticated(res.user);
  }

  function handleCopyCode() {
    if (!createdSession) return;
    navigator.clipboard?.writeText(createdSession.recoveryCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  // Modal tampilkan kode pemulihan SEKALI saat akun dibuat
  if (createdSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Simpan Kode Pemulihanmu
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Karena IdeaCard tidak meminta email atau nomor HP, kode ini hanya ditampilkan{' '}
            <strong className="text-slate-900 dark:text-white">satu kali</strong> untuk mereset
            password jika suatu hari kamu lupa.
          </p>

          <div className="mt-5 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3.5 dark:border-amber-900/60 dark:bg-amber-950/30">
            <code className="font-mono text-lg font-bold tracking-wider text-amber-900 dark:text-amber-200">
              {createdSession.recoveryCode}
            </code>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 cursor-pointer"
            >
              {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedCode ? 'Tersalin' : 'Salin'}
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Jika kode ini hilang, kamu tetap dapat meminta Admin Ruang untuk mereset password akunmu.
          </p>

          <label className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmedSaved}
              onChange={(e) => setConfirmedSaved(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Saya sudah mencatat atau menyimpan kode pemulihan ini di tempat yang aman.</span>
          </label>

          <button
            type="button"
            disabled={!confirmedSaved}
            onClick={() => onAuthenticated(createdSession.user)}
            className="mt-5 w-full min-h-[48px] rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Lanjutkan ke Pilihan Ruang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
          <button
            type="button"
            onClick={onEnterGuest}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
          >
            Coba sebagai Tamu
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Form Masuk / Daftar / Pemulihan */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                  {mode === 'login' && 'Masuk ke IdeaCard'}
                  {mode === 'register' && 'Buat Akun Baru'}
                  {mode === 'recover' && 'Reset Password'}
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Tanpa email dan tanpa nomor HP — cukup username &amp; password.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`min-h-[40px] rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`min-h-[40px] rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                Buat Akun
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('recover');
                  setError('');
                }}
                className={`min-h-[40px] rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  mode === 'recover'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                Lupa Password
              </button>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                <Check className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form
              onSubmit={
                mode === 'login'
                  ? handleLoginSubmit
                  : mode === 'register'
                  ? handleRegisterSubmit
                  : handleRecoverSubmit
              }
              className="mt-5 space-y-4"
            >
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="contoh: nadia_siswa"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                    Nama Tampilan <span className="font-normal text-slate-400">(opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="contoh: Nadia Kusuma"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              )}

              {mode === 'recover' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                    Kode Pemulihan
                  </label>
                  <input
                    type="text"
                    required
                    value={recoveryCodeInput}
                    onChange={(e) => setRecoveryCodeInput(e.target.value)}
                    placeholder="contoh: IC-XXXX-XXXX"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm uppercase text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  {mode === 'recover' ? 'Password Baru' : 'Password'}
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-11 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {(mode === 'register' || mode === 'recover') && password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            strength.score >= level
                              ? strength.score <= 1
                                ? 'bg-rose-500'
                                : strength.score === 2
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                              : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Kekuatan: <span className="font-bold text-slate-700 dark:text-slate-200">{strength.label}</span> — {strength.hint}
                    </p>
                  </div>
                )}
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                    Ulangi Password
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              )}

              {mode === 'recover' && (
                <div className="flex items-start gap-2 rounded-xl bg-slate-100 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    Lupa kode pemulihan juga? Hubungi Admin Ruang agar password akunmu dapat direset melalui menu Pengaturan Ruang.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loading
                  ? 'Memproses...'
                  : mode === 'login'
                  ? 'Masuk Sekarang'
                  : mode === 'register'
                  ? 'Buat Akun & Dapatkan Kode Pemulihan'
                  : 'Simpan Password Baru'}
              </button>
            </form>
          </div>

          {/* Panel Akun Contoh Siap Pakai */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2.5">
              <UserCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                Coba Cepat Akun Contoh
              </h2>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Pilih salah satu peran di bawah untuk langsung mencoba alur OSIS SMA Nusantara dan Kelas XI-A (password:{' '}
              <code className="font-mono font-semibold text-slate-800 dark:text-slate-200">{DEMO_PASSWORD}</code>).
            </p>

            <div className="mt-4 space-y-2.5">
              {DEMO_ACCOUNT_PREVIEWS.map((demo) => (
                <button
                  key={demo.username}
                  type="button"
                  onClick={() => handleQuickDemoLogin(demo.username)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-left hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {demo.displayName}
                    </span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {demo.roleLabel}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono">@{demo.username}</span>
                    <span aria-hidden="true">·</span>
                    <span>{demo.workspaceHint}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span>Password disimpan dalam bentuk hash terenkripsi di penyimpanan lokal.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
