import { useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  EyeOff,
  MessageCircle,
  Send,
  Settings2,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { createIdea, saveReflection } from '../../services/ideaService';
import { generateId } from '../../services/storageService';
import { updateWorkspace } from '../../services/workspaceService';
import { Bidang, BidangColor, Idea, ProposalType, User, Workspace, WorkspaceRole } from '../../types/ideacard';
import { BIDANG_COLOR_MAP } from '../../utils/themeUtils';

interface IdeaFormModalProps {
  workspace: Workspace;
  user: User;
  role: WorkspaceRole;
  onClose: () => void;
  onCreated: (idea: Idea) => void;
  onWorkspaceUpdated?: (ws: Workspace) => void;
}

const PROPOSAL_TYPE_LABELS: { value: ProposalType; label: string }[] = [
  { value: 'program', label: 'Program / Kegiatan Rutin' },
  { value: 'acara', label: 'Acara / Event Khusus' },
  { value: 'perbaikan', label: 'Perbaikan Fasilitas / Aturan' },
  { value: 'lainnya', label: 'Lainnya' },
];

const COLOR_CYCLE: BidangColor[] = ['mint', 'sky', 'purple', 'orange', 'coral', 'amber'];

export function IdeaFormModal({
  workspace,
  user,
  role,
  onClose,
  onCreated,
  onWorkspaceUpdated,
}: IdeaFormModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(workspace.categories[0] || 'Solusi');
  const [bidangId, setBidangId] = useState(workspace.bidangList[0]?.id || '');
  const [proposalType, setProposalType] = useState<ProposalType>('program');
  const [estimatedBenefit, setEstimatedBenefit] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [showAuthorNameInPublic, setShowAuthorNameInPublic] = useState(true);
  const [wantOralDiscussion, setWantOralDiscussion] = useState(false);
  const [error, setError] = useState('');

  // Step 2: Refleksi Singkat 1-5 setelah kirim ide
  const [submittedIdea, setSubmittedIdea] = useState<Idea | null>(null);
  const [comfortScore, setComfortScore] = useState<number>(5);
  const [safetyScore, setSafetyScore] = useState<number>(5);

  // Kustomisasi cepat Sekbid/Bidang oleh Admin langsung dari form tulis ide
  const [editingBidangOpen, setEditingBidangOpen] = useState(false);
  const [bidangDraft, setBidangDraft] = useState<Bidang[]>(() =>
    workspace.bidangList.map((b) => ({ ...b }))
  );

  function handleDraftCountChange(targetCount: number) {
    const clamped = Math.max(1, Math.min(20, targetCount));
    if (clamped === bidangDraft.length) return;
    if (clamped < bidangDraft.length) {
      setBidangDraft(bidangDraft.slice(0, clamped));
      return;
    }
    const next = [...bidangDraft];
    while (next.length < clamped) {
      const idx = next.length;
      next.push({
        id: generateId('bdg'),
        name: `${workspace.terms.bidangSingular} ${idx + 1}`,
        color: COLOR_CYCLE[idx % COLOR_CYCLE.length],
        icon: 'Layers',
        picName: `Koordinator ${idx + 1}`,
      });
    }
    setBidangDraft(next);
  }

  function handleSaveInlineBidang() {
    const cleaned = bidangDraft.map((b, idx) => ({
      ...b,
      name: b.name.trim() || `${workspace.terms.bidangSingular} ${idx + 1}`,
    }));
    if (cleaned.length === 0) return;
    const updatedWs: Workspace = { ...workspace, bidangList: cleaned };
    updateWorkspace(updatedWs);
    if (onWorkspaceUpdated) onWorkspaceUpdated(updatedWs);
    if (!cleaned.some((b) => b.id === bidangId)) {
      setBidangId(cleaned[0].id);
    }
    setEditingBidangOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (title.trim().length < 5) {
      setError('Judul ide minimal 5 karakter agar mudah dipahami pembaca.');
      return;
    }
    if (content.trim().length < 15) {
      setError('Jelaskan idemu minimal 15 karakter.');
      return;
    }

    const res = createIdea({
      workspaceId: workspace.id,
      periodId: workspace.activePeriodId,
      user,
      title,
      content,
      category,
      bidangId,
      proposalType,
      estimatedBenefit: estimatedBenefit || 'Memberi manfaat positif bagi kelompok.',
      isAnonymous,
      showAuthorNameInPublic: isAnonymous ? false : showAuthorNameInPublic,
      wantOralDiscussion,
      autoApproveModeration: role === 'admin',
    });

    if ('error' in res) {
      setError(res.error);
      return;
    }
    setSubmittedIdea(res.idea);
  }

  function handleFinishReflection() {
    if (!submittedIdea) return;
    saveReflection({
      workspaceId: workspace.id,
      userId: user.id,
      ideaId: submittedIdea.id,
      comfortScore,
      safetyScore,
    });
    onCreated(submittedIdea);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        {submittedIdea ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">
                    Kartu Idemu Berhasil Dikirim!
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {submittedIdea.moderationStatus === 'disetujui'
                      ? 'Idemu langsung tayang dan siap dikembangkan anggota lain.'
                      : 'Idemu masuk antrean moderasi singkat sebelum tampil di Dashboard Publik.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onCreated(submittedIdea);
                  onClose();
                }}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/60 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-900 dark:text-indigo-200">
                <Sparkles className="h-4 w-4" />
                Refleksi Singkat (Opsional, 10 detik)
              </div>
              <p className="mt-1 text-xs text-indigo-800/80 dark:text-indigo-300/80">
                Bantu pengelola ruang memastikan suasana diskusi tetap aman dan ramah bagi semua.
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                    1. Saya nyaman menyampaikan ide di ruang ini
                  </label>
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setComfortScore(num)}
                        className={`min-h-[44px] rounded-xl border text-sm font-bold transition-colors cursor-pointer tabular-nums ${
                          comfortScore === num
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                    <span>1 · Kurang nyaman</span>
                    <span>5 · Sangat nyaman</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                    2. Saya tidak takut diejek saat menulis gagasan
                  </label>
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSafetyScore(num)}
                        className={`min-h-[44px] rounded-xl border text-sm font-bold transition-colors cursor-pointer tabular-nums ${
                          safetyScore === num
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                    <span>1 · Masih khawatir</span>
                    <span>5 · Merasa sangat aman</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  onCreated(submittedIdea);
                  onClose();
                }}
                className="min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                Lewati
              </button>
              <button
                type="button"
                onClick={handleFinishReflection}
                className="min-h-[44px] rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 cursor-pointer"
              >
                Simpan Refleksi &amp; Selesai
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h2 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">
                  Tulis Kartu Ide Baru
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Ruang: {workspace.name} · Tidak ada ide yang dianggap terlalu kecil.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup form"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {workspace.activePrompt && (
              <div className="rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-700 dark:bg-slate-950/70 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  Pemantik Saat Ini:{' '}
                </span>
                {workspace.activePrompt}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                Judul Singkat Ide
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="contoh: Sudut Tukar Buku di Selasar Perpustakaan"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                Ceritakan Gagasanmu
              </label>
              <textarea
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Apa masalah yang ingin dijawab dan bagaimana idemu bisa berjalan?"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {workspace.categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {workspace.terms.bidangSingular} Terkait
                  </label>
                  {role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setBidangDraft(workspace.bidangList.map((b) => ({ ...b })));
                        setEditingBidangOpen(!editingBidangOpen);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
                    >
                      <Settings2 className="h-3 w-3" />
                      {editingBidangOpen ? 'Tutup' : 'Sesuaikan'}
                    </button>
                  )}
                </div>
                <select
                  value={bidangId}
                  onChange={(e) => setBidangId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {workspace.bidangList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Jenis Usulan
                </label>
                <select
                  value={proposalType}
                  onChange={(e) => setProposalType(e.target.value as ProposalType)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {PROPOSAL_TYPE_LABELS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {role === 'admin' && editingBidangOpen && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200">
                      Sesuaikan Jumlah &amp; Nama {workspace.terms.bidangSingular}
                    </p>
                    <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                      Perubahan langsung tersimpan untuk seluruh anggota ruang ini.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Jumlah:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDraftCountChange(bidangDraft.length - 1)}
                      disabled={bidangDraft.length <= 1}
                      className="h-7 w-7 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-mono text-xs font-extrabold tabular-nums text-slate-900 dark:text-white">
                      {bidangDraft.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDraftCountChange(bidangDraft.length + 1)}
                      disabled={bidangDraft.length >= 20}
                      className="h-7 w-7 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 max-h-52 overflow-y-auto pr-1">
                  {bidangDraft.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 rounded-xl border border-indigo-200/70 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <span className="w-5 text-center font-mono text-[11px] font-bold text-slate-400 shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBidangDraft((prev) =>
                            prev.map((b, i) => (i === idx ? { ...b, name: val } : b))
                          );
                        }}
                        placeholder={`Nama ${workspace.terms.bidangSingular} ${idx + 1}`}
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      />
                      <select
                        aria-label={`Warna ${item.name}`}
                        value={item.color}
                        onChange={(e) => {
                          const color = e.target.value as BidangColor;
                          setBidangDraft((prev) =>
                            prev.map((b, i) => (i === idx ? { ...b, color } : b))
                          );
                        }}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-1 text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                      >
                        {(Object.keys(BIDANG_COLOR_MAP) as BidangColor[]).map((c) => (
                          <option key={c} value={c}>
                            {BIDANG_COLOR_MAP[c].label}
                          </option>
                        ))}
                      </select>
                      {bidangDraft.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setBidangDraft((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBidangOpen(false)}
                    className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInlineBidang}
                    className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Simpan Daftar {workspace.terms.bidangSingular}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                Perkiraan Manfaat
              </label>
              <input
                type="text"
                value={estimatedBenefit}
                onChange={(e) => setEstimatedBenefit(e.target.value)}
                placeholder="contoh: Mengurangi sampah plastik dan membuat kantin lebih bersih"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            {/* Opsi Privasi & Diskusi */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-sm">
                  <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <EyeOff className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Kirim sebagai Anonim
                  </span>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    Namamu tidak akan tampil ke anggota lain maupun di Dashboard Publik.{' '}
                    <strong className="text-slate-700 dark:text-slate-300">Catatan jujur:</strong>{' '}
                    anonim berarti nama disembunyikan, bukan jaminan mutlak identitas tidak bisa ditebak
                    dari gaya penulisan. Identitas disimpan terpisah dan hanya bisa dibuka admin bila
                    terjadi laporan pelanggaran.
                  </p>
                </div>
              </label>

              {!isAnonymous && (
                <label className="flex items-start gap-3 border-t border-slate-200/80 pt-3 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAuthorNameInPublic}
                    onChange={(e) => setShowAuthorNameInPublic(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold">Izinkan namaku tampil di Dashboard Publik</span> — jika
                    tidak dicentang, ide ini hanya tampil di riwayat pribadimu dan daftar moderasi.
                  </div>
                </label>
              )}

              <label className="flex items-start gap-3 border-t border-slate-200/80 pt-3 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantOralDiscussion}
                  onChange={(e) => setWantOralDiscussion(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-sm">
                  <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                    Mau dibahas lisan di {workspace.terms.meetingName}
                  </span>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Menandai bahwa kamu siap ikut menjelaskan ide ini saat diskusi nyata berlangsung.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Dilindungi filter kata kasar &amp; moderasi ruang</span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  Kirim Kartu Ide
                </button>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
