import { useState } from 'react';
import {
  AlertTriangle,
  Award,
  Check,
  Edit3,
  Heart,
  MessageSquarePlus,
  PenSquare,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  computeUserBadges,
  getMyIdeas,
  getUserReflections,
} from '../../services/ideaService';
import { getOverdueReminders } from '../../services/monevService';
import { updateWorkspace } from '../../services/workspaceService';
import { Idea, IdeaStatus, User, Workspace, WorkspaceRole } from '../../types/ideacard';
import {
  ACCENT_THEME_MAP,
  BIDANG_COLOR_MAP,
  formatDateId,
  getIdeaStatusTextColor,
} from '../../utils/themeUtils';

interface PersonalDashboardProps {
  workspace: Workspace;
  user: User;
  role: WorkspaceRole;
  onWorkspaceUpdated: (ws: Workspace) => void;
  onOpenWriteIdea: () => void;
  onSelectIdea: (idea: Idea) => void;
  onGoPrograms: () => void;
}

export function PersonalDashboard({
  workspace,
  user,
  role,
  onWorkspaceUpdated,
  onOpenWriteIdea,
  onSelectIdea,
  onGoPrograms,
}: PersonalDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<'semua' | IdeaStatus>('semua');
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [promptDraft, setPromptDraft] = useState(workspace.activePrompt);

  const myIdeas = getMyIdeas(workspace.id, user.id);
  const badges = computeUserBadges(workspace.id, user.id);
  const reflections = getUserReflections(workspace.id, user.id);
  const overdueReminders =
    role === 'admin' || role === 'pengelola' ? getOverdueReminders(workspace.id) : [];

  const filteredIdeas =
    statusFilter === 'semua'
      ? myIdeas
      : myIdeas.filter((i) => i.status === statusFilter);

  const avgComfort =
    reflections.length > 0
      ? (reflections.reduce((a, b) => a + b.comfortScore, 0) / reflections.length).toFixed(1)
      : '-';
  const avgSafety =
    reflections.length > 0
      ? (reflections.reduce((a, b) => a + b.safetyScore, 0) / reflections.length).toFixed(1)
      : '-';

  const accent = ACCENT_THEME_MAP[workspace.accentTheme] || ACCENT_THEME_MAP.indigo;

  function handleSavePrompt(e: React.FormEvent) {
    e.preventDefault();
    const updated = { ...workspace, activePrompt: promptDraft.trim() };
    updateWorkspace(updated);
    onWorkspaceUpdated(updated);
    setEditingPrompt(false);
  }

  return (
    <div className="space-y-8">
      {/* Pengingat Tugas Terlambat untuk Pengelola / Admin */}
      {overdueReminders.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50/80 px-5 py-4 dark:border-rose-900/60 dark:bg-rose-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Pengingat Monev: Ada {overdueReminders.length} tugas {workspace.terms.programSingular}{' '}
                yang melewati tenggat
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Contoh: &ldquo;{overdueReminders[0].taskTitle}&rdquo; pada {overdueReminders[0].programName}{' '}
                (terlambat {overdueReminders[0].daysLate} hari).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onGoPrograms}
            className="min-h-[40px] rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer whitespace-nowrap"
          >
            Tinjau di Monev
          </button>
        </div>
      )}

      {/* Pertanyaan Pemantik Aktif + Tombol Besar Tulis Ide */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-4 w-4" />
              <span>Pertanyaan Pemantik Aktif</span>
              {role === 'admin' && !editingPrompt && (
                <button
                  type="button"
                  onClick={() => {
                    setPromptDraft(workspace.activePrompt);
                    setEditingPrompt(true);
                  }}
                  className="ml-2 inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:text-slate-400 cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Ubah
                </button>
              )}
            </div>

            {editingPrompt ? (
              <form onSubmit={handleSavePrompt} className="space-y-2 pt-1">
                <textarea
                  rows={2}
                  value={promptDraft}
                  onChange={(e) => setPromptDraft(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Simpan Pemantik
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPrompt(false)}
                    className="min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            ) : (
              <h1
                className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl dark:text-white"
                style={{ textWrap: 'balance' }}
              >
                &ldquo;{workspace.activePrompt}&rdquo;
              </h1>
            )}

            <p className="text-sm text-slate-600 dark:text-slate-400">
              Tulis gagasanmu sendiri dulu sebelum dibahas bersama. Kamu bebas memilih mode anonim.
            </p>
          </div>

          {role !== 'pengamat' && (
            <button
              type="button"
              onClick={onOpenWriteIdea}
              className={`inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-2xl px-7 py-3.5 text-base font-extrabold shadow-sm transition-transform active:scale-[0.98] cursor-pointer shrink-0 ${accent.button}`}
            >
              <PenSquare className="h-5 w-5" />
              Tulis Ide Baru
            </button>
          )}
        </div>
      </section>

      {/* Lencana Apresiasi Keberanian + Refleksi Kenyamanan */}
      <section className="grid gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                Lencana Apresiasi Keberanian Berkontribusi
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Menghargai partisipasi, bukan lomba ide paling benar
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {badges.map((badge) => {
              const colorCfg = BIDANG_COLOR_MAP[badge.color];
              return (
                <div
                  key={badge.id}
                  className={`rounded-2xl border p-4 transition-opacity ${
                    badge.earned
                      ? `${colorCfg.stickyBg} ${colorCfg.stickyBorder}`
                      : 'border-slate-200 bg-slate-50/50 opacity-70 dark:border-slate-800 dark:bg-slate-950/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
                      {badge.name}
                    </span>
                    <span
                      className={`font-mono text-xs font-bold tabular-nums ${
                        badge.earned ? colorCfg.text : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {badge.earned ? 'Diraih' : badge.progressText}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {badge.description}
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Syarat: {badge.criteriaText}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ringkasan Refleksi Kenyamanan */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
              Refleksi Rasa Amanmu
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Catatan pribadimu setelah mengirim kartu ide di ruang ini ({reflections.length} kali mengisi).
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-950/60">
              <div className="text-xs text-slate-500 dark:text-slate-400">Nyaman Berkata</div>
              <div className="mt-1 font-display text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {avgComfort} <span className="text-xs font-normal text-slate-400">/ 5</span>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-950/60">
              <div className="text-xs text-slate-500 dark:text-slate-400">Takut Diejek</div>
              <div className="mt-1 font-display text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                {avgSafety} <span className="text-xs font-normal text-slate-400">/ 5</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Skor 5 pada &ldquo;Takut Diejek&rdquo; berarti kamu merasa sangat aman dari ejekan.
          </p>
        </div>
      </section>

      {/* Riwayat Ide Saya */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
              Riwayat Ide Saya ({myIdeas.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Termasuk ide yang kamu kirim dengan mode anonim — hanya kamu yang melihat daftar pribadimu.
            </p>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'semua' | IdeaStatus)}
            className="min-h-[40px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            <option value="semua">Semua Status</option>
            {workspace.statuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {filteredIdeas.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="font-display text-base font-bold text-slate-800 dark:text-slate-200">
              Belum ada ide pada filter ini
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Mulai dari pertanyaan pemantik di atas. Ide sederhana sekalipun sangat berharga!
            </p>
            {role !== 'pengamat' && (
              <button
                type="button"
                onClick={onOpenWriteIdea}
                className="mt-4 inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
              >
                <PenSquare className="h-4 w-4" />
                Tulis Ide Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
            {filteredIdeas.map((idea) => {
              const bidang = workspace.bidangList.find((b) => b.id === idea.bidangId);
              const colorCfg = bidang ? BIDANG_COLOR_MAP[bidang.color] : BIDANG_COLOR_MAP.purple;
              return (
                <button
                  key={idea.id}
                  type="button"
                  onClick={() => onSelectIdea(idea)}
                  className="flex w-full flex-col gap-2 py-4 text-left hover:bg-slate-50/70 px-2 rounded-xl transition-colors dark:hover:bg-slate-800/40 cursor-pointer"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                        <span className={`h-2 w-2 rounded-full ${colorCfg.dot}`} />
                        {bidang?.name || 'Umum'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{idea.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{idea.isAnonymous ? 'Anonim' : 'Nama Tampil'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatDateId(idea.createdAt)}</span>
                    </div>
                    <span className={`text-xs font-extrabold ${getIdeaStatusTextColor(idea.status)}`}>
                      {idea.status}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    {idea.title}
                  </h3>

                  {idea.statusReason && (
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Catatan: {idea.statusReason}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Heart className="h-3.5 w-3.5" />
                      {idea.votes.length} dukungan
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <MessageSquarePlus className="h-3.5 w-3.5" />
                      {idea.additions.length} tambahan ide
                    </span>
                    <span>
                      Moderasi:{' '}
                      <strong className="capitalize text-slate-700 dark:text-slate-300">
                        {idea.moderationStatus}
                      </strong>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
