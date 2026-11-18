import { useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  Flag,
  FolderPlus,
  Heart,
  MessageCircle,
  MessageSquarePlus,
  Plus,
  Send,
  ShieldAlert,
} from 'lucide-react';
import {
  addIdeaComment,
  addIdeaExtension,
  submitViolationReport,
  toggleVoteIdea,
  updateIdeaStatus,
} from '../../services/ideaService';
import {
  Idea,
  IdeaStatus,
  User,
  Workspace,
  WorkspaceRole,
} from '../../types/ideacard';
import {
  BIDANG_COLOR_MAP,
  formatDateId,
  getIdeaStatusTextColor,
} from '../../utils/themeUtils';

interface IdeaDetailViewProps {
  idea: Idea;
  workspace: Workspace;
  user: User | null;
  role: WorkspaceRole | null;
  isGuest: boolean;
  onBack: () => void;
  onIdeaUpdated: (updated: Idea) => void;
  onConvertToProgram: (idea: Idea) => void;
}

export function IdeaDetailView({
  idea,
  workspace,
  user,
  role,
  isGuest,
  onBack,
  onIdeaUpdated,
  onConvertToProgram,
}: IdeaDetailViewProps) {
  const [additionText, setAdditionText] = useState('');
  const [additionAnon, setAdditionAnon] = useState(false);
  const [additionError, setAdditionError] = useState('');

  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentSuccess, setCommentSuccess] = useState('');

  const [statusChoice, setStatusChoice] = useState<IdeaStatus>(idea.status);
  const [statusReason, setStatusReason] = useState(idea.statusReason || '');
  const [statusSavedMsg, setStatusSavedMsg] = useState('');

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);

  const bidang = workspace.bidangList.find((b) => b.id === idea.bidangId);
  const colorCfg = bidang ? BIDANG_COLOR_MAP[bidang.color] : BIDANG_COLOR_MAP.purple;
  const hasVoted = user ? idea.votes.includes(user.id) : false;
  const canManage = role === 'admin' || role === 'pengelola';

  function handleVote() {
    if (!user || isGuest) return;
    const updated = toggleVoteIdea(idea.id, user.id);
    if (updated) onIdeaUpdated(updated);
  }

  function handleAddExtension(e: React.FormEvent) {
    e.preventDefault();
    if (!user || isGuest || !additionText.trim()) return;
    setAdditionError('');
    const res = addIdeaExtension({
      ideaId: idea.id,
      user,
      content: additionText,
      isAnonymous: additionAnon,
    });
    if ('error' in res) {
      setAdditionError(res.error);
      return;
    }
    setAdditionText('');
    onIdeaUpdated(res.idea);
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || isGuest || !role || !commentText.trim()) return;
    setCommentError('');
    setCommentSuccess('');
    const autoApprove = role === 'admin' || role === 'pengelola' || role === 'pengamat';
    const res = addIdeaComment({
      ideaId: idea.id,
      user,
      role,
      content: commentText,
      isAdvisorNote: role === 'pengamat',
      autoApprove,
    });
    if ('error' in res) {
      setCommentError(res.error);
      return;
    }
    setCommentText('');
    setCommentSuccess(
      autoApprove
        ? 'Tanggapan berhasil ditambahkan.'
        : 'Komentar terkirim dan menunggu persetujuan moderator.'
    );
    onIdeaUpdated(res.idea);
  }

  function handleStatusSave(e: React.FormEvent) {
    e.preventDefault();
    const updated = updateIdeaStatus(idea.id, statusChoice, statusReason);
    if (updated) {
      onIdeaUpdated(updated);
      setStatusSavedMsg('Status diperbarui');
      setTimeout(() => setStatusSavedMsg(''), 2500);
    }
  }

  function handleSubmitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !reportReason.trim()) return;
    submitViolationReport({
      workspaceId: workspace.id,
      ideaId: idea.id,
      reportedByUserId: user.id,
      reportedByName: user.displayName || user.username,
      reason: reportReason.trim(),
    });
    setReportSent(true);
    setReportReason('');
    setTimeout(() => {
      setReportOpen(false);
      setReportSent(false);
    }, 1500);
  }

  const visibleComments = idea.comments.filter(
    (c) => c.moderationStatus === 'disetujui' || canManage || c.authorId === user?.id
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        {!isGuest && user && (
          <button
            type="button"
            onClick={() => setReportOpen(!reportOpen)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/30 cursor-pointer"
          >
            <Flag className="h-3.5 w-3.5" />
            Laporkan Kartu Ide
          </button>
        )}
      </div>

      {reportOpen && (
        <form
          onSubmit={handleSubmitReport}
          className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/50 dark:bg-rose-950/30 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-rose-800 dark:text-rose-200">
            <ShieldAlert className="h-4 w-4" />
            Laporkan Pelanggaran / Perundungan
          </div>
          <p className="text-xs text-rose-700 dark:text-rose-300">
            Laporan akan ditinjau Admin Ruang. Jika ide anonim melanggar aturan berat, admin dapat meninjau
            identitas pengirim dari brankas terpisah.
          </p>
          <textarea
            required
            rows={2}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Jelaskan alasan laporan..."
            className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-rose-800 dark:bg-slate-950 dark:text-white"
          />
          <div className="flex items-center justify-end gap-2">
            {reportSent && (
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Laporan terkirim ke moderator!
              </span>
            )}
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer"
            >
              Kirim Laporan
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Kartu Ide Utama + Tambahan Ide + Komentar */}
        <div className="lg:col-span-8 space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <span className={`h-2.5 w-2.5 rounded-full ${colorCfg.dot}`} />
                {bidang?.name || 'Umum'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{idea.category}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{idea.proposalType}</span>
              <span aria-hidden="true">·</span>
              <span className={`font-bold ${getIdeaStatusTextColor(idea.status)}`}>
                Status: {idea.status}
              </span>
            </div>

            <h1 className="mt-3 font-display text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
              {idea.title}
            </h1>

            <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-slate-700 dark:text-slate-300">
              {idea.content}
            </p>

            {idea.estimatedBenefit && (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Perkiraan Manfaat
                </p>
                <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                  {idea.estimatedBenefit}
                </p>
              </div>
            )}

            {idea.statusReason && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                <strong>Catatan Status ({idea.status}):</strong> {idea.statusReason}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Pengirim:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {idea.authorDisplayName}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>{formatDateId(idea.createdAt)}</span>
                {idea.wantOralDiscussion && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Siap dibahas lisan di {workspace.terms.meetingName}
                    </span>
                  </>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.94 }}
                type="button"
                disabled={isGuest}
                onClick={handleVote}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold transition-colors cursor-pointer disabled:opacity-60 ${
                  hasVoted
                    ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                <Heart className={`h-4 w-4 ${hasVoted ? 'fill-current' : ''}`} />
                <span className="tabular-nums">{idea.votes.length}</span>
                <span>Dukung</span>
              </motion.button>
            </div>
          </article>

          {/* Kembangkan Ide ("Tambahan Ide") */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2.5">
              <MessageSquarePlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                Kembangkan Ide — Tambahan Gagasan ({idea.additions.length})
              </h2>
            </div>
            <p className="mt-1.5 rounded-xl bg-emerald-50/70 px-3.5 py-2.5 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
              Aturan Brainwriting: Hanya menambah dan membangun ide ini menjadi lebih matang (misal cara
              pelaksanaan, kolaborasi, atau alat bantu). Dilarang mengkritik atau menyerang pribadi.
            </p>

            <div className="mt-4 space-y-3">
              {idea.additions.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  Belum ada tambahan gagasan. Jadilah yang pertama memperkaya ide ini!
                </p>
              ) : (
                idea.additions.map((add, idx) => (
                  <div
                    key={add.id}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Tambahan #{idx + 1} · {add.authorDisplay}
                      </span>
                      <span>{formatDateId(add.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {add.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {!isGuest && role !== 'pengamat' && (
              <form onSubmit={handleAddExtension} className="mt-5 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                {additionError && (
                  <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{additionError}</span>
                  </div>
                )}
                <textarea
                  rows={2}
                  value={additionText}
                  onChange={(e) => setAdditionText(e.target.value)}
                  placeholder="Tambahkan ide lanjutan yang membangun... (contoh: Bisa ditambah sistem kupon atau bekerja sama dengan...)"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={additionAnon}
                      onChange={(e) => setAdditionAnon(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                    Tambahkan sebagai anonim
                  </label>
                  <button
                    type="submit"
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Kirim Tambahan Ide
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Komentar Membangun & Catatan Pembina */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
              Diskusi &amp; Catatan ({visibleComments.length})
            </h2>

            <div className="mt-4 space-y-3">
              {visibleComments.length === 0 ? (
                <p className="py-3 text-sm text-slate-500 dark:text-slate-400">
                  Belum ada catatan atau komentar yang tayang.
                </p>
              ) : (
                visibleComments.map((cmt) => (
                  <div
                    key={cmt.id}
                    className={`rounded-2xl border p-4 ${
                      cmt.isAdvisorNote
                        ? 'border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/30'
                        : 'border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {cmt.authorDisplay}{' '}
                        {cmt.isAdvisorNote && (
                          <span className="ml-1 font-bold text-amber-700 dark:text-amber-300">
                            · Catatan Pembina / Pengamat
                          </span>
                        )}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {cmt.moderationStatus === 'menunggu' ? 'Menunggu moderasi · ' : ''}
                        {formatDateId(cmt.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">
                      {cmt.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {!isGuest && (
              <form onSubmit={handleAddComment} className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                {commentError && (
                  <p className="text-xs font-bold text-rose-600">{commentError}</p>
                )}
                {commentSuccess && (
                  <p className="text-xs font-bold text-emerald-600">{commentSuccess}</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={
                      role === 'pengamat'
                        ? 'Tulis catatan atau arahan pembina...'
                        : 'Tulis tanggapan membangun (melalui moderasi)...'
                    }
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 cursor-pointer shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Kirim
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>

        {/* Panel Pengelola / Admin & Info Kelompok */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
              Pengelompokan &amp; Tindak Lanjut
            </h3>
            <dl className="mt-3 space-y-2.5 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Klaster Tema</dt>
                <dd className="font-bold text-slate-900 dark:text-white text-right">
                  {idea.themeGroup}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Moderasi</dt>
                <dd className="font-bold capitalize text-slate-900 dark:text-white">
                  {idea.moderationStatus}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Dukungan</dt>
                <dd className="font-bold tabular-nums text-slate-900 dark:text-white">
                  {idea.votes.length} {workspace.terms.memberSingular}
                </dd>
              </div>
            </dl>
          </div>

          {canManage && !isGuest && (
            <form
              onSubmit={handleStatusSave}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4"
            >
              <h3 className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
                Kelola Status Ide
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Ubah Status
                </label>
                <select
                  value={statusChoice}
                  onChange={(e) => setStatusChoice(e.target.value as IdeaStatus)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {workspace.statuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Alasan / Catatan Tindak Lanjut
                </label>
                <textarea
                  rows={2}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Wajib diisi jika ditunda atau ditolak agar pengirim tahu alasannya..."
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="submit"
                  className="min-h-[40px] rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
                >
                  Simpan Status
                </button>
                {statusSavedMsg && (
                  <span className="text-xs font-bold text-emerald-600">{statusSavedMsg}</span>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onConvertToProgram(idea)}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300 cursor-pointer"
                >
                  <FolderPlus className="h-4 w-4" />
                  Jadikan {workspace.terms.programSingular} Baru
                </button>
              </div>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
