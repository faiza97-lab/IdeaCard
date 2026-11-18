import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  FolderPlus,
  KeyRound,
  Layers,
  LogOut,
  Moon,
  Plus,
  Sun,
  Trash2,
  Users,
} from 'lucide-react';
import { hydrateFromServer, onExternalSync } from '../../services/storageService';
import {
  WORKSPACE_TEMPLATES,
  createWorkspace,
  getMemberRole,
  getUserWorkspaces,
  joinWorkspaceByCodeAsync,
} from '../../services/workspaceService';
import { Bidang, BidangColor, User, Workspace, WorkspaceTemplateId } from '../../types/ideacard';
import { BIDANG_COLOR_MAP, getRoleLabel } from '../../utils/themeUtils';

interface WorkspaceSelectorProps {
  user: User;
  darkMode: boolean;
  initialJoinCode?: string;
  onToggleDarkMode: () => void;
  onSelectWorkspace: (workspace: Workspace) => void;
  onLogout: () => void;
}

const DEFAULT_COLORS: BidangColor[] = ['mint', 'sky', 'purple', 'orange', 'coral', 'amber'];

export function WorkspaceSelector({
  user,
  darkMode,
  initialJoinCode = '',
  onToggleDarkMode,
  onSelectWorkspace,
  onLogout,
}: WorkspaceSelectorProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => getUserWorkspaces(user.id));
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let active = true;
    hydrateFromServer().then(() => {
      if (active) setWorkspaces(getUserWorkspaces(user.id));
    });
    const unsubscribe = onExternalSync(() => {
      setWorkspaces(getUserWorkspaces(user.id));
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [user.id]);

  useEffect(() => {
    if (initialJoinCode) {
      setJoinCode(initialJoinCode);
    }
  }, [initialJoinCode]);

  // Create form state
  const [templateId, setTemplateId] = useState<WorkspaceTemplateId>('kelas');
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [programTerm, setProgramTerm] = useState('Agenda');
  const [bidangTerm, setBidangTerm] = useState('Seksi');
  const [draftBidangList, setDraftBidangList] = useState<Omit<Bidang, 'id'>[]>(() => {
    const initialTpl = WORKSPACE_TEMPLATES.find((t) => t.id === 'kelas') ?? WORKSPACE_TEMPLATES[0];
    return initialTpl.bidangList.map((b) => ({ ...b }));
  });

  function handleTemplatePick(id: WorkspaceTemplateId) {
    setTemplateId(id);
    const tpl = WORKSPACE_TEMPLATES.find((t) => t.id === id);
    if (tpl) {
      setProgramTerm(tpl.terms.programSingular);
      setBidangTerm(tpl.terms.bidangSingular);
      setDraftBidangList(tpl.bidangList.map((b) => ({ ...b })));
    }
  }

  function handleDraftBidangCountChange(targetCount: number) {
    const clamped = Math.max(1, Math.min(20, targetCount));
    if (clamped === draftBidangList.length) return;
    if (clamped < draftBidangList.length) {
      setDraftBidangList(draftBidangList.slice(0, clamped));
      return;
    }
    const next = [...draftBidangList];
    while (next.length < clamped) {
      const idx = next.length;
      next.push({
        name: `${bidangTerm || 'Bidang'} ${idx + 1}`,
        color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
        icon: 'Layers',
        picName: `Koordinator ${idx + 1}`,
      });
    }
    setDraftBidangList(next);
  }

  async function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setJoinError('');
    if (!joinCode.trim()) {
      setJoinError('Masukkan kode ruang terlebih dahulu.');
      return;
    }
    setJoining(true);
    const res = await joinWorkspaceByCodeAsync({ code: joinCode, user });
    setJoining(false);
    if ('error' in res) {
      setJoinError(res.error);
      return;
    }
    setWorkspaces(getUserWorkspaces(user.id));
    onSelectWorkspace(res.workspace);
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wsName.trim()) return;
    const cleanedBidang = draftBidangList
      .map((b, i) => ({
        ...b,
        name: b.name.trim() || `${bidangTerm || 'Bidang'} ${i + 1}`,
      }))
      .filter((b) => b.name.length > 0);
    const created = createWorkspace({
      name: wsName,
      description: wsDesc,
      templateId,
      creator: user,
      customTerms: {
        programSingular: programTerm.trim() || 'Program',
        programPlural: programTerm.trim() || 'Program',
        bidangSingular: bidangTerm.trim() || 'Bidang',
      },
      customBidangList: cleanedBidang,
    });
    setWorkspaces(getUserWorkspaces(user.id));
    onSelectWorkspace(created);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            Idea<span className="text-indigo-600 dark:text-indigo-400">Card</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-semibold text-slate-500 dark:text-slate-400">
              Masuk sebagai <strong className="text-slate-800 dark:text-slate-200">{user.displayName || user.username}</strong>
            </span>
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label="Ubah tema"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
              Pilih atau Buat Ruang Kelompok
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Satu akun dapat bergabung ke banyak ruang sekaligus — mulai dari kelas, OSIS, ekskul, hingga tim kerja.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {showCreate ? <Layers className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showCreate ? 'Lihat Daftar Ruang' : 'Buat Ruang Baru'}
          </button>
        </div>

        {showCreate ? (
          <form
            onSubmit={handleCreateSubmit}
            className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6"
          >
            <div className="flex items-center gap-3">
              <FolderPlus className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">
                  Buat Ruang Kerja Baru
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pilih template bawaan — seluruh bidang, istilah, dan warna tetap bisa kamu ubah kapan saja.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
                1. Pilih Template Kelompok
              </label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {WORKSPACE_TEMPLATES.map((tpl) => {
                  const selected = templateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleTemplatePick(tpl.id)}
                      className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                        selected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                          : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/50'
                      }`}
                    >
                      <div className="font-display text-sm font-bold text-slate-900 dark:text-white">
                        {tpl.name}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {tpl.subtitle}
                      </p>
                      <p className="mt-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                        {tpl.bidangList.length} {tpl.terms.bidangSingular} · Istilah: {tpl.terms.programSingular}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  2. Nama Ruang
                </label>
                <input
                  type="text"
                  required
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="contoh: Ekskul Robotika / Kelas XII-B"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Deskripsi Singkat
                </label>
                <input
                  type="text"
                  value={wsDesc}
                  onChange={(e) => setWsDesc(e.target.value)}
                  placeholder="Tujuan kotak ide kelompok ini"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Istilah untuk Rencana Aksi
                </label>
                <input
                  type="text"
                  value={programTerm}
                  onChange={(e) => setProgramTerm(e.target.value)}
                  placeholder="misal: Proker, Program, Proyek, atau Agenda"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Istilah untuk Kelompok/Unit
                </label>
                <input
                  type="text"
                  value={bidangTerm}
                  onChange={(e) => setBidangTerm(e.target.value)}
                  placeholder="misal: Sekbid, Bidang, Divisi, atau Seksi"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            {/* 3. Sesuaikan Jumlah & Nama Bidang/Sekbid */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                    3. Sesuaikan Jumlah &amp; Nama {bidangTerm || 'Bidang'}
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Setiap sekolah atau kelompok bisa berbeda — atur jumlah dan nama sesuai kebutuhanmu.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Jumlah:</span>
                  <button
                    type="button"
                    onClick={() => handleDraftBidangCountChange(draftBidangList.length - 1)}
                    disabled={draftBidangList.length <= 1}
                    className="h-9 w-9 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                    {draftBidangList.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDraftBidangCountChange(draftBidangList.length + 1)}
                    disabled={draftBidangList.length >= 20}
                    className="h-9 w-9 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {draftBidangList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <span className="w-6 text-center font-mono text-xs font-bold text-slate-400 tabular-nums shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraftBidangList((prev) =>
                          prev.map((b, i) => (i === idx ? { ...b, name: val } : b))
                        );
                      }}
                      placeholder={`Nama ${bidangTerm || 'Bidang'} ${idx + 1}`}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                    <select
                      aria-label={`Warna ${item.name}`}
                      value={item.color}
                      onChange={(e) => {
                        const color = e.target.value as BidangColor;
                        setDraftBidangList((prev) =>
                          prev.map((b, i) => (i === idx ? { ...b, color } : b))
                        );
                      }}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      {(Object.keys(BIDANG_COLOR_MAP) as BidangColor[]).map((c) => (
                        <option key={c} value={c}>
                          {BIDANG_COLOR_MAP[c].label}
                        </option>
                      ))}
                    </select>
                    {draftBidangList.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Hapus ${item.name}`}
                        onClick={() =>
                          setDraftBidangList((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 cursor-pointer"
              >
                Buat &amp; Masuk Ruang
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-12 items-start">
            {/* Daftar Ruang Saya */}
            <div className="lg:col-span-8 space-y-4">
              <h2 className="font-display text-base font-extrabold text-slate-800 dark:text-slate-200">
                Ruang yang Kamu Ikuti ({workspaces.length})
              </h2>

              {workspaces.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
                  <Users className="mx-auto h-10 w-10 text-slate-400" />
                  <h3 className="mt-3 font-display text-base font-bold text-slate-900 dark:text-white">
                    Kamu belum tergabung di ruang mana pun
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Masukkan kode ruang di sebelah kanan (misal <code className="font-mono font-bold">OSIS-SMA1</code> atau{' '}
                    <code className="font-mono font-bold">KELAS-11A</code>) atau buat ruang baru.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {workspaces.map((ws) => {
                    const role = getMemberRole(ws, user.id);
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => onSelectWorkspace(ws)}
                        className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-600 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                            {ws.name}
                          </h3>
                          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-indigo-600 transition-transform shrink-0 mt-1" />
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                          {ws.description}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                          <span className="text-indigo-600 dark:text-indigo-400">
                            {role ? getRoleLabel(role) : 'Anggota'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{ws.members.length} anggota</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{ws.joinCode}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Gabung dengan Kode Ruang */}
            <div className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2.5">
                <KeyRound className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Gabung dengan Kode Ruang
                </h2>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Punya kode undangan dari ketua kelas, pengurus OSIS, atau koordinator tim? Masukkan di sini.
              </p>

              <form onSubmit={handleJoinSubmit} className="mt-4 space-y-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value);
                    if (joinError) setJoinError('');
                  }}
                  placeholder="Contoh: OSIS-SMA1 atau tempel tautan ruang"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                {joinError && (
                  <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{joinError}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={joining}
                  className="w-full min-h-[44px] rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-indigo-600 dark:hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  {joining ? 'Memeriksa kode...' : 'Gabung Ruang'}
                </button>
              </form>

              <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kode Ruang Contoh Siap Pakai:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['OSIS-SMA1', 'KELAS-11A'].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setJoinCode(sample)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
