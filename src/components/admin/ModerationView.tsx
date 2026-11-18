import { useState } from 'react';
import {
  Check,
  Eye,
  Flag,
  Layers,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  getIdeasByWorkspace,
  getReportsByWorkspace,
  moderateComment,
  resolveReport,
  revealAnonymousAuthorForReport,
  updateIdeaModeration,
} from '../../services/ideaService';
import {
  getBidangProposals,
  resolveBidangProposal,
} from '../../services/workspaceService';
import { Idea, User, Workspace, WorkspaceRole } from '../../types/ideacard';
import { BIDANG_COLOR_MAP, formatDateId } from '../../utils/themeUtils';

interface ModerationViewProps {
  workspace: Workspace;
  user: User;
  role: WorkspaceRole;
  onSelectIdea: (idea: Idea) => void;
  onWorkspaceUpdated: () => void;
  onRefresh: () => void;
}

export function ModerationView({
  workspace,
  user,
  role,
  onSelectIdea,
  onWorkspaceUpdated,
  onRefresh,
}: ModerationViewProps) {
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [rejectErrors, setRejectErrors] = useState<Record<string, string>>({});
  const [revealedAuthors, setRevealedAuthors] = useState<Record<string, string>>({});
  const [revealErrors, setRevealErrors] = useState<Record<string, string>>({});

  const allIdeas = getIdeasByWorkspace(workspace.id);
  const pendingIdeas = allIdeas.filter((i) => i.moderationStatus === 'menunggu');
  const pendingComments = allIdeas.flatMap((idea) =>
    idea.comments
      .filter((c) => c.moderationStatus === 'menunggu')
      .map((comment) => ({ idea, comment }))
  );
  const reports = getReportsByWorkspace(workspace.id);
  const bidangProposals = getBidangProposals(workspace.id).filter(
    (p) => p.status === 'menunggu'
  );

  function handleIdeaDecision(ideaId: string, decision: 'disetujui' | 'ditolak') {
    const reason = rejectReasons[ideaId] || '';
    if (decision === 'ditolak' && !reason.trim()) {
      setRejectErrors((prev) => ({
        ...prev,
        [ideaId]: 'Tuliskan alasan singkat penolakan agar pengirim mendapat kejelasan.',
      }));
      return;
    }
    setRejectErrors((prev) => ({ ...prev, [ideaId]: '' }));
    updateIdeaModeration(ideaId, decision, reason);
    onRefresh();
  }

  function handleRevealIdentity(reportId: string) {
    if (role !== 'admin') return;
    const res = revealAnonymousAuthorForReport(reportId, user.username);
    if ('error' in res) {
      setRevealErrors((prev) => ({ ...prev, [reportId]: res.error }));
      return;
    }
    setRevealedAuthors((prev) => ({ ...prev, [reportId]: res.username }));
    onRefresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
          Moderasi, Keamanan &amp; Laporan
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Menjaga papan publik bebas dari ejekan, kata kasar, dan penyalahgunaan mode anonim.
        </p>
      </div>

      {/* Antrean Ide Baru */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
            Antrean Persetujuan Ide ({pendingIdeas.length})
          </h2>
        </div>

        {pendingIdeas.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Semua ide masuk sudah dimoderasi.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {pendingIdeas.map((idea) => {
              const bidang = workspace.bidangList.find((b) => b.id === idea.bidangId);
              const colorCfg = bidang ? BIDANG_COLOR_MAP[bidang.color] : BIDANG_COLOR_MAP.purple;
              return (
                <div
                  key={idea.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <span className={`h-2 w-2 rounded-full ${colorCfg.dot}`} />
                      {bidang?.name || 'Umum'} · {idea.category} · Pengirim: {idea.authorDisplayName}
                    </span>
                    <span>{formatDateId(idea.createdAt)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectIdea(idea)}
                    className="block text-left font-display text-base font-extrabold text-slate-900 hover:text-indigo-600 dark:text-white cursor-pointer"
                  >
                    {idea.title}
                  </button>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{idea.content}</p>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center pt-2">
                    <input
                      type="text"
                      value={rejectReasons[idea.id] || ''}
                      onChange={(e) =>
                        setRejectReasons((prev) => ({ ...prev, [idea.id]: e.target.value }))
                      }
                      placeholder="Alasan jika ditolak (misal: mengandung ejekan / duplikat)..."
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleIdeaDecision(idea.id, 'disetujui')}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Setujui Tayang
                      </button>
                      <button
                        type="button"
                        onClick={() => handleIdeaDecision(idea.id, 'ditolak')}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        Tolak
                      </button>
                    </div>
                  </div>
                  {rejectErrors[idea.id] && (
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      {rejectErrors[idea.id]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Antrean Komentar */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
            Moderasi Komentar ({pendingComments.length})
          </h2>
        </div>

        {pendingComments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Tidak ada komentar menunggu moderasi.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {pendingComments.map(({ idea, comment }) => (
              <div
                key={comment.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Pada ide: {idea.title} · oleh {comment.authorDisplay}
                  </p>
                  <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                    {comment.content}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      moderateComment(idea.id, comment.id, 'disetujui');
                      onRefresh();
                    }}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    Tayangkan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      moderateComment(idea.id, comment.id, 'ditolak');
                      onRefresh();
                    }}
                    className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Usulan Bidang Baru dari Pengelola */}
      {role === 'admin' && bidangProposals.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-violet-600" />
            <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
              Usulan {workspace.terms.bidangSingular} Baru ({bidangProposals.length})
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            {bidangProposals.map((prop) => (
              <div
                key={prop.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div>
                  <p className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
                    {prop.name} <span className="font-normal text-xs text-slate-500">· diusulkan {prop.proposedByName}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{prop.reason}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resolveBidangProposal(prop.id, 'disetujui');
                      onWorkspaceUpdated();
                    }}
                    className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    Setujui &amp; Tambahkan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resolveBidangProposal(prop.id, 'ditolak');
                      onRefresh();
                    }}
                    className="rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Laporan Pelanggaran & Akses Terbatas Identitas Anonim */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-rose-600" />
          <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
            Laporan Pelanggaran ({reports.length})
          </h2>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Identitas pengirim anonim disimpan di brankas terpisah dan hanya dapat dibuka Admin ketika
          terdapat laporan pelanggaran resmi.
        </p>

        {reports.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Belum ada laporan pelanggaran di ruang ini.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {reports.map((rpt) => {
              const relatedIdea = allIdeas.find((i) => i.id === rpt.ideaId);
              return (
                <div
                  key={rpt.id}
                  className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4 dark:border-rose-900/50 dark:bg-rose-950/20 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-rose-800 dark:text-rose-200">
                      Status Laporan: <span className="uppercase">{rpt.status}</span> · Dilaporkan{' '}
                      {rpt.reportedByName}
                    </span>
                    <span className="text-slate-500">{formatDateId(rpt.createdAt)}</span>
                  </div>

                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Kartu Ide: {relatedIdea ? relatedIdea.title : rpt.ideaId}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Alasan laporan: {rpt.reason}
                  </p>

                  {revealedAuthors[rpt.id] && (
                    <div className="flex items-center gap-2 rounded-xl bg-amber-100/80 px-3 py-2 text-xs font-bold text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
                      <ShieldAlert className="h-4 w-4" />
                      <span>
                        Identitas pengirim anonim dari brankas: @{revealedAuthors[rpt.id]} (Tercatat dibuka
                        oleh @{user.username})
                      </span>
                    </div>
                  )}

                  {revealErrors[rpt.id] && (
                    <p className="text-xs font-bold text-rose-600">{revealErrors[rpt.id]}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {relatedIdea && (
                      <button
                        type="button"
                        onClick={() => onSelectIdea(relatedIdea)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
                      >
                        Lihat Ide
                      </button>
                    )}

                    {role === 'admin' && relatedIdea?.isAnonymous && !revealedAuthors[rpt.id] && (
                      <button
                        type="button"
                        onClick={() => handleRevealIdentity(rpt.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Buka Identitas Anonim (Khusus Admin)
                      </button>
                    )}

                    {rpt.status !== 'selesai' && (
                      <button
                        type="button"
                        onClick={() => {
                          resolveReport(rpt.id, 'Sudah ditinjau dan diselesaikan oleh moderator.');
                          onRefresh();
                        }}
                        className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white dark:bg-indigo-600 cursor-pointer"
                      >
                        Tandai Selesai
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
