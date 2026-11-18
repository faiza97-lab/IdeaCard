import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Check,
  Copy,
  Globe2,
  Heart,
  Link2,
  Lock,
  MessageCircle,
  MessageSquarePlus,
  Search,
} from 'lucide-react';
import { getPublicIdeas, toggleVoteIdea } from '../../services/ideaService';
import { getProgramsByWorkspace } from '../../services/monevService';
import { updateWorkspace } from '../../services/workspaceService';
import { Idea, User, Workspace, WorkspaceRole } from '../../types/ideacard';
import {
  BIDANG_COLOR_MAP,
  formatDateId,
  formatMonthLabelId,
  getIdeaStatusTextColor,
} from '../../utils/themeUtils';

interface PublicDashboardProps {
  workspace: Workspace;
  user: User | null;
  role: WorkspaceRole | null;
  isGuest: boolean;
  onWorkspaceUpdated: (ws: Workspace) => void;
  onSelectIdea: (idea: Idea) => void;
  onRefresh: () => void;
}

export function PublicDashboard({
  workspace,
  user,
  role,
  isGuest,
  onWorkspaceUpdated,
  onSelectIdea,
  onRefresh,
}: PublicDashboardProps) {
  const [selectedPeriodId, setSelectedPeriodId] = useState(workspace.activePeriodId);
  const [filterBidang, setFilterBidang] = useState('semua');
  const [filterCategory, setFilterCategory] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [filterMonth, setFilterMonth] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'tema' | 'bidang'>('tema');
  const [copiedLink, setCopiedLink] = useState(false);

  const publicIdeas = getPublicIdeas(workspace.id, selectedPeriodId);
  const programs = getProgramsByWorkspace(workspace.id, selectedPeriodId);

  const availableMonths = useMemo(() => {
    const months = new Set(publicIdeas.map((i) => i.createdAt.slice(0, 7)));
    return Array.from(months).sort().reverse();
  }, [publicIdeas]);

  const filteredIdeas = useMemo(() => {
    return publicIdeas.filter((idea) => {
      if (filterBidang !== 'semua' && idea.bidangId !== filterBidang) return false;
      if (filterCategory !== 'semua' && idea.category !== filterCategory) return false;
      if (filterStatus !== 'semua' && idea.status !== filterStatus) return false;
      if (filterMonth !== 'semua' && idea.createdAt.slice(0, 7) !== filterMonth) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !idea.title.toLowerCase().includes(q) &&
          !idea.content.toLowerCase().includes(q) &&
          !idea.themeGroup.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [publicIdeas, filterBidang, filterCategory, filterStatus, filterMonth, searchQuery]);

  // Statistik
  const totalIdeas = publicIdeas.length;
  const developedIdeas = publicIdeas.filter((i) => i.additions.length > 0).length;
  const programIdeas = publicIdeas.filter((i) => i.status === 'Dijadikan Program').length;
  const beingDiscussedIdeas = publicIdeas.filter((i) => i.status === 'Dibahas');

  // Data grafik Recharts: Kontribusi per Bidang
  const chartPerBidang = useMemo(() => {
    return workspace.bidangList.map((b) => ({
      name: b.name.length > 14 ? `${b.name.slice(0, 14)}…` : b.name,
      jumlah: publicIdeas.filter((i) => i.bidangId === b.id).length,
    }));
  }, [workspace.bidangList, publicIdeas]);

  // Data grafik Recharts: Tren per Bulan
  const chartMonthlyTrend = useMemo(() => {
    const map = new Map<string, number>();
    publicIdeas.forEach((idea) => {
      const m = idea.createdAt.slice(0, 7);
      map.set(m, (map.get(m) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, total]) => ({
        bulan: formatMonthLabelId(monthKey).split(' ')[0].slice(0, 3) + ' ' + monthKey.slice(2, 4),
        ide: total,
      }));
  }, [publicIdeas]);

  // Kelompokkan sticky notes per tema atau bidang
  const groupedStickyNotes = useMemo(() => {
    const groups = new Map<string, Idea[]>();
    filteredIdeas.forEach((idea) => {
      const key =
        groupBy === 'tema'
          ? idea.themeGroup || 'Belum Dikelompokkan'
          : workspace.bidangList.find((b) => b.id === idea.bidangId)?.name || 'Umum';
      groups.set(key, [...(groups.get(key) || []), idea]);
    });
    return Array.from(groups.entries());
  }, [filteredIdeas, groupBy, workspace.bidangList]);

  function handleVote(e: React.MouseEvent, ideaId: string) {
    e.stopPropagation();
    if (!user || isGuest) return;
    toggleVoteIdea(ideaId, user.id);
    onRefresh();
  }

  function handleTogglePublicLink() {
    if (role !== 'admin') return;
    const updated = { ...workspace, isPublicLinkEnabled: !workspace.isPublicLinkEnabled };
    updateWorkspace(updated);
    onWorkspaceUpdated(updated);
  }

  function handleCopyPublicLink() {
    const url = `${window.location.origin}/?ruang=${workspace.joinCode}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  return (
    <div className="space-y-8">
      {/* Header + Visibilitas + Arsip Periode */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Dashboard Publik — Papan Ide {workspace.name}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Menampilkan ide yang lolos moderasi untuk dibaca, didukung, dan dikembangkan bersama.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            aria-label="Pilih periode"
            className="min-h-[40px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {workspace.periods.map((prd) => (
              <option key={prd.id} value={prd.id}>
                {prd.name}
              </option>
            ))}
          </select>

          {role === 'admin' && !isGuest && (
            <button
              type="button"
              onClick={handleTogglePublicLink}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
            >
              {workspace.isPublicLinkEnabled ? (
                <>
                  <Globe2 className="h-3.5 w-3.5 text-emerald-600" />
                  Tautan Umum Aktif
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                  Khusus Anggota Ruang
                </>
              )}
            </button>
          )}

          {workspace.isPublicLinkEnabled && (
            <button
              type="button"
              onClick={handleCopyPublicLink}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 cursor-pointer"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
              {copiedLink ? 'Tautan Tersalin' : 'Salin Tautan Publik'}
              <Copy className="h-3 w-3 opacity-70" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Ringkas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Ide Masuk</div>
          <div className="mt-1 font-display text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
            {totalIdeas}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Ide Dikembangkan</div>
          <div className="mt-1 font-display text-3xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
            {developedIdeas}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Jadi {workspace.terms.programSingular}
          </div>
          <div className="mt-1 font-display text-3xl font-extrabold tabular-nums text-indigo-600 dark:text-indigo-400">
            {programIdeas}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Sedang Dibahas</div>
          <div className="mt-1 font-display text-3xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">
            {beingDiscussedIdeas.length}
          </div>
        </div>
      </div>

      {/* Grafik Statistik Recharts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
            Kontribusi Ide per {workspace.terms.bidangSingular}
          </h2>
          <div className="mt-4 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartPerBidang} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="jumlah" name="Jumlah Ide" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
            Tren Ide Masuk per Bulan
          </h2>
          <div className="mt-4 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartMonthlyTrend} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="ide"
                  name="Ide Masuk"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.2}
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Papan Sorotan: Sedang Dibahas & Jadi Program */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
            Papan Sedang Dibahas ({beingDiscussedIdeas.length})
          </h2>
          <div className="mt-3 space-y-2.5">
            {beingDiscussedIdeas.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">Belum ada ide yang sedang dibahas di forum.</p>
            ) : (
              beingDiscussedIdeas.map((idea) => (
                <button
                  key={idea.id}
                  type="button"
                  onClick={() => onSelectIdea(idea)}
                  className="w-full rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-left hover:bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 cursor-pointer"
                >
                  <div className="font-display text-sm font-bold text-slate-900 dark:text-white">
                    {idea.title}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <span>{idea.votes.length} dukungan</span>
                    <span aria-hidden="true">·</span>
                    <span>{idea.additions.length} tambahan ide</span>
                    {idea.wantOralDiscussion && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          Siap dibahas lisan
                        </span>
                      </>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
            Papan Jadi {workspace.terms.programSingular} ({programs.length})
          </h2>
          <div className="mt-3 space-y-3">
            {programs.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                Belum ada {workspace.terms.programSingular.toLowerCase()} pada periode ini.
              </p>
            ) : (
              programs.slice(0, 4).map((prg) => (
                <div
                  key={prg.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold text-slate-900 dark:text-white truncate">
                      {prg.name}
                    </span>
                    <span className="font-mono text-xs font-bold tabular-nums text-indigo-600 dark:text-indigo-400 shrink-0">
                      {prg.progressPercent}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
                      style={{ width: `${prg.progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Status: {prg.status}</span>
                    <span>PJ: {prg.picName || '-'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Filter & Papan Sticky Notes */}
      <section className="space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul ide, isi, atau tema..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 self-start">
              <button
                type="button"
                onClick={() => setGroupBy('tema')}
                className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  groupBy === 'tema'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Kelompok Tema
              </button>
              <button
                type="button"
                onClick={() => setGroupBy('bidang')}
                className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  groupBy === 'bidang'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Kelompok {workspace.terms.bidangSingular}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <select
              value={filterBidang}
              onChange={(e) => setFilterBidang(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="semua">Semua {workspace.terms.bidangSingular}</option>
              {workspace.bidangList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="semua">Semua Kategori</option>
              {workspace.categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="semua">Semua Status</option>
              {workspace.statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="semua">Semua Bulan</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabelId(m)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sticky Notes Grid */}
        {groupedStickyNotes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="font-display text-base font-bold text-slate-800 dark:text-slate-200">
              Tidak ada kartu ide yang cocok dengan filtermu
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Coba ubah filter bidang, bulan, atau kata kunci pencarian.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedStickyNotes.map(([groupName, items]) => (
              <div key={groupName} className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                  <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                    {groupName}
                  </h3>
                  <span className="font-mono text-xs font-bold text-slate-500 tabular-nums">
                    {items.length} kartu
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((idea) => {
                    const bidang = workspace.bidangList.find((b) => b.id === idea.bidangId);
                    const colorCfg = bidang
                      ? BIDANG_COLOR_MAP[bidang.color]
                      : BIDANG_COLOR_MAP.purple;
                    const hasVoted = user ? idea.votes.includes(user.id) : false;

                    return (
                      <div
                        key={idea.id}
                        onClick={() => onSelectIdea(idea)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelectIdea(idea);
                          }
                        }}
                        className={`group flex flex-col justify-between rounded-2xl border p-5 text-left shadow-xs hover:shadow-md transition-all cursor-pointer ${colorCfg.stickyBg} ${colorCfg.stickyBorder}`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                            <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 truncate">
                              <span className={`h-2 w-2 rounded-full shrink-0 ${colorCfg.dot}`} />
                              <span className="truncate">{bidang?.name || 'Umum'}</span>
                            </span>
                            <span className={`shrink-0 ${getIdeaStatusTextColor(idea.status)}`}>
                              {idea.status}
                            </span>
                          </div>

                          <h4 className="mt-2.5 font-display text-base font-extrabold text-slate-900 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-300">
                            {idea.title}
                          </h4>

                          <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                            {idea.content}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-black/5 pt-3 text-xs dark:border-white/10">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 truncate">
                            <span className="font-semibold truncate">{idea.authorDisplayName}</span>
                            <span aria-hidden="true">·</span>
                            <span className="shrink-0">{formatDateId(idea.createdAt)}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {idea.wantOralDiscussion && (
                              <span title="Siap dibahas lisan" className="text-emerald-700 dark:text-emerald-400">
                                <MessageCircle className="h-3.5 w-3.5" />
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 tabular-nums">
                              <MessageSquarePlus className="h-3.5 w-3.5" />
                              {idea.additions.length}
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              type="button"
                              disabled={isGuest}
                              onClick={(e) => handleVote(e, idea.id)}
                              className={`inline-flex min-h-[32px] items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer disabled:opacity-70 ${
                                hasVoted
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-white/80 text-slate-700 hover:bg-white dark:bg-slate-900/70 dark:text-slate-200'
                              }`}
                            >
                              <Heart className={`h-3.5 w-3.5 ${hasVoted ? 'fill-current' : ''}`} />
                              <span className="tabular-nums">{idea.votes.length}</span>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
