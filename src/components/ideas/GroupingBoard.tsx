import { useMemo, useState } from 'react';
import { GripVertical, Plus, Sparkles } from 'lucide-react';
import { getPublicIdeas, updateIdeaThemeGroup } from '../../services/ideaService';
import { Idea, Workspace, WorkspaceRole } from '../../types/ideacard';
import { BIDANG_COLOR_MAP } from '../../utils/themeUtils';

interface GroupingBoardProps {
  workspace: Workspace;
  role: WorkspaceRole | null;
  onSelectIdea: (idea: Idea) => void;
  onRefresh: () => void;
}

export function GroupingBoard({
  workspace,
  role,
  onSelectIdea,
  onRefresh,
}: GroupingBoardProps) {
  const ideas = getPublicIdeas(workspace.id, workspace.activePeriodId);
  const [customThemes, setCustomThemes] = useState<string[]>([]);
  const [newThemeInput, setNewThemeInput] = useState('');
  const [draggedIdeaId, setDraggedIdeaId] = useState<string | null>(null);
  const [dragOverTheme, setDragOverTheme] = useState<string | null>(null);

  const canEdit = role === 'admin' || role === 'pengelola';

  const themeColumns = useMemo(() => {
    const set = new Set<string>(['Belum Dikelompokkan']);
    ideas.forEach((i) => set.add(i.themeGroup || 'Belum Dikelompokkan'));
    customThemes.forEach((t) => set.add(t));
    return Array.from(set);
  }, [ideas, customThemes]);

  function handleAddTheme(e: React.FormEvent) {
    e.preventDefault();
    const clean = newThemeInput.trim();
    if (!clean) return;
    if (!themeColumns.includes(clean)) {
      setCustomThemes((prev) => [...prev, clean]);
    }
    setNewThemeInput('');
  }

  function handleMoveIdea(ideaId: string, targetTheme: string) {
    if (!canEdit) return;
    updateIdeaThemeGroup(ideaId, targetTheme);
    onRefresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Papan Pengelompokan Ide (Sticky Notes)
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Seret kartu ide ke kolom tema yang sesuai sebelum {workspace.terms.meetingName}.
            {!canEdit && ' (Mode lihat untuk Pengamat)'}
          </p>
        </div>

        {canEdit && (
          <form onSubmit={handleAddTheme} className="flex items-center gap-2">
            <input
              type="text"
              value={newThemeInput}
              onChange={(e) => setNewThemeInput(e.target.value)}
              placeholder="Nama klaster tema baru..."
              className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Tambah Tema
            </button>
          </form>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 items-start">
        {themeColumns.map((themeName) => {
          const columnIdeas = ideas.filter(
            (i) => (i.themeGroup || 'Belum Dikelompokkan') === themeName
          );
          const isOver = dragOverTheme === themeName;

          return (
            <div
              key={themeName}
              onDragOver={(e) => {
                if (!canEdit) return;
                e.preventDefault();
                setDragOverTheme(themeName);
              }}
              onDragLeave={() => setDragOverTheme(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverTheme(null);
                const id = e.dataTransfer.getData('text/plain') || draggedIdeaId;
                if (id) {
                  handleMoveIdea(id, themeName);
                }
                setDraggedIdeaId(null);
              }}
              className={`w-80 shrink-0 rounded-3xl border p-4 transition-colors ${
                isOver
                  ? 'border-indigo-500 bg-indigo-50/70 dark:border-indigo-400 dark:bg-indigo-950/30'
                  : 'border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                <h2 className="font-display text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  {themeName}
                </h2>
                <span className="font-mono text-xs font-bold text-slate-500 tabular-nums shrink-0">
                  {columnIdeas.length}
                </span>
              </div>

              <div className="mt-3 space-y-3 min-h-[140px]">
                {columnIdeas.length === 0 ? (
                  <div className="flex h-28 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 text-center p-3 dark:border-slate-700">
                    <Sparkles className="h-4 w-4 text-slate-400" />
                    <p className="mt-1 text-xs text-slate-500">
                      Letakkan kartu ide ke sini
                    </p>
                  </div>
                ) : (
                  columnIdeas.map((idea) => {
                    const bidang = workspace.bidangList.find((b) => b.id === idea.bidangId);
                    const colorCfg = bidang
                      ? BIDANG_COLOR_MAP[bidang.color]
                      : BIDANG_COLOR_MAP.purple;

                    return (
                      <div
                        key={idea.id}
                        draggable={canEdit}
                        onDragStart={(e) => {
                          setDraggedIdeaId(idea.id);
                          e.dataTransfer.setData('text/plain', idea.id);
                        }}
                        className={`rounded-2xl border p-4 shadow-xs transition-transform ${
                          canEdit ? 'cursor-grab active:cursor-grabbing' : ''
                        } ${colorCfg.stickyBg} ${colorCfg.stickyBorder}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                            <span className={`h-2 w-2 rounded-full ${colorCfg.dot}`} />
                            {bidang?.name || 'Umum'}
                          </span>
                          {canEdit && (
                            <GripVertical className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onSelectIdea(idea)}
                          className="mt-2 block text-left font-display text-sm font-extrabold text-slate-900 hover:text-indigo-700 dark:text-white dark:hover:text-indigo-300 cursor-pointer"
                        >
                          {idea.title}
                        </button>

                        <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                          {idea.content}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{idea.votes.length} dukungan</span>
                          <span>{idea.status}</span>
                        </div>

                        {canEdit && (
                          <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/10">
                            <select
                              aria-label={`Pindahkan ${idea.title} ke tema`}
                              value={idea.themeGroup || 'Belum Dikelompokkan'}
                              onChange={(e) => handleMoveIdea(idea.id, e.target.value)}
                              className="w-full rounded-lg border border-black/10 bg-white/80 px-2 py-1 text-[11px] font-bold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                            >
                              {themeColumns.map((t) => (
                                <option key={t} value={t}>
                                  Tema: {t}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
