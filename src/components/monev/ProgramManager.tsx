import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  Link2,
  Plus,
  Save,
  Trash2,
  Users,
} from 'lucide-react';
import {
  PROGRAM_TEMPLATES,
  ProgramTemplate,
  TrafficSignal,
  createEmptyProgram,
  getProgramHealthSignal,
  getProgramsByWorkspace,
  getTaskHealthSignal,
  saveProgram,
} from '../../services/monevService';
import { getIdeasByWorkspace } from '../../services/ideaService';
import { generateId } from '../../services/storageService';
import {
  Idea,
  Program,
  ProgramStatus,
  Workspace,
  WorkspaceRole,
} from '../../types/ideacard';
import {
  BIDANG_COLOR_MAP,
  formatDateId,
  formatRupiah,
  getProgramStatusTextColor,
} from '../../utils/themeUtils';

interface ProgramManagerProps {
  workspace: Workspace;
  role: WorkspaceRole | null;
  initialProgramToCreateFromIdea?: Idea | null;
  onClearInitialIdea?: () => void;
  onSelectIdea: (idea: Idea) => void;
  onRefresh: () => void;
}

function SignalTextBadge({ signal, label }: { signal: TrafficSignal; label: string }) {
  const styles =
    signal === 'hijau'
      ? 'text-emerald-700 dark:text-emerald-300'
      : signal === 'kuning'
      ? 'text-amber-700 dark:text-amber-300'
      : 'text-rose-700 dark:text-rose-300';
  const dot =
    signal === 'hijau'
      ? 'bg-emerald-500'
      : signal === 'kuning'
      ? 'bg-amber-500'
      : 'bg-rose-500';
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${styles}`}>
      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${dot}`} />
      <span>{label}</span>
    </span>
  );
}

export function ProgramManager({
  workspace,
  role,
  initialProgramToCreateFromIdea,
  onClearInitialIdea,
  onSelectIdea,
  onRefresh,
}: ProgramManagerProps) {
  const programs = getProgramsByWorkspace(workspace.id, workspace.activePeriodId);
  const allIdeas = getIdeasByWorkspace(workspace.id);

  const [selectedProgram, setSelectedProgram] = useState<Program | null>(() => {
    if (initialProgramToCreateFromIdea) {
      return createEmptyProgram({
        workspaceId: workspace.id,
        periodId: workspace.activePeriodId,
        bidangId: initialProgramToCreateFromIdea.bidangId,
        linkedIdeaIds: [initialProgramToCreateFromIdea.id],
        initialName: initialProgramToCreateFromIdea.title,
        initialBackground: initialProgramToCreateFromIdea.content,
      });
    }
    return null;
  });

  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'semua' | ProgramStatus>('semua');
  const [savedNotice, setSavedNotice] = useState('');

  // Form helpers inside Program Detail
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPic, setNewTaskPic] = useState('');
  const [newTaskDue, setNewTaskDue] = useState(new Date().toISOString().slice(0, 10));

  const [newIndLabel, setNewIndLabel] = useState('');
  const [newIndTarget, setNewIndTarget] = useState('');

  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');

  const canEdit = role === 'admin' || role === 'pengelola';

  function handleStartFromTemplate(tpl?: ProgramTemplate) {
    const fresh = createEmptyProgram({
      workspaceId: workspace.id,
      periodId: workspace.activePeriodId,
      bidangId: workspace.bidangList[0]?.id || '',
      template: tpl,
    });
    setTemplatePickerOpen(false);
    setSelectedProgram(fresh);
  }

  function handleSaveProgram(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProgram) return;
    if (!selectedProgram.name.trim()) return;
    const saved = saveProgram(selectedProgram);
    setSelectedProgram(saved);
    if (onClearInitialIdea) onClearInitialIdea();
    setSavedNotice('Perubahan tersimpan!');
    setTimeout(() => setSavedNotice(''), 2500);
    onRefresh();
  }

  function handleUploadImageDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedProgram) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setSelectedProgram({
        ...selectedProgram,
        documentation: [
          ...selectedProgram.documentation,
          {
            id: generateId('doc'),
            title: file.name,
            url: dataUrl,
            type: 'image',
            addedAt: new Date().toISOString(),
          },
        ],
      });
    };
    reader.readAsDataURL(file);
  }

  const filteredPrograms =
    statusFilter === 'semua'
      ? programs
      : programs.filter((p) => p.status === statusFilter);

  if (selectedProgram) {
    const health = getProgramHealthSignal(selectedProgram);
    const originIdeas = allIdeas.filter((i) => selectedProgram.linkedIdeaIds.includes(i.id));

    return (
      <form onSubmit={handleSaveProgram} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedProgram(null);
              if (onClearInitialIdea) onClearInitialIdea();
            }}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Daftar {workspace.terms.programSingular}
          </button>

          <div className="flex items-center gap-3">
            <SignalTextBadge signal={health.signal} label={health.label} />
            {savedNotice && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {savedNotice}
              </span>
            )}
            {canEdit && (
              <button
                type="submit"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                Simpan {workspace.terms.programSingular}
              </button>
            )}
          </div>
        </div>

        {/* Info Utama Program */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Nama {workspace.terms.programSingular}
              </label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={selectedProgram.name}
                onChange={(e) =>
                  setSelectedProgram({ ...selectedProgram, name: e.target.value })
                }
                placeholder="Nama program atau kegiatan..."
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white disabled:opacity-70"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  {workspace.terms.bidangSingular}
                </label>
                <select
                  disabled={!canEdit}
                  value={selectedProgram.bidangId}
                  onChange={(e) =>
                    setSelectedProgram({ ...selectedProgram, bidangId: e.target.value })
                  }
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
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Status
                </label>
                <select
                  disabled={!canEdit}
                  value={selectedProgram.status}
                  onChange={(e) =>
                    setSelectedProgram({
                      ...selectedProgram,
                      status: e.target.value as ProgramStatus,
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {['Perencanaan', 'Berjalan', 'Selesai', 'Tertunda', 'Dibatalkan'].map(
                    (st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Latar Belakang
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={selectedProgram.background}
                onChange={(e) =>
                  setSelectedProgram({ ...selectedProgram, background: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Tujuan &amp; Sasaran
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={selectedProgram.objective}
                onChange={(e) =>
                  setSelectedProgram({ ...selectedProgram, objective: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Tanggal Mulai
              </label>
              <input
                type="date"
                disabled={!canEdit}
                value={selectedProgram.scheduleDate}
                onChange={(e) =>
                  setSelectedProgram({ ...selectedProgram, scheduleDate: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Tanggal Selesai
              </label>
              <input
                type="date"
                disabled={!canEdit}
                value={selectedProgram.endDate}
                onChange={(e) =>
                  setSelectedProgram({ ...selectedProgram, endDate: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Penanggung Jawab
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={selectedProgram.picName}
                onChange={(e) =>
                  setSelectedProgram({ ...selectedProgram, picName: e.target.value })
                }
                placeholder="Nama PJ"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Sasaran Peserta
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={selectedProgram.targetAudience}
                onChange={(e) =>
                  setSelectedProgram({ ...selectedProgram, targetAudience: e.target.value })
                }
                placeholder="contoh: Seluruh siswa"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Anggaran Rencana (Rp)
              </label>
              <input
                type="number"
                min={0}
                disabled={!canEdit}
                value={selectedProgram.budgetPlanned}
                onChange={(e) =>
                  setSelectedProgram({
                    ...selectedProgram,
                    budgetPlanned: Number(e.target.value) || 0,
                  })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Anggaran Realisasi (Rp)
              </label>
              <input
                type="number"
                min={0}
                disabled={!canEdit}
                value={selectedProgram.budgetRealized}
                onChange={(e) =>
                  setSelectedProgram({
                    ...selectedProgram,
                    budgetRealized: Number(e.target.value) || 0,
                  })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>
        </section>

        {/* Ide Asal Program */}
        {originIdeas.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
              Tautan ke Ide Asal ({originIdeas.length})
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {originIdeas.map((idea) => (
                <button
                  key={idea.id}
                  type="button"
                  onClick={() => onSelectIdea(idea)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300 cursor-pointer"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  {idea.title}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Checklist Tugas & Timeline */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
              Checklist Tugas &amp; Timeline ({selectedProgram.tasks.filter((t) => t.done).length}/
              {selectedProgram.tasks.length})
            </h2>
          </div>

          <div className="space-y-2.5">
            {selectedProgram.tasks.map((task) => {
              const sig = getTaskHealthSignal(task);
              return (
                <div
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50"
                >
                  <label className="flex items-start gap-3 flex-1 min-w-[200px] cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={task.done}
                      onChange={() =>
                        setSelectedProgram({
                          ...selectedProgram,
                          tasks: selectedProgram.tasks.map((t) =>
                            t.id === task.id ? { ...t, done: !t.done } : t
                          ),
                        })
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600"
                    />
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          task.done
                            ? 'line-through text-slate-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        PJ: {task.picName || 'Belum ditunjuk'} · Tenggat: {formatDateId(task.dueDate)}
                      </p>
                    </div>
                  </label>

                  <div className="flex items-center gap-3">
                    <SignalTextBadge signal={sig.signal} label={sig.label} />
                    {canEdit && (
                      <button
                        type="button"
                        aria-label="Hapus tugas"
                        onClick={() =>
                          setSelectedProgram({
                            ...selectedProgram,
                            tasks: selectedProgram.tasks.filter((t) => t.id !== task.id),
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {canEdit && (
            <div className="grid gap-2 sm:grid-cols-12 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Tugas baru..."
                className="sm:col-span-5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <input
                type="text"
                value={newTaskPic}
                onChange={(e) => setNewTaskPic(e.target.value)}
                placeholder="Nama PJ"
                className="sm:col-span-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <input
                type="date"
                value={newTaskDue}
                onChange={(e) => setNewTaskDue(e.target.value)}
                className="sm:col-span-2 rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newTaskTitle.trim()) return;
                  setSelectedProgram({
                    ...selectedProgram,
                    tasks: [
                      ...selectedProgram.tasks,
                      {
                        id: generateId('tsk'),
                        title: newTaskTitle.trim(),
                        picName: newTaskPic.trim() || selectedProgram.picName || 'Tim',
                        dueDate: newTaskDue,
                        done: false,
                      },
                    ],
                  });
                  setNewTaskTitle('');
                  setNewTaskPic('');
                }}
                className="sm:col-span-2 inline-flex min-h-[38px] items-center justify-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white dark:bg-indigo-600 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah
              </button>
            </div>
          )}
        </section>

        {/* Indikator Keberhasilan */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
            Indikator Keberhasilan (Target vs Realisasi)
          </h2>

          <div className="space-y-3">
            {selectedProgram.indicators.map((ind) => (
              <div
                key={ind.id}
                className="grid gap-3 sm:grid-cols-12 items-center rounded-2xl border border-slate-200/80 p-3.5 dark:border-slate-800"
              >
                <div className="sm:col-span-4">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{ind.label}</p>
                  <p className="text-xs text-slate-500">Target: {ind.target}</p>
                </div>
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={ind.realization}
                    onChange={(e) =>
                      setSelectedProgram({
                        ...selectedProgram,
                        indicators: selectedProgram.indicators.map((item) =>
                          item.id === ind.id ? { ...item, realization: e.target.value } : item
                        ),
                      })
                    }
                    placeholder="Isi capaian / realisasi..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-3 flex items-center justify-end gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={ind.achieved}
                      onChange={() =>
                        setSelectedProgram({
                          ...selectedProgram,
                          indicators: selectedProgram.indicators.map((item) =>
                            item.id === ind.id ? { ...item, achieved: !item.achieved } : item
                          ),
                        })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                    Tercapai
                  </label>
                </div>
              </div>
            ))}
          </div>

          {canEdit && (
            <div className="grid gap-2 sm:grid-cols-12 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="text"
                value={newIndLabel}
                onChange={(e) => setNewIndLabel(e.target.value)}
                placeholder="Nama indikator..."
                className="sm:col-span-5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <input
                type="text"
                value={newIndTarget}
                onChange={(e) => setNewIndTarget(e.target.value)}
                placeholder="Target terukur (misal: 50 peserta)"
                className="sm:col-span-5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newIndLabel.trim()) return;
                  setSelectedProgram({
                    ...selectedProgram,
                    indicators: [
                      ...selectedProgram.indicators,
                      {
                        id: generateId('ind'),
                        label: newIndLabel.trim(),
                        target: newIndTarget.trim() || '100%',
                        realization: '',
                        achieved: false,
                      },
                    ],
                  });
                  setNewIndLabel('');
                  setNewIndTarget('');
                }}
                className="sm:col-span-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white dark:bg-indigo-600 cursor-pointer"
              >
                + Indikator
              </button>
            </div>
          )}
        </section>

        {/* Bukti Dokumentasi & Evaluasi Pasca Kegiatan */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
              Bukti Dokumentasi ({selectedProgram.documentation.length})
            </h2>

            <div className="space-y-2.5">
              {selectedProgram.documentation.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {doc.title}
                    </span>
                    {doc.type === 'link' && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline shrink-0"
                      >
                        Buka <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {doc.type === 'image' && (
                    <img
                      src={doc.url}
                      alt={doc.title}
                      className="mt-2 h-36 w-full rounded-xl object-cover"
                    />
                  )}
                </div>
              ))}
            </div>

            {canEdit && (
              <div className="space-y-2.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="Judul dokumentasi"
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  <input
                    type="url"
                    value={newDocUrl}
                    onChange={(e) => setNewDocUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newDocTitle.trim() || !newDocUrl.trim()) return;
                      setSelectedProgram({
                        ...selectedProgram,
                        documentation: [
                          ...selectedProgram.documentation,
                          {
                            id: generateId('doc'),
                            title: newDocTitle.trim(),
                            url: newDocUrl.trim(),
                            type: 'link',
                            addedAt: new Date().toISOString(),
                          },
                        ],
                      });
                      setNewDocTitle('');
                      setNewDocUrl('');
                    }}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white dark:bg-indigo-600 cursor-pointer"
                  >
                    + Tautan
                  </button>
                </div>

                <label className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 cursor-pointer">
                  <ImagePlus className="h-4 w-4" />
                  Unggah Foto Bukti dari Perangkat
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImageDoc}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
              Evaluasi Pasca Kegiatan
            </h2>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Hal yang Berhasil
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={selectedProgram.evaluation?.whatWorked || ''}
                onChange={(e) =>
                  setSelectedProgram({
                    ...selectedProgram,
                    evaluation: {
                      whatWorked: e.target.value,
                      obstacles: selectedProgram.evaluation?.obstacles || '',
                      recommendations: selectedProgram.evaluation?.recommendations || '',
                      satisfactionScore: selectedProgram.evaluation?.satisfactionScore || 4,
                      evaluatedAt: new Date().toISOString(),
                    },
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Kendala di Lapangan
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={selectedProgram.evaluation?.obstacles || ''}
                onChange={(e) =>
                  setSelectedProgram({
                    ...selectedProgram,
                    evaluation: {
                      whatWorked: selectedProgram.evaluation?.whatWorked || '',
                      obstacles: e.target.value,
                      recommendations: selectedProgram.evaluation?.recommendations || '',
                      satisfactionScore: selectedProgram.evaluation?.satisfactionScore || 4,
                      evaluatedAt: new Date().toISOString(),
                    },
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Rekomendasi Perbaikan
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={selectedProgram.evaluation?.recommendations || ''}
                onChange={(e) =>
                  setSelectedProgram({
                    ...selectedProgram,
                    evaluation: {
                      whatWorked: selectedProgram.evaluation?.whatWorked || '',
                      obstacles: selectedProgram.evaluation?.obstacles || '',
                      recommendations: e.target.value,
                      satisfactionScore: selectedProgram.evaluation?.satisfactionScore || 4,
                      evaluatedAt: new Date().toISOString(),
                    },
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Skor Kepuasan Peserta (1–5)
              </label>
              <div className="mt-1.5 flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={!canEdit}
                    onClick={() =>
                      setSelectedProgram({
                        ...selectedProgram,
                        evaluation: {
                          whatWorked: selectedProgram.evaluation?.whatWorked || '',
                          obstacles: selectedProgram.evaluation?.obstacles || '',
                          recommendations: selectedProgram.evaluation?.recommendations || '',
                          satisfactionScore: s,
                          evaluatedAt: new Date().toISOString(),
                        },
                      })
                    }
                    className={`h-9 w-10 rounded-xl border text-xs font-bold tabular-nums cursor-pointer ${
                      (selectedProgram.evaluation?.satisfactionScore || 0) === s
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Manajemen {workspace.terms.programPlural} &amp; Monev
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Pantau indikator keberhasilan, checklist tugas, anggaran, dokumentasi, dan evaluasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'semua' | ProgramStatus)}
            className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="semua">Semua Status</option>
            {['Perencanaan', 'Berjalan', 'Selesai', 'Tertunda', 'Dibatalkan'].map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {canEdit && (
            <button
              type="button"
              onClick={() => setTemplatePickerOpen(true)}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Buat {workspace.terms.programSingular} Baru
            </button>
          )}
        </div>
      </div>

      {/* Modal Pilihan Template Program */}
      {templatePickerOpen && (
        <div className="rounded-3xl border border-indigo-200 bg-white p-6 shadow-md dark:border-indigo-900 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
              Pilih Template {workspace.terms.programSingular}
            </h2>
            <button
              type="button"
              onClick={() => setTemplatePickerOpen(false)}
              className="text-xs font-bold text-slate-500 cursor-pointer"
            >
              Tutup
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PROGRAM_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleStartFromTemplate(tpl)}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-indigo-400 dark:border-slate-800 dark:bg-slate-950 cursor-pointer"
              >
                <div className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  {tpl.name}
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{tpl.description}</p>
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleStartFromTemplate(undefined)}
              className="rounded-2xl border border-dashed border-slate-300 p-4 text-left hover:border-indigo-400 dark:border-slate-700 cursor-pointer"
            >
              <div className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Mulai Kosong
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Susun sendiri indikator, tugas, dan jadwal dari nol.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Daftar Program */}
      {filteredPrograms.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="font-display text-base font-bold text-slate-800 dark:text-slate-200">
            Belum ada {workspace.terms.programSingular.toLowerCase()} pada filter ini
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Kamu bisa membuat {workspace.terms.programSingular.toLowerCase()} baru atau mengangkatnya
            langsung dari detail sebuah kartu ide.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredPrograms.map((prg) => {
            const bidang = workspace.bidangList.find((b) => b.id === prg.bidangId);
            const colorCfg = bidang ? BIDANG_COLOR_MAP[bidang.color] : BIDANG_COLOR_MAP.purple;
            const health = getProgramHealthSignal(prg);
            const doneTasks = prg.tasks.filter((t) => t.done).length;

            return (
              <button
                key={prg.id}
                type="button"
                onClick={() => setSelectedProgram(prg)}
                className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 transition-all cursor-pointer"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span className={`h-2.5 w-2.5 rounded-full ${colorCfg.dot}`} />
                    {bidang?.name || 'Umum'}
                  </span>
                  <SignalTextBadge signal={health.signal} label={health.label} />
                </div>

                <h3 className="mt-2.5 font-display text-lg font-extrabold text-slate-900 dark:text-white">
                  {prg.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                  {prg.objective || prg.background}
                </p>

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className={getProgramStatusTextColor(prg.status)}>{prg.status}</span>
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {prg.progressPercent}% ({doneTasks}/{prg.tasks.length} tugas)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{ width: `${prg.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    PJ: {prg.picName || '-'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateId(prg.scheduleDate)}
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatRupiah(prg.budgetRealized)} / {formatRupiah(prg.budgetPlanned)}
                  </span>
                </div>

                {health.signal === 'merah' && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Perlu tindak lanjut: ada tugas melewati tenggat</span>
                  </div>
                )}
                {prg.status === 'Selesai' && prg.evaluation && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Evaluasi pasca kegiatan terisi (Skor {prg.evaluation.satisfactionScore}/5)</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
