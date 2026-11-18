import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Calendar, Check, Printer, Save } from 'lucide-react';
import {
  getMonthlyMonevNote,
  getMonthlySummary,
  getProgramHealthSignal,
  saveMonthlyMonevNote,
} from '../../services/monevService';
import { User, Workspace, WorkspaceRole } from '../../types/ideacard';
import {
  BIDANG_COLOR_MAP,
  formatMonthLabelId,
  formatRupiah,
} from '../../utils/themeUtils';

interface MonthlyMonevViewProps {
  workspace: Workspace;
  user: User;
  role: WorkspaceRole;
}

export function MonthlyMonevView({ workspace, user, role }: MonthlyMonevViewProps) {
  const [monthKey, setMonthKey] = useState('2026-11');
  const existingNote = getMonthlyMonevNote(workspace.id, monthKey);
  const [evalDraft, setEvalDraft] = useState(existingNote?.evaluationSummary || '');
  const [followUpDraft, setFollowUpDraft] = useState(existingNote?.followUpPlan || '');
  const [savedFlag, setSavedFlag] = useState(false);

  const canEdit = role === 'admin' || role === 'pengelola';
  const summary = useMemo(
    () => getMonthlySummary(workspace.id, monthKey),
    [workspace.id, monthKey]
  );

  // Sync draft when month changes
  function handleMonthChange(nextMonth: string) {
    setMonthKey(nextMonth);
    const note = getMonthlyMonevNote(workspace.id, nextMonth);
    setEvalDraft(note?.evaluationSummary || '');
    setFollowUpDraft(note?.followUpPlan || '');
  }

  function handleSaveNote(e: React.FormEvent) {
    e.preventDefault();
    saveMonthlyMonevNote({
      workspaceId: workspace.id,
      monthKey,
      evaluationSummary: evalDraft,
      followUpPlan: followUpDraft,
      updatedBy: user.displayName || user.username,
    });
    setSavedFlag(true);
    setTimeout(() => setSavedFlag(false), 2500);
  }

  // Laporan otomatis per Bidang
  const bidangReports = useMemo(() => {
    return workspace.bidangList.map((b) => {
      const bPrograms = summary.monthPrograms.filter((p) => p.bidangId === b.id);
      const bIdeas = summary.monthIdeas.filter((i) => i.bidangId === b.id);
      const planned = bPrograms.reduce((a, p) => a + p.budgetPlanned, 0);
      const realized = bPrograms.reduce((a, p) => a + p.budgetRealized, 0);
      const totalTasks = bPrograms.reduce((a, p) => a + p.tasks.length, 0);
      const doneTasks = bPrograms.reduce(
        (a, p) => a + p.tasks.filter((t) => t.done).length,
        0
      );
      return {
        bidang: b,
        shortName: b.name.length > 14 ? `${b.name.slice(0, 14)}…` : b.name,
        ideasCount: bIdeas.length,
        programsCount: bPrograms.length,
        completedCount: bPrograms.filter((p) => p.status === 'Selesai').length,
        taskRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
        planned,
        realized,
      };
    });
  }, [workspace.bidangList, summary]);

  // Kalender bulan terpilih (grid tanggal 1..N)
  const calendarDays = useMemo(() => {
    const [year, month] = monthKey.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7; // Senin = 0
    const cells: { day: number | null; dateStr?: string; events: string[] }[] = [];

    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: null, events: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${monthKey}-${String(d).padStart(2, '0')}`;
      const events: string[] = [];
      summary.monthPrograms.forEach((p) => {
        if (p.scheduleDate === dateStr) events.push(`Mulai: ${p.name}`);
        if (p.endDate === dateStr) events.push(`Selesai: ${p.name}`);
        p.tasks.forEach((t) => {
          if (t.dueDate === dateStr) events.push(`Tugas: ${t.title}`);
        });
      });
      cells.push({ day: d, dateStr, events });
    }
    return cells;
  }, [monthKey, summary.monthPrograms]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Monev &amp; Laporan Bulanan — {formatMonthLabelId(monthKey)}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Rekap kalender kegiatan, ide masuk, serapan anggaran, dan laporan per {workspace.terms.bidangSingular}.
          </p>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2.5">
          <input
            type="month"
            value={monthKey}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Cetak / Ekspor PDF
          </button>
        </div>
      </div>

      {/* Ringkasan KPI Bulanan */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Terencana vs Terlaksana
          </div>
          <div className="mt-1 font-display text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
            {summary.completedCount} / {summary.plannedCount}
          </div>
          <p className="mt-1 text-xs text-slate-500">{workspace.terms.programPlural} selesai</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Ide Masuk Bulan Ini</div>
          <div className="mt-1 font-display text-2xl font-extrabold tabular-nums text-indigo-600 dark:text-indigo-400">
            {summary.monthIdeasCount}
          </div>
          <p className="mt-1 text-xs text-slate-500">Kartu ide tercatat</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Penyelesaian Tugas</div>
          <div className="mt-1 font-display text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
            {summary.taskRate}%
          </div>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {summary.doneTasks} dari {summary.totalTasks} tugas
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Serapan Anggaran</div>
          <div className="mt-1 font-display text-2xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">
            {summary.budgetAbsorptionRate}%
          </div>
          <p className="mt-1 text-xs font-mono tabular-nums text-slate-500">
            {formatRupiah(summary.totalBudgetRealized)} / {formatRupiah(summary.totalBudgetPlanned)}
          </p>
        </div>
      </div>

      {/* Kalender Kegiatan Bulan Terpilih + Grafik Per Bidang */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <section className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
              Kalender Jadwal &amp; Tenggat Tugas
            </h2>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500 pb-2">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => (
              <div
                key={idx}
                className={`min-h-[64px] rounded-xl border p-1.5 text-left ${
                  cell.day
                    ? 'border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40'
                    : 'border-transparent'
                }`}
              >
                {cell.day && (
                  <>
                    <div className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                      {cell.day}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {cell.events.slice(0, 2).map((ev, i) => (
                        <div
                          key={i}
                          title={ev}
                          className="truncate rounded bg-indigo-100/90 px-1 py-0.5 text-[9px] font-bold text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-200"
                        >
                          {ev}
                        </div>
                      ))}
                      {cell.events.length > 2 && (
                        <div className="text-[9px] font-bold text-slate-500">
                          +{cell.events.length - 2} lagi
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
            Ide &amp; {workspace.terms.programSingular} per {workspace.terms.bidangSingular}
          </h2>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bidangReports}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                <XAxis dataKey="shortName" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="ideasCount" name="Ide Masuk" fill="#6366F1" radius={[6, 6, 0, 0]} />
                <Bar
                  dataKey="programsCount"
                  name={workspace.terms.programSingular}
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Tabel Laporan Otomatis per Bidang */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
        <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
          Laporan Otomatis per {workspace.terms.bidangSingular}
        </h2>
        <table className="mt-4 w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="py-2.5 pr-4">{workspace.terms.bidangSingular}</th>
              <th className="py-2.5 px-3 text-right">Ide Masuk</th>
              <th className="py-2.5 px-3 text-right">{workspace.terms.programPlural}</th>
              <th className="py-2.5 px-3 text-right">Selesai</th>
              <th className="py-2.5 px-3 text-right">Tugas (%)</th>
              <th className="py-2.5 pl-3 text-right">Realisasi Anggaran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {bidangReports.map((row) => {
              const colorCfg = BIDANG_COLOR_MAP[row.bidang.color];
              return (
                <tr key={row.bidang.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                  <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">
                    <span className="inline-flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${colorCfg.dot}`} />
                      {row.bidang.name}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">{row.ideasCount}</td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">{row.programsCount}</td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">{row.completedCount}</td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">{row.taskRate}%</td>
                  <td className="py-3 pl-3 text-right font-mono tabular-nums">
                    {formatRupiah(row.realized)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {summary.monthPrograms.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
            <h3 className="font-display text-sm font-extrabold text-slate-800 dark:text-slate-200">
              Status Kesehatan {workspace.terms.programPlural} Bulan Ini
            </h3>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
              {summary.monthPrograms.map((p) => {
                const sig = getProgramHealthSignal(p);
                const sigStyle =
                  sig.signal === 'hijau'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : sig.signal === 'kuning'
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-rose-700 dark:text-rose-300';
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 px-3.5 py-2.5 text-xs dark:border-slate-800"
                  >
                    <span className="font-bold text-slate-900 dark:text-white truncate">{p.name}</span>
                    <span className={`font-bold shrink-0 ml-2 ${sigStyle}`}>{sig.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Catatan Evaluasi & Tindak Lanjut Bulanan */}
      <form
        onSubmit={handleSaveNote}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
            Catatan Evaluasi &amp; Rencana Tindak Lanjut
          </h2>
          {savedFlag && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
              <Check className="h-4 w-4" />
              Tersimpan
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
              Evaluasi Umum Bulan {formatMonthLabelId(monthKey)}
            </label>
            <textarea
              rows={3}
              disabled={!canEdit}
              value={evalDraft}
              onChange={(e) => setEvalDraft(e.target.value)}
              placeholder="Ringkasan capaian, partisipasi anggota, dan kendala utama..."
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
              Rencana Tindak Lanjut Bulan Berikutnya
            </label>
            <textarea
              rows={3}
              disabled={!canEdit}
              value={followUpDraft}
              onChange={(e) => setFollowUpDraft(e.target.value)}
              placeholder="Langkah konkret yang perlu segera dilakukan..."
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </div>

        {canEdit && (
          <div className="no-print flex justify-end">
            <button
              type="submit"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              Simpan Catatan Bulanan
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
