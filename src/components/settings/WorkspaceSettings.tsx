import { useState } from 'react';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Edit3,
  KeyRound,
  Link2,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { adminResetMemberPassword } from '../../services/authService';
import { generateId } from '../../services/storageService';
import {
  createNewPeriod,
  submitBidangProposal,
  switchActivePeriod,
  updateMemberRole,
  updateWorkspace,
  updateWorkspaceJoinCode,
} from '../../services/workspaceService';
import {
  AccentTheme,
  Bidang,
  BidangColor,
  User,
  Workspace,
  WorkspaceRole,
} from '../../types/ideacard';
import {
  ACCENT_THEME_MAP,
  BIDANG_COLOR_MAP,
  BIDANG_ICONS,
  getBidangIconComponent,
} from '../../utils/themeUtils';

interface WorkspaceSettingsProps {
  workspace: Workspace;
  user: User;
  role: WorkspaceRole;
  onWorkspaceUpdated: (ws: Workspace) => void;
}

const COLOR_CYCLE: BidangColor[] = ['mint', 'sky', 'purple', 'orange', 'coral', 'amber'];

export function WorkspaceSettings({
  workspace,
  user,
  role,
  onWorkspaceUpdated,
}: WorkspaceSettingsProps) {
  const isAdmin = role === 'admin';
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description);
  const [activePrompt, setActivePrompt] = useState(workspace.activePrompt);
  const [accentTheme, setAccentTheme] = useState<AccentTheme>(workspace.accentTheme);
  const [terms, setTerms] = useState(workspace.terms);
  const [savedMsg, setSavedMsg] = useState('');

  // Bidang management (Tambah, Ubah, Urutkan, Atur Jumlah)
  const [newBidangName, setNewBidangName] = useState('');
  const [newBidangColor, setNewBidangColor] = useState<BidangColor>('purple');
  const [newBidangIcon, setNewBidangIcon] = useState('Sparkles');
  const [newBidangPic, setNewBidangPic] = useState('');
  const [proposalReason, setProposalReason] = useState('');
  const [proposalSent, setProposalSent] = useState(false);

  const [editingBidangId, setEditingBidangId] = useState<string | null>(null);
  const [editBidangDraft, setEditBidangDraft] = useState<Bidang | null>(null);

  // Kategori
  const [newCategory, setNewCategory] = useState('');

  // Periode baru
  const [newPeriodName, setNewPeriodName] = useState('');
  const [newPeriodStart, setNewPeriodStart] = useState('2027-01-05');
  const [newPeriodEnd, setNewPeriodEnd] = useState('2027-06-20');

  // Reset password anggota
  const [resetResult, setResetResult] = useState<{
    username: string;
    tempPassword: string;
  } | null>(null);
  const [copiedJoinCode, setCopiedJoinCode] = useState(false);
  const [copiedJoinLink, setCopiedJoinLink] = useState(false);
  const [editingJoinCode, setEditingJoinCode] = useState(false);
  const [joinCodeDraft, setJoinCodeDraft] = useState(workspace.joinCode);
  const [joinCodeError, setJoinCodeError] = useState('');

  function saveGeneralSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    const updated: Workspace = {
      ...workspace,
      name: name.trim() || workspace.name,
      description: description.trim(),
      activePrompt: activePrompt.trim(),
      accentTheme,
      terms,
    };
    updateWorkspace(updated);
    onWorkspaceUpdated(updated);
    setSavedMsg('Pengaturan ruang tersimpan!');
    setTimeout(() => setSavedMsg(''), 2500);
  }

  function handleAddBidang(e: React.FormEvent) {
    e.preventDefault();
    if (!newBidangName.trim()) return;

    if (isAdmin) {
      const added: Bidang = {
        id: generateId('bdg'),
        name: newBidangName.trim(),
        color: newBidangColor,
        icon: newBidangIcon,
        picName: newBidangPic.trim() || 'Koordinator',
      };
      const updated = { ...workspace, bidangList: [...workspace.bidangList, added] };
      updateWorkspace(updated);
      onWorkspaceUpdated(updated);
      setNewBidangName('');
      setNewBidangPic('');
    } else {
      // Anggota inti mengusulkan bidang baru ke admin
      submitBidangProposal({
        workspaceId: workspace.id,
        proposedByUserId: user.id,
        proposedByName: user.displayName || user.username,
        name: newBidangName.trim(),
        color: newBidangColor,
        icon: newBidangIcon,
        reason: proposalReason.trim() || 'Diperlukan untuk menampung aspirasi baru.',
      });
      setNewBidangName('');
      setProposalReason('');
      setProposalSent(true);
      setTimeout(() => setProposalSent(false), 3000);
    }
  }

  function handleSaveEditedBidang(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin || !editBidangDraft || !editBidangDraft.name.trim()) return;
    const updated: Workspace = {
      ...workspace,
      bidangList: workspace.bidangList.map((b) =>
        b.id === editBidangDraft.id
          ? {
              ...editBidangDraft,
              name: editBidangDraft.name.trim(),
              picName: editBidangDraft.picName.trim() || 'Koordinator',
            }
          : b
      ),
    };
    updateWorkspace(updated);
    onWorkspaceUpdated(updated);
    setEditingBidangId(null);
    setEditBidangDraft(null);
  }

  function handleMoveBidang(index: number, direction: -1 | 1) {
    if (!isAdmin) return;
    const target = index + direction;
    if (target < 0 || target >= workspace.bidangList.length) return;
    const nextList = [...workspace.bidangList];
    const [moved] = nextList.splice(index, 1);
    nextList.splice(target, 0, moved);
    const updated = { ...workspace, bidangList: nextList };
    updateWorkspace(updated);
    onWorkspaceUpdated(updated);
  }

  function handleAdjustBidangCount(targetCount: number) {
    if (!isAdmin) return;
    const clamped = Math.max(1, Math.min(20, targetCount));
    const current = workspace.bidangList;
    if (clamped === current.length) return;
    let nextList: Bidang[];
    if (clamped < current.length) {
      nextList = current.slice(0, clamped);
    } else {
      nextList = [...current];
      while (nextList.length < clamped) {
        const idx = nextList.length;
        nextList.push({
          id: generateId('bdg'),
          name: `${workspace.terms.bidangSingular} ${idx + 1}`,
          color: COLOR_CYCLE[idx % COLOR_CYCLE.length],
          icon: 'Layers',
          picName: `Koordinator ${workspace.terms.bidangSingular} ${idx + 1}`,
        });
      }
    }
    const updated = { ...workspace, bidangList: nextList };
    updateWorkspace(updated);
    onWorkspaceUpdated(updated);
  }

  function handleRemoveBidang(bidangId: string) {
    if (!isAdmin || workspace.bidangList.length <= 1) return;
    const updated = {
      ...workspace,
      bidangList: workspace.bidangList.filter((b) => b.id !== bidangId),
    };
    updateWorkspace(updated);
    onWorkspaceUpdated(updated);
  }

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin || !newCategory.trim()) return;
    if (workspace.categories.includes(newCategory.trim())) return;
    const updated = {
      ...workspace,
      categories: [...workspace.categories, newCategory.trim()],
    };
    updateWorkspace(updated);
    onWorkspaceUpdated(updated);
    setNewCategory('');
  }

  function handleRemoveCategory(cat: string) {
    if (!isAdmin || workspace.categories.length <= 1) return;
    const updated = {
      ...workspace,
      categories: workspace.categories.filter((c) => c !== cat),
    };
    updateWorkspace(updated);
    onWorkspaceUpdated(updated);
  }

  function handleCreatePeriod(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin || !newPeriodName.trim()) return;
    const updated = createNewPeriod(workspace.id, newPeriodName, newPeriodStart, newPeriodEnd);
    if (updated) {
      onWorkspaceUpdated(updated);
      setNewPeriodName('');
    }
  }

  async function handleResetMemberPass(memberUserId: string, username: string) {
    const res = await adminResetMemberPassword(memberUserId);
    if ('tempPassword' in res) {
      setResetResult({ username, tempPassword: res.tempPassword });
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Pengaturan Ruang &amp; Kustomisasi
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Sesuaikan istilah, {workspace.terms.bidangSingular.toLowerCase()}, kategori, periode,
            dan tema warna sesuai karakter kelompokmu.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {editingJoinCode && isAdmin ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setJoinCodeError('');
                const res = updateWorkspaceJoinCode(workspace.id, joinCodeDraft);
                if ('error' in res) {
                  setJoinCodeError(res.error);
                  return;
                }
                onWorkspaceUpdated(res.workspace);
                setJoinCodeDraft(res.workspace.joinCode);
                setEditingJoinCode(false);
              }}
              className="flex flex-wrap items-center gap-2 rounded-2xl border border-indigo-300 bg-white px-3 py-2 dark:border-indigo-700 dark:bg-slate-900"
            >
              <span className="text-xs font-semibold text-slate-500">Kode:</span>
              <input
                type="text"
                value={joinCodeDraft}
                onChange={(e) => {
                  setJoinCodeDraft(e.target.value);
                  setJoinCodeError('');
                }}
                placeholder="MISAL: OSIS-SMA2"
                className="w-36 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 font-mono text-xs font-bold uppercase text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Check className="h-3.5 w-3.5" />
                Simpan
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingJoinCode(false);
                  setJoinCodeDraft(workspace.joinCode);
                  setJoinCodeError('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Batal ubah kode ruang"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-500">Kode Gabung:</span>
              <code className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {workspace.joinCode}
              </code>
              <button
                type="button"
                title="Salin kode ruang"
                onClick={() => {
                  navigator.clipboard?.writeText(workspace.joinCode);
                  setCopiedJoinCode(true);
                  setTimeout(() => setCopiedJoinCode(false), 1800);
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedJoinCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedJoinCode ? 'Tersalin' : 'Salin'}
              </button>
              <button
                type="button"
                title="Salin tautan gabung ruang"
                onClick={() => {
                  const link = `${window.location.origin}/?ruang=${encodeURIComponent(workspace.joinCode)}`;
                  navigator.clipboard?.writeText(link);
                  setCopiedJoinLink(true);
                  setTimeout(() => setCopiedJoinLink(false), 1800);
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedJoinLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Link2 className="h-3.5 w-3.5" />}
                {copiedJoinLink ? 'Tautan Tersalin' : 'Tautan'}
              </button>
              {isAdmin && (
                <button
                  type="button"
                  title="Ubah kode gabung"
                  onClick={() => {
                    setJoinCodeDraft(workspace.joinCode);
                    setJoinCodeError('');
                    setEditingJoinCode(true);
                  }}
                  className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                  aria-label="Ubah kode ruang"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          {joinCodeError && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {joinCodeError}
            </p>
          )}
        </div>
      </div>

      {/* Umum, Pemantik, Istilah & Tema Warna */}
      {isAdmin && (
        <form
          onSubmit={saveGeneralSettings}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
              Identitas Ruang, Istilah &amp; Tema
            </h2>
            {savedMsg && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {savedMsg}
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Nama Ruang
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Deskripsi Ruang
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
              Pertanyaan Pemantik Aktif
            </label>
            <input
              type="text"
              value={activePrompt}
              onChange={(e) => setActivePrompt(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Istilah Program
              </label>
              <input
                type="text"
                value={terms.programSingular}
                onChange={(e) =>
                  setTerms({
                    ...terms,
                    programSingular: e.target.value,
                    programPlural: e.target.value,
                  })
                }
                placeholder="Proker / Program / Proyek"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Istilah Bidang
              </label>
              <input
                type="text"
                value={terms.bidangSingular}
                onChange={(e) => setTerms({ ...terms, bidangSingular: e.target.value })}
                placeholder="Sekbid / Divisi / Seksi"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Istilah Anggota
              </label>
              <input
                type="text"
                value={terms.memberSingular}
                onChange={(e) => setTerms({ ...terms, memberSingular: e.target.value })}
                placeholder="Siswa / Anggota"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Istilah Rapat
              </label>
              <input
                type="text"
                value={terms.meetingName}
                onChange={(e) => setTerms({ ...terms, meetingName: e.target.value })}
                placeholder="Rapat Pleno / Forum Kelas"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
              Tema Warna Aksen Ruang
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ACCENT_THEME_MAP) as AccentTheme[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAccentTheme(key)}
                  className={`min-h-[38px] rounded-xl border px-3.5 py-1.5 text-xs font-bold cursor-pointer ${
                    accentTheme === key
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                      : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {ACCENT_THEME_MAP[key].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              Simpan Perubahan Ruang
            </button>
          </div>
        </form>
      )}

      {/* Kelola / Usulkan Bidang */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
              Daftar {workspace.terms.bidangSingular} ({workspace.bidangList.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAdmin
                ? `Sesuaikan jumlah, urutan, dan nama ${workspace.terms.bidangSingular.toLowerCase()} sesuai struktur sekolah atau kelompokmu.`
                : 'Sebagai Anggota Inti, kamu dapat mengusulkan bidang baru agar disetujui Admin.'}
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Jumlah {workspace.terms.bidangSingular}:
              </span>
              <button
                type="button"
                aria-label="Kurangi jumlah bidang"
                onClick={() => handleAdjustBidangCount(workspace.bidangList.length - 1)}
                disabled={workspace.bidangList.length <= 1}
                className="h-8 w-8 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
              >
                -
              </button>
              <span className="w-6 text-center font-mono text-sm font-extrabold tabular-nums text-slate-900 dark:text-white">
                {workspace.bidangList.length}
              </span>
              <button
                type="button"
                aria-label="Tambah jumlah bidang"
                onClick={() => handleAdjustBidangCount(workspace.bidangList.length + 1)}
                disabled={workspace.bidangList.length >= 20}
                className="h-8 w-8 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
              >
                +
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workspace.bidangList.map((b, idx) => {
            const colorCfg = BIDANG_COLOR_MAP[b.color];
            const IconComp = getBidangIconComponent(b.icon);
            const isEditing = editingBidangId === b.id && editBidangDraft;

            if (isEditing && editBidangDraft) {
              return (
                <form
                  key={b.id}
                  onSubmit={handleSaveEditedBidang}
                  className="rounded-2xl border border-indigo-300 bg-indigo-50/40 p-4 dark:border-indigo-700 dark:bg-indigo-950/30 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300">
                      Ubah {workspace.terms.bidangSingular} #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBidangId(null);
                        setEditBidangDraft(null);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={editBidangDraft.name}
                    onChange={(e) =>
                      setEditBidangDraft({ ...editBidangDraft, name: e.target.value })
                    }
                    placeholder="Nama bidang"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  <input
                    type="text"
                    value={editBidangDraft.picName}
                    onChange={(e) =>
                      setEditBidangDraft({ ...editBidangDraft, picName: e.target.value })
                    }
                    placeholder="Penanggung jawab"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={editBidangDraft.color}
                      onChange={(e) =>
                        setEditBidangDraft({
                          ...editBidangDraft,
                          color: e.target.value as BidangColor,
                        })
                      }
                      className="rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      {(Object.keys(BIDANG_COLOR_MAP) as BidangColor[]).map((c) => (
                        <option key={c} value={c}>
                          {BIDANG_COLOR_MAP[c].label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editBidangDraft.icon}
                      onChange={(e) =>
                        setEditBidangDraft({ ...editBidangDraft, icon: e.target.value })
                      }
                      className="rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      {BIDANG_ICONS.map((ic) => (
                        <option key={ic.name} value={ic.name}>
                          {ic.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Simpan
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={b.id}
                className={`flex items-center justify-between gap-2 rounded-2xl border p-4 ${colorCfg.stickyBg} ${colorCfg.stickyBorder}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-900/70 ${colorCfg.text} shrink-0`}>
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-extrabold text-slate-900 dark:text-white">
                      {idx + 1}. {b.name}
                    </p>
                    <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                      PJ: {b.picName}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      aria-label={`Naikkan urutan ${b.name}`}
                      disabled={idx === 0}
                      onClick={() => handleMoveBidang(idx, -1)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Turunkan urutan ${b.name}`}
                      disabled={idx === workspace.bidangList.length - 1}
                      onClick={() => handleMoveBidang(idx, 1)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Ubah ${b.name}`}
                      onClick={() => {
                        setEditingBidangId(b.id);
                        setEditBidangDraft({ ...b });
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    {workspace.bidangList.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Hapus ${b.name}`}
                        onClick={() => handleRemoveBidang(b.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleAddBidang} className="grid gap-3 sm:grid-cols-12 border-t border-slate-100 pt-4 dark:border-slate-800">
          <input
            type="text"
            required
            value={newBidangName}
            onChange={(e) => setNewBidangName(e.target.value)}
            placeholder={`Nama ${workspace.terms.bidangSingular.toLowerCase()} baru...`}
            className="sm:col-span-4 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
          <select
            value={newBidangColor}
            onChange={(e) => setNewBidangColor(e.target.value as BidangColor)}
            className="sm:col-span-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            {(Object.keys(BIDANG_COLOR_MAP) as BidangColor[]).map((c) => (
              <option key={c} value={c}>
                {BIDANG_COLOR_MAP[c].label}
              </option>
            ))}
          </select>
          <select
            value={newBidangIcon}
            onChange={(e) => setNewBidangIcon(e.target.value)}
            className="sm:col-span-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            {BIDANG_ICONS.map((ic) => (
              <option key={ic.name} value={ic.name}>
                {ic.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={isAdmin ? newBidangPic : proposalReason}
            onChange={(e) =>
              isAdmin ? setNewBidangPic(e.target.value) : setProposalReason(e.target.value)
            }
            placeholder={isAdmin ? 'Penanggung jawab' : 'Alasan usulan bidang'}
            className="sm:col-span-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
          <button
            type="submit"
            className="sm:col-span-2 inline-flex min-h-[38px] items-center justify-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white dark:bg-indigo-600 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            {isAdmin ? 'Tambah' : 'Usulkan'}
          </button>
          {proposalSent && (
            <p className="sm:col-span-12 text-xs font-bold text-emerald-600">
              Usulan {workspace.terms.bidangSingular.toLowerCase()} terkirim ke Admin untuk ditinjau!
            </p>
          )}
        </form>
      </section>

      {/* Kategori & Periode Arsip */}
      {isAdmin && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
              Kategori Ide
            </h2>
            <div className="flex flex-wrap gap-2">
              {workspace.categories.map((cat) => (
                <div
                  key={cat}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <span>{cat}</span>
                  {workspace.categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={handleAddCategory} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Tambah kategori baru..."
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white dark:bg-indigo-600 cursor-pointer"
              >
                Tambah
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-amber-600" />
              <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                Periode &amp; Arsip
              </h2>
            </div>

            <div className="space-y-2">
              {workspace.periods.map((prd) => (
                <div
                  key={prd.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs dark:border-slate-800"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{prd.name}</p>
                    <p className="text-slate-500">
                      {prd.startDate} s/d {prd.endDate}
                    </p>
                  </div>
                  {prd.id === workspace.activePeriodId ? (
                    <span className="font-bold text-emerald-600">Periode Aktif</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = switchActivePeriod(workspace.id, prd.id);
                        if (updated) onWorkspaceUpdated(updated);
                      }}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      Aktifkan
                    </button>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleCreatePeriod} className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <input
                type="text"
                value={newPeriodName}
                onChange={(e) => setNewPeriodName(e.target.value)}
                placeholder="Nama periode baru (mis. Genap 2027)"
                className="col-span-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <input
                type="date"
                value={newPeriodStart}
                onChange={(e) => setNewPeriodStart(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <input
                type="date"
                value={newPeriodEnd}
                onChange={(e) => setNewPeriodEnd(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="submit"
                className="col-span-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white dark:bg-indigo-600 cursor-pointer"
              >
                Arsipkan Periode Sekarang &amp; Mulai Periode Baru
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Manajemen Anggota & Reset Password */}
      {isAdmin && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
              Anggota Ruang &amp; Reset Password ({workspace.members.length})
            </h2>
          </div>

          {resetResult && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              <span>
                Password sementara untuk <strong>@{resetResult.username}</strong>:{' '}
                <code className="font-mono font-bold text-sm">{resetResult.tempPassword}</code>{' '}
                (berikan langsung kepada yang bersangkutan).
              </span>
              <button
                type="button"
                onClick={() => setResetResult(null)}
                className="font-bold underline cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {workspace.members.map((m) => (
              <div
                key={m.userId}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {m.displayName}{' '}
                    <span className="font-mono text-xs font-normal text-slate-500">
                      @{m.username}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={m.role}
                    disabled={m.userId === user.id}
                    onChange={(e) => {
                      const updated = updateMemberRole(
                        workspace.id,
                        m.userId,
                        e.target.value as WorkspaceRole,
                        m.bidangId
                      );
                      if (updated) onWorkspaceUpdated(updated);
                    }}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <option value="admin">Pemilik / Admin</option>
                    <option value="pengelola">Pengelola / Anggota Inti</option>
                    <option value="anggota">Anggota / Siswa</option>
                    <option value="pengamat">Pengamat / Pembina</option>
                  </select>

                  {m.userId !== user.id && (
                    <button
                      type="button"
                      onClick={() => handleResetMemberPass(m.userId, m.username)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Reset Password
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
