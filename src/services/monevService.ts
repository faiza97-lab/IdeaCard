import {
  MonthlyMonevNote,
  Program,
  ProgramStatus,
  ProgramTask,
} from '../types/ideacard';
import { STORAGE_KEYS, generateId, readStorage, writeStorage } from './storageService';
import { getIdeasByWorkspace, updateIdeaStatus } from './ideaService';

export interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  background: string;
  objective: string;
  targetAudience: string;
  defaultIndicators: { label: string; target: string }[];
  defaultTasks: string[];
}

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    id: 'tpl_acara',
    name: 'Acara / Kegiatan Bersama',
    description: 'Template acara sekolah, pentas, seminar, atau lomba.',
    background: 'Berawal dari aspirasi anggota untuk menghadirkan kegiatan kolaboratif yang inklusif.',
    objective: 'Meningkatkan kebersamaan dan partisipasi aktif seluruh anggota kelompok.',
    targetAudience: 'Seluruh anggota / siswa',
    defaultIndicators: [
      { label: 'Tingkat kehadiran peserta', target: 'Minimal 80% target peserta hadir' },
      { label: 'Skor kepuasan kegiatan', target: 'Rata-rata minimal 4.0 / 5.0' },
    ],
    defaultTasks: [
      'Menyusun panitia kecil dan pembagian tugas',
      'Mengajukan izin tempat dan jadwal',
      'Publikasi dan pendaftaran peserta',
      'Menyiapkan perlengkapan dan konsumsi',
      'Dokumentasi dan evaluasi pasca kegiatan',
    ],
  },
  {
    id: 'tpl_perbaikan',
    name: 'Perbaikan Fasilitas / Sistem',
    description: 'Menindaklanjuti keluhan atau usulan perbaikan fasilitas & alur kerja.',
    background: 'Menjawab masukan berulang terkait kenyamanan fasilitas atau kejelasan aturan.',
    objective: 'Mewujudkan lingkungan yang lebih nyaman, bersih, dan adil.',
    targetAudience: 'Pengguna fasilitas / seluruh anggota',
    defaultIndicators: [
      { label: 'Penyelesaian perbaikan fisik/sistem', target: '100% sesuai daftar kebutuhan' },
      { label: 'Umpan balik pasca perbaikan', target: 'Minimal 85% menyatakan lebih nyaman' },
    ],
    defaultTasks: [
      'Survei kondisi lapangan dan daftar kebutuhan',
      'Koordinasi dengan pembina / penanggung jawab terkait',
      'Pelaksanaan perbaikan atau pengadaan',
      'Uji coba dan sosialisasi aturan baru',
    ],
  },
  {
    id: 'tpl_edukasi',
    name: 'Kampanye / Literasi & Edukasi',
    description: 'Gerakan rutin, mading, pojok baca, atau kampanye kesadaran.',
    background: 'Membangun kebiasaan positif secara konsisten dengan pendekatan kreatif.',
    objective: 'Meningkatkan kesadaran dan keterlibatan rutin anggota.',
    targetAudience: 'Anggota ruang dan lingkungan sekitar',
    defaultIndicators: [
      { label: 'Rilis konten / sesi edukasi', target: '4 kali dalam 1 bulan' },
      { label: 'Partisipasi aktif anggota', target: 'Minimal 30 kontribusi/tanggapan' },
    ],
    defaultTasks: [
      'Menentukan tema dan materi utama',
      'Membuat desain poster / media publikasi',
      'Pelaksanaan kampanye mingguan',
      'Rekap dampak dan refleksi bulanan',
    ],
  },
];

export type TrafficSignal = 'hijau' | 'kuning' | 'merah';

export interface SignalInfo {
  signal: TrafficSignal;
  label: string;
}

export function getTaskHealthSignal(task: ProgramTask, referenceDate = new Date()): SignalInfo {
  if (task.done) {
    return { signal: 'hijau', label: 'Selesai' };
  }
  const due = new Date(`${task.dueDate}T23:59:59`);
  const diffDays = Math.ceil((due.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { signal: 'merah', label: `Terlambat ${Math.abs(diffDays)} hari` };
  }
  if (diffDays <= 3) {
    return { signal: 'kuning', label: diffDays === 0 ? 'Tenggat hari ini' : `${diffDays} hari lagi` };
  }
  return { signal: 'hijau', label: 'Sesuai jadwal' };
}

export function getProgramHealthSignal(program: Program, referenceDate = new Date()): SignalInfo {
  if (program.status === 'Selesai') {
    return { signal: 'hijau', label: 'Selesai Terlaksana' };
  }
  if (program.status === 'Dibatalkan') {
    return { signal: 'merah', label: 'Dibatalkan' };
  }
  if (program.status === 'Tertunda') {
    return { signal: 'kuning', label: 'Tertunda' };
  }
  const hasOverdueTask = program.tasks.some(
    (t) => getTaskHealthSignal(t, referenceDate).signal === 'merah'
  );
  const end = new Date(`${program.endDate}T23:59:59`);
  if (hasOverdueTask || end.getTime() < referenceDate.getTime()) {
    return { signal: 'merah', label: 'Ada Tugas Terlambat' };
  }
  const hasSoonTask = program.tasks.some(
    (t) => getTaskHealthSignal(t, referenceDate).signal === 'kuning'
  );
  if (hasSoonTask || (program.budgetPlanned > 0 && program.budgetRealized > program.budgetPlanned)) {
    return { signal: 'kuning', label: 'Perlu Perhatian' };
  }
  return { signal: 'hijau', label: 'Berjalan Lancar' };
}

export function getProgramsByWorkspace(workspaceId: string, periodId?: string): Program[] {
  return readStorage<Program[]>(STORAGE_KEYS.PROGRAMS, [])
    .filter((p) => p.workspaceId === workspaceId && (!periodId || p.periodId === periodId))
    .sort((a, b) => a.scheduleDate.localeCompare(b.scheduleDate));
}

export function saveProgram(program: Program): Program {
  const all = readStorage<Program[]>(STORAGE_KEYS.PROGRAMS, []);
  const idx = all.findIndex((p) => p.id === program.id);
  const now = new Date().toISOString();
  const computedProgress = computeProgressFromTasks(program);
  const finalProgram: Program = {
    ...program,
    progressPercent: program.status === 'Selesai' ? 100 : computedProgress,
    updatedAt: now,
  };

  if (idx === -1) {
    writeStorage(STORAGE_KEYS.PROGRAMS, [finalProgram, ...all]);
  } else {
    all[idx] = finalProgram;
    writeStorage(STORAGE_KEYS.PROGRAMS, all);
  }

  // Sinkronkan ide asal agar otomatis berstatus "Dijadikan Program"
  finalProgram.linkedIdeaIds.forEach((ideaId) => {
    updateIdeaStatus(ideaId, 'Dijadikan Program', undefined, finalProgram.id);
  });

  return finalProgram;
}

export function computeProgressFromTasks(program: Program): number {
  if (program.status === 'Selesai') return 100;
  if (program.tasks.length === 0) return program.progressPercent;
  const doneCount = program.tasks.filter((t) => t.done).length;
  return Math.round((doneCount / program.tasks.length) * 100);
}

export function createEmptyProgram(params: {
  workspaceId: string;
  periodId: string;
  bidangId: string;
  template?: ProgramTemplate;
  linkedIdeaIds?: string[];
  initialName?: string;
  initialBackground?: string;
}): Program {
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 14);
  const tpl = params.template;

  return {
    id: generateId('prg'),
    workspaceId: params.workspaceId,
    periodId: params.periodId,
    bidangId: params.bidangId,
    name: params.initialName || tpl?.name || '',
    background: params.initialBackground || tpl?.background || '',
    objective: tpl?.objective || '',
    targetAudience: tpl?.targetAudience || '',
    scheduleDate: now.toISOString().slice(0, 10),
    endDate: nextWeek.toISOString().slice(0, 10),
    budgetPlanned: 0,
    budgetRealized: 0,
    picName: '',
    teamMembers: [],
    status: 'Perencanaan' as ProgramStatus,
    progressPercent: 0,
    indicators: (tpl?.defaultIndicators || []).map((ind) => ({
      id: generateId('ind'),
      label: ind.label,
      target: ind.target,
      realization: '',
      achieved: false,
    })),
    tasks: (tpl?.defaultTasks || []).map((title, i) => {
      const due = new Date(now);
      due.setDate(due.getDate() + (i + 1) * 3);
      return {
        id: generateId('tsk'),
        title,
        picName: '',
        dueDate: due.toISOString().slice(0, 10),
        done: false,
      };
    }),
    documentation: [],
    linkedIdeaIds: params.linkedIdeaIds || [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function getOverdueReminders(workspaceId: string): {
  programId: string;
  programName: string;
  taskTitle: string;
  dueDate: string;
  daysLate: number;
}[] {
  const programs = getProgramsByWorkspace(workspaceId);
  const now = new Date();
  const reminders: {
    programId: string;
    programName: string;
    taskTitle: string;
    dueDate: string;
    daysLate: number;
  }[] = [];

  programs.forEach((p) => {
    if (p.status === 'Selesai' || p.status === 'Dibatalkan') return;
    p.tasks.forEach((t) => {
      if (t.done) return;
      const due = new Date(`${t.dueDate}T23:59:59`);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        reminders.push({
          programId: p.id,
          programName: p.name,
          taskTitle: t.title,
          dueDate: t.dueDate,
          daysLate: Math.abs(diffDays),
        });
      }
    });
  });

  return reminders;
}

export function getMonthlyMonevNote(
  workspaceId: string,
  monthKey: string
): MonthlyMonevNote | undefined {
  return readStorage<MonthlyMonevNote[]>(STORAGE_KEYS.MONTHLY_NOTES, []).find(
    (n) => n.workspaceId === workspaceId && n.monthKey === monthKey
  );
}

export function saveMonthlyMonevNote(params: {
  workspaceId: string;
  monthKey: string;
  evaluationSummary: string;
  followUpPlan: string;
  updatedBy: string;
}): MonthlyMonevNote {
  const all = readStorage<MonthlyMonevNote[]>(STORAGE_KEYS.MONTHLY_NOTES, []);
  const idx = all.findIndex(
    (n) => n.workspaceId === params.workspaceId && n.monthKey === params.monthKey
  );
  const note: MonthlyMonevNote = {
    id: idx !== -1 ? all[idx].id : generateId('mnote'),
    ...params,
    updatedAt: new Date().toISOString(),
  };
  if (idx === -1) {
    writeStorage(STORAGE_KEYS.MONTHLY_NOTES, [note, ...all]);
  } else {
    all[idx] = note;
    writeStorage(STORAGE_KEYS.MONTHLY_NOTES, all);
  }
  return note;
}

export function getMonthlySummary(workspaceId: string, monthKey: string) {
  const programs = getProgramsByWorkspace(workspaceId);
  const ideas = getIdeasByWorkspace(workspaceId);

  const monthIdeas = ideas.filter((i) => i.createdAt.slice(0, 7) === monthKey);
  const monthPrograms = programs.filter(
    (p) =>
      p.scheduleDate.slice(0, 7) === monthKey ||
      p.endDate.slice(0, 7) === monthKey ||
      (p.scheduleDate.slice(0, 7) <= monthKey && p.endDate.slice(0, 7) >= monthKey)
  );

  const plannedCount = monthPrograms.length;
  const completedCount = monthPrograms.filter((p) => p.status === 'Selesai').length;
  const totalTasks = monthPrograms.reduce((acc, p) => acc + p.tasks.length, 0);
  const doneTasks = monthPrograms.reduce(
    (acc, p) => acc + p.tasks.filter((t) => t.done).length,
    0
  );
  const totalBudgetPlanned = monthPrograms.reduce((acc, p) => acc + p.budgetPlanned, 0);
  const totalBudgetRealized = monthPrograms.reduce((acc, p) => acc + p.budgetRealized, 0);

  return {
    monthIdeasCount: monthIdeas.length,
    plannedCount,
    completedCount,
    totalTasks,
    doneTasks,
    taskRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
    totalBudgetPlanned,
    totalBudgetRealized,
    budgetAbsorptionRate:
      totalBudgetPlanned > 0
        ? Math.round((totalBudgetRealized / totalBudgetPlanned) * 100)
        : 0,
    monthPrograms,
    monthIdeas,
  };
}
