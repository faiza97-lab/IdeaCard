import {
  AccentTheme,
  Bidang,
  BidangColor,
  BidangProposal,
  IdeaStatus,
  Period,
  User,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceTemplateId,
  WorkspaceTerms,
} from '../types/ideacard';
import { STORAGE_KEYS, generateId, readStorage, writeStorage } from './storageService';

export interface WorkspaceTemplate {
  id: WorkspaceTemplateId;
  name: string;
  subtitle: string;
  defaultPrompt: string;
  accentTheme: AccentTheme;
  terms: WorkspaceTerms;
  categories: string[];
  bidangList: Omit<Bidang, 'id'>[];
}

export const DEFAULT_STATUSES: IdeaStatus[] = [
  'Baru',
  'Dikelompokkan',
  'Dibahas',
  'Disetujui',
  'Dijadikan Program',
  'Ditunda',
  'Ditolak',
];

export const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  {
    id: 'osis_sma',
    name: 'OSIS SMA / SMK',
    subtitle: 'Cocok untuk pengurus OSIS & MPK tingkat SMA/SMK dengan sistem Sekbid.',
    defaultPrompt: 'Kegiatan atau perbaikan apa yang paling dibutuhkan siswa di sekolah bulan ini?',
    accentTheme: 'indigo',
    terms: {
      programSingular: 'Proker',
      programPlural: 'Proker',
      bidangSingular: 'Sekbid',
      memberSingular: 'Siswa',
      meetingName: 'Rapat Pleno',
    },
    categories: ['Pertanyaan', 'Solusi', 'Pendapat', 'Aspirasi Fasilitas'],
    bidangList: [
      { name: 'Keagamaan & Karakter', color: 'mint', icon: 'HeartHandshake', picName: 'Koordinator Sekbid 1' },
      { name: 'Bela Negara & Kedisiplinan', color: 'sky', icon: 'Shield', picName: 'Koordinator Sekbid 2' },
      { name: 'Akademik & Literasi', color: 'purple', icon: 'BookOpen', picName: 'Koordinator Sekbid 3' },
      { name: 'Seni, Olahraga & Bakat', color: 'orange', icon: 'Palette', picName: 'Koordinator Sekbid 4' },
      { name: 'Humas & Media Kreatif', color: 'coral', icon: 'Megaphone', picName: 'Koordinator Sekbid 5' },
      { name: 'Lingkungan & Kewirausahaan', color: 'amber', icon: 'Leaf', picName: 'Koordinator Sekbid 6' },
    ],
  },
  {
    id: 'osis_smp',
    name: 'OSIS SMP',
    subtitle: 'Struktur sederhana dan ramah untuk pengurus OSIS tingkat SMP.',
    defaultPrompt: 'Ide kegiatan seru atau ramah siswa apa yang ingin kita adakan semester ini?',
    accentTheme: 'sky',
    terms: {
      programSingular: 'Program',
      programPlural: 'Program',
      bidangSingular: 'Sekbid',
      memberSingular: 'Siswa',
      meetingName: 'Rapat OSIS',
    },
    categories: ['Pertanyaan', 'Solusi', 'Pendapat'],
    bidangList: [
      { name: 'Keimanan & Budi Pekerti', color: 'mint', icon: 'Sparkles', picName: 'Ketua Sekbid A' },
      { name: 'Belajar & Perpustakaan', color: 'purple', icon: 'BookOpen', picName: 'Ketua Sekbid B' },
      { name: 'Olahraga & Seni', color: 'orange', icon: 'Trophy', picName: 'Ketua Sekbid C' },
      { name: 'Kebersihan & Lingkungan', color: 'amber', icon: 'Leaf', picName: 'Ketua Sekbid D' },
    ],
  },
  {
    id: 'kelas',
    name: 'Kelas / Wali Kelas',
    subtitle: 'Menjaring suara siswa yang pendiam untuk kesepakatan kelas dan acara bersama.',
    defaultPrompt: 'Apa yang bisa kita ubah agar suasana belajar di kelas terasa lebih nyaman dan adil?',
    accentTheme: 'emerald',
    terms: {
      programSingular: 'Agenda',
      programPlural: 'Agenda Kelas',
      bidangSingular: 'Seksi',
      memberSingular: 'Siswa',
      meetingName: 'Forum Kelas',
    },
    categories: ['Pertanyaan', 'Solusi', 'Pendapat', 'Usul Aturan'],
    bidangList: [
      { name: 'Kebersihan & Piket', color: 'mint', icon: 'Sparkles', picName: 'Seksi Kebersihan' },
      { name: 'Belajar & Tugas', color: 'purple', icon: 'BookOpen', picName: 'Seksi Pendidikan' },
      { name: 'Kas & Perlengkapan', color: 'amber', icon: 'Wallet', picName: 'Bendahara Kelas' },
      { name: 'Acara & Kebersamaan', color: 'coral', icon: 'Users', picName: 'Seksi Acara' },
    ],
  },
  {
    id: 'ekskul',
    name: 'Ekstrakurikuler / Klub',
    subtitle: 'Untuk klub hobi, Pramuka, PMR, robotika, paduan suara, atau olahraga.',
    defaultPrompt: 'Latihan atau proyek kolaborasi apa yang paling ingin kamu coba bulan depan?',
    accentTheme: 'amber',
    terms: {
      programSingular: 'Kegiatan',
      programPlural: 'Kegiatan',
      bidangSingular: 'Divisi',
      memberSingular: 'Anggota',
      meetingName: 'Kumpul Rutin',
    },
    categories: ['Pertanyaan', 'Solusi', 'Pendapat', 'Ide Latihan'],
    bidangList: [
      { name: 'Materi & Latihan', color: 'purple', icon: 'Compass', picName: 'Koordinator Latihan' },
      { name: 'Lomba & Pameran', color: 'orange', icon: 'Trophy', picName: 'Koordinator Lomba' },
      { name: 'Alat & Logistik', color: 'sky', icon: 'Package', picName: 'Koordinator Alat' },
      { name: 'Dokumentasi & Publikasi', color: 'coral', icon: 'Camera', picName: 'Tim Dokumentasi' },
    ],
  },
  {
    id: 'organisasi',
    name: 'Organisasi Kampus / Komunitas',
    subtitle: 'Himpunan mahasiswa, BEM, karang taruna, atau komunitas hobi.',
    defaultPrompt: 'Inisiatif berdampak apa yang paling relevan untuk anggota dan masyarakat sekitar?',
    accentTheme: 'indigo',
    terms: {
      programSingular: 'Program',
      programPlural: 'Program Kerja',
      bidangSingular: 'Divisi',
      memberSingular: 'Anggota',
      meetingName: 'Rapat Koordinasi',
    },
    categories: ['Pertanyaan', 'Solusi', 'Pendapat', 'Riset & Kebijakan'],
    bidangList: [
      { name: 'Kaderisasi & SDM', color: 'purple', icon: 'Users', picName: 'Kepala Divisi SDM' },
      { name: 'Pengabdian Masyarakat', color: 'mint', icon: 'HeartHandshake', picName: 'Kepala Divisi Sosmas' },
      { name: 'Kajian & Edukasi', color: 'sky', icon: 'BookOpen', picName: 'Kepala Divisi Kajian' },
      { name: 'Media & Kemitraan', color: 'coral', icon: 'Megaphone', picName: 'Kepala Divisi Media' },
    ],
  },
  {
    id: 'tim_kerja',
    name: 'Tim Kerja / Proyek',
    subtitle: 'Retrospektif aman, perbaikan alur kerja, dan inovasi produk atau layanan.',
    defaultPrompt: 'Hambatan proses apa yang paling perlu diperbaiki minggu ini?',
    accentTheme: 'rose',
    terms: {
      programSingular: 'Proyek',
      programPlural: 'Proyek',
      bidangSingular: 'Tim',
      memberSingular: 'Rekan Tim',
      meetingName: 'Sinkronisasi Mingguan',
    },
    categories: ['Pertanyaan', 'Solusi', 'Pendapat', 'Perbaikan Alur'],
    bidangList: [
      { name: 'Operasional & Alur', color: 'sky', icon: 'Settings', picName: 'Lead Operasional' },
      { name: 'Produk & Layanan', color: 'purple', icon: 'Lightbulb', picName: 'Lead Produk' },
      { name: 'Budaya & Kolaborasi', color: 'mint', icon: 'Users', picName: 'People Lead' },
    ],
  },
  {
    id: 'kosong',
    name: 'Kosong (Kustom Penuh)',
    subtitle: 'Mulai dari kanvas bersih dan susun sendiri bidang serta istilah kelompokmu.',
    defaultPrompt: 'Tulis gagasan, pertanyaan, atau saran terbaikmu untuk kelompok ini.',
    accentTheme: 'indigo',
    terms: {
      programSingular: 'Program',
      programPlural: 'Program',
      bidangSingular: 'Bidang',
      memberSingular: 'Anggota',
      meetingName: 'Diskusi Bersama',
    },
    categories: ['Pertanyaan', 'Solusi', 'Pendapat'],
    bidangList: [
      { name: 'Umum', color: 'purple', icon: 'Layers', picName: 'Koordinator Umum' },
    ],
  },
];

export function getWorkspaces(): Workspace[] {
  return readStorage<Workspace[]>(STORAGE_KEYS.WORKSPACES, []);
}

export function getWorkspaceById(workspaceId: string): Workspace | undefined {
  return getWorkspaces().find((w) => w.id === workspaceId);
}

export function getUserWorkspaces(userId: string): Workspace[] {
  return getWorkspaces().filter((w) => w.members.some((m) => m.userId === userId));
}

export function getMemberRole(workspace: Workspace, userId: string | null): WorkspaceRole | null {
  if (!userId) return null;
  return workspace.members.find((m) => m.userId === userId)?.role ?? null;
}

export function createWorkspace(params: {
  name: string;
  description: string;
  templateId: WorkspaceTemplateId;
  creator: User;
  customTerms?: Partial<WorkspaceTerms>;
  customBidangList?: Omit<Bidang, 'id'>[];
}): Workspace {
  const template =
    WORKSPACE_TEMPLATES.find((t) => t.id === params.templateId) ?? WORKSPACE_TEMPLATES[6];

  const periodId = generateId('prd');
  const now = new Date();
  const sixMonths = new Date(now);
  sixMonths.setMonth(sixMonths.getMonth() + 6);

  const initialPeriod: Period = {
    id: periodId,
    name: `Periode ${now.getFullYear()}`,
    startDate: now.toISOString().slice(0, 10),
    endDate: sixMonths.toISOString().slice(0, 10),
    isActive: true,
  };

  const sourceBidang =
    params.customBidangList && params.customBidangList.length > 0
      ? params.customBidangList
      : template.bidangList;

  const bidangList: Bidang[] = sourceBidang.map((b) => ({
    ...b,
    id: generateId('bdg'),
  }));

  const joinCode =
    params.name
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(0, 4) +
    '-' +
    Math.random().toString(36).substring(2, 6).toUpperCase();

  const workspace: Workspace = {
    id: generateId('ws'),
    name: params.name.trim(),
    description: params.description.trim() || template.subtitle,
    joinCode,
    templateId: template.id,
    accentTheme: template.accentTheme,
    isPublicLinkEnabled: true,
    activePrompt: template.defaultPrompt,
    terms: {
      ...template.terms,
      ...params.customTerms,
    },
    bidangList,
    categories: [...template.categories],
    statuses: [...DEFAULT_STATUSES],
    periods: [initialPeriod],
    activePeriodId: periodId,
    members: [
      {
        userId: params.creator.id,
        username: params.creator.username,
        displayName: params.creator.displayName || params.creator.username,
        role: 'admin',
        joinedAt: now.toISOString(),
      },
    ],
    createdAt: now.toISOString(),
  };

  const all = getWorkspaces();
  writeStorage(STORAGE_KEYS.WORKSPACES, [...all, workspace]);
  return workspace;
}

export function joinWorkspaceByCode(params: {
  code: string;
  user: User;
}): { workspace: Workspace } | { error: string } {
  const cleanCode = params.code.trim().toUpperCase();
  const workspaces = getWorkspaces();
  const idx = workspaces.findIndex((w) => w.joinCode.toUpperCase() === cleanCode);
  if (idx === -1) {
    return { error: 'Kode ruang tidak ditemukan. Periksa kembali kode dari admin ruangmu.' };
  }

  const ws = workspaces[idx];
  const alreadyMember = ws.members.some((m) => m.userId === params.user.id);
  if (!alreadyMember) {
    const newMember: WorkspaceMember = {
      userId: params.user.id,
      username: params.user.username,
      displayName: params.user.displayName || params.user.username,
      role: 'anggota',
      joinedAt: new Date().toISOString(),
    };
    workspaces[idx] = {
      ...ws,
      members: [...ws.members, newMember],
    };
    writeStorage(STORAGE_KEYS.WORKSPACES, workspaces);
  }
  return { workspace: workspaces[idx] };
}

export function updateWorkspace(updated: Workspace): void {
  const workspaces = getWorkspaces();
  const idx = workspaces.findIndex((w) => w.id === updated.id);
  if (idx !== -1) {
    workspaces[idx] = updated;
    writeStorage(STORAGE_KEYS.WORKSPACES, workspaces);
  }
}

export function updateMemberRole(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
  bidangId?: string
): Workspace | undefined {
  const ws = getWorkspaceById(workspaceId);
  if (!ws) return undefined;
  const updated: Workspace = {
    ...ws,
    members: ws.members.map((m) => (m.userId === userId ? { ...m, role, bidangId } : m)),
  };
  updateWorkspace(updated);
  return updated;
}

export function createNewPeriod(workspaceId: string, name: string, startDate: string, endDate: string): Workspace | undefined {
  const ws = getWorkspaceById(workspaceId);
  if (!ws) return undefined;
  const nowIso = new Date().toISOString();
  const newPeriod: Period = {
    id: generateId('prd'),
    name: name.trim(),
    startDate,
    endDate,
    isActive: true,
  };
  const updatedPeriods = ws.periods.map((p) =>
    p.isActive ? { ...p, isActive: false, archivedAt: p.archivedAt || nowIso } : p
  );
  const updated: Workspace = {
    ...ws,
    periods: [newPeriod, ...updatedPeriods],
    activePeriodId: newPeriod.id,
  };
  updateWorkspace(updated);
  return updated;
}

export function switchActivePeriod(workspaceId: string, periodId: string): Workspace | undefined {
  const ws = getWorkspaceById(workspaceId);
  if (!ws) return undefined;
  const updated: Workspace = {
    ...ws,
    activePeriodId: periodId,
    periods: ws.periods.map((p) => ({ ...p, isActive: p.id === periodId })),
  };
  updateWorkspace(updated);
  return updated;
}

// Usulan Bidang baru oleh Pengelola/Anggota Inti
export function getBidangProposals(workspaceId: string): BidangProposal[] {
  return readStorage<BidangProposal[]>(STORAGE_KEYS.BIDANG_PROPOSALS, []).filter(
    (p) => p.workspaceId === workspaceId
  );
}

export function submitBidangProposal(params: {
  workspaceId: string;
  proposedByUserId: string;
  proposedByName: string;
  name: string;
  color: BidangColor;
  icon: string;
  reason: string;
}): BidangProposal {
  const all = readStorage<BidangProposal[]>(STORAGE_KEYS.BIDANG_PROPOSALS, []);
  const proposal: BidangProposal = {
    id: generateId('bprop'),
    ...params,
    status: 'menunggu',
    createdAt: new Date().toISOString(),
  };
  writeStorage(STORAGE_KEYS.BIDANG_PROPOSALS, [proposal, ...all]);
  return proposal;
}

export function resolveBidangProposal(
  proposalId: string,
  decision: 'disetujui' | 'ditolak'
): void {
  const all = readStorage<BidangProposal[]>(STORAGE_KEYS.BIDANG_PROPOSALS, []);
  const idx = all.findIndex((p) => p.id === proposalId);
  if (idx === -1) return;
  const proposal = all[idx];
  all[idx] = { ...proposal, status: decision };
  writeStorage(STORAGE_KEYS.BIDANG_PROPOSALS, all);

  if (decision === 'disetujui') {
    const ws = getWorkspaceById(proposal.workspaceId);
    if (ws) {
      const newBidang: Bidang = {
        id: generateId('bdg'),
        name: proposal.name,
        color: proposal.color,
        icon: proposal.icon,
        picName: proposal.proposedByName,
        picUserId: proposal.proposedByUserId,
        description: proposal.reason,
      };
      updateWorkspace({
        ...ws,
        bidangList: [...ws.bidangList, newBidang],
      });
    }
  }
}
