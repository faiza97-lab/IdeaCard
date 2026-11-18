import {
  AnonymousVaultEntry,
  AppNotification,
  AppreciationBadge,
  Idea,
  IdeaAddition,
  IdeaComment,
  IdeaStatus,
  ModerationStatus,
  ProposalType,
  ReflectionEntry,
  User,
  ViolationReport,
  WorkspaceRole,
} from '../types/ideacard';
import { STORAGE_KEYS, generateId, readStorage, writeStorage } from './storageService';

// Filter kata kasar / perundungan dasar Bahasa Indonesia
const BLOCKED_WORDS = [
  'bodoh',
  'goblok',
  'tolol',
  'anjing',
  'bangsat',
  'bajingan',
  'bego',
  'idiot',
  'kampret',
  'brengsek',
  'pecundang',
  'sampah',
];

export function checkProfanity(text: string): { clean: boolean; flaggedWords: string[] } {
  const lower = text.toLowerCase();
  const flaggedWords = BLOCKED_WORDS.filter((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lower);
  });
  return { clean: flaggedWords.length === 0, flaggedWords };
}

export function getAllIdeas(): Idea[] {
  return readStorage<Idea[]>(STORAGE_KEYS.IDEAS, []);
}

export function getIdeasByWorkspace(workspaceId: string, periodId?: string): Idea[] {
  return getAllIdeas()
    .filter((i) => i.workspaceId === workspaceId && (!periodId || i.periodId === periodId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getMyIdeas(workspaceId: string, userId: string): Idea[] {
  const vault = readStorage<AnonymousVaultEntry[]>(STORAGE_KEYS.ANON_VAULT, []);
  const myAnonIdeaIds = new Set(
    vault.filter((v) => v.workspaceId === workspaceId && v.authorId === userId).map((v) => v.ideaId)
  );
  return getIdeasByWorkspace(workspaceId).filter(
    (idea) => idea.authorId === userId || myAnonIdeaIds.has(idea.id)
  );
}

export function getPublicIdeas(workspaceId: string, periodId?: string): Idea[] {
  return getIdeasByWorkspace(workspaceId, periodId).filter(
    (idea) =>
      idea.moderationStatus === 'disetujui' &&
      (idea.isAnonymous || idea.showAuthorNameInPublic)
  );
}

export function createIdea(params: {
  workspaceId: string;
  periodId: string;
  user: User;
  title: string;
  content: string;
  category: string;
  bidangId: string;
  proposalType: ProposalType;
  estimatedBenefit: string;
  isAnonymous: boolean;
  showAuthorNameInPublic: boolean;
  wantOralDiscussion: boolean;
  autoApproveModeration?: boolean;
}): { idea: Idea } | { error: string } {
  const profanity = checkProfanity(`${params.title} ${params.content} ${params.estimatedBenefit}`);
  if (!profanity.clean) {
    return {
      error: `Terdapat kata yang kurang pantas (${profanity.flaggedWords.join(', ')}). Mari gunakan bahasa yang saling menghargai.`,
    };
  }

  const now = new Date().toISOString();
  const ideaId = generateId('idea');
  const display = params.isAnonymous
    ? 'Anonim'
    : params.user.displayName || params.user.username;

  const newIdea: Idea = {
    id: ideaId,
    workspaceId: params.workspaceId,
    periodId: params.periodId,
    title: params.title.trim(),
    content: params.content.trim(),
    category: params.category,
    bidangId: params.bidangId,
    proposalType: params.proposalType,
    estimatedBenefit: params.estimatedBenefit.trim(),
    isAnonymous: params.isAnonymous,
    showAuthorNameInPublic: params.isAnonymous ? true : params.showAuthorNameInPublic,
    authorId: params.isAnonymous ? null : params.user.id,
    authorDisplayName: display,
    wantOralDiscussion: params.wantOralDiscussion,
    status: 'Baru',
    moderationStatus: params.autoApproveModeration ? 'disetujui' : 'menunggu',
    themeGroup: 'Belum Dikelompokkan',
    votes: [],
    additions: [],
    comments: [],
    createdAt: now,
    updatedAt: now,
  };

  const ideas = getAllIdeas();
  writeStorage(STORAGE_KEYS.IDEAS, [newIdea, ...ideas]);

  // Simpan identitas penulis anonim di penyimpanan terpisah
  if (params.isAnonymous) {
    const vault = readStorage<AnonymousVaultEntry[]>(STORAGE_KEYS.ANON_VAULT, []);
    vault.push({
      ideaId,
      workspaceId: params.workspaceId,
      authorId: params.user.id,
      authorUsername: params.user.username,
      createdAt: now,
    });
    writeStorage(STORAGE_KEYS.ANON_VAULT, vault);
  }

  return { idea: newIdea };
}

export function addIdeaExtension(params: {
  ideaId: string;
  user: User;
  content: string;
  isAnonymous: boolean;
}): { idea: Idea } | { error: string } {
  const profanity = checkProfanity(params.content);
  if (!profanity.clean) {
    return {
      error: `Tambahan ide mengandung kata yang kurang membangun (${profanity.flaggedWords.join(', ')}). Ingat prinsip brainwriting: tambah & bangun tanpa menyerang.`,
    };
  }

  const ideas = getAllIdeas();
  const idx = ideas.findIndex((i) => i.id === params.ideaId);
  if (idx === -1) return { error: 'Ide tidak ditemukan.' };

  const addition: IdeaAddition = {
    id: generateId('add'),
    ideaId: params.ideaId,
    authorId: params.user.id,
    authorDisplay: params.isAnonymous
      ? 'Pengembang Anonim'
      : params.user.displayName || params.user.username,
    isAnonymous: params.isAnonymous,
    content: params.content.trim(),
    createdAt: new Date().toISOString(),
  };

  const target = ideas[idx];
  const updated: Idea = {
    ...target,
    additions: [...target.additions, addition],
    updatedAt: new Date().toISOString(),
  };
  ideas[idx] = updated;
  writeStorage(STORAGE_KEYS.IDEAS, ideas);

  // Kirim notifikasi ke penulis ide (termasuk jika anonim melalui vault)
  const ownerId = getIdeaTrueAuthorId(target);
  if (ownerId && ownerId !== params.user.id) {
    pushNotification({
      workspaceId: target.workspaceId,
      userId: ownerId,
      title: 'Idemu dikembangkan!',
      message: `${addition.authorDisplay} menambahkan gagasan lanjutan pada "${target.title}".`,
      type: 'success',
      linkTab: 'detail',
      linkId: target.id,
    });
  }

  return { idea: updated };
}

export function toggleVoteIdea(ideaId: string, userId: string): Idea | undefined {
  const ideas = getAllIdeas();
  const idx = ideas.findIndex((i) => i.id === ideaId);
  if (idx === -1) return undefined;
  const idea = ideas[idx];
  const hasVoted = idea.votes.includes(userId);
  const votes = hasVoted ? idea.votes.filter((v) => v !== userId) : [...idea.votes, userId];
  const updated: Idea = { ...idea, votes, updatedAt: new Date().toISOString() };
  ideas[idx] = updated;
  writeStorage(STORAGE_KEYS.IDEAS, ideas);
  return updated;
}

export function addIdeaComment(params: {
  ideaId: string;
  user: User;
  role: WorkspaceRole;
  content: string;
  isAdvisorNote?: boolean;
  autoApprove?: boolean;
}): { idea: Idea } | { error: string } {
  const profanity = checkProfanity(params.content);
  if (!profanity.clean) {
    return {
      error: `Komentar terdeteksi mengandung kata yang kurang sopan (${profanity.flaggedWords.join(', ')}).`,
    };
  }
  const ideas = getAllIdeas();
  const idx = ideas.findIndex((i) => i.id === params.ideaId);
  if (idx === -1) return { error: 'Ide tidak ditemukan.' };

  const comment: IdeaComment = {
    id: generateId('cmt'),
    ideaId: params.ideaId,
    authorId: params.user.id,
    authorDisplay: params.user.displayName || params.user.username,
    authorRole: params.role,
    isAdvisorNote: params.isAdvisorNote,
    content: params.content.trim(),
    moderationStatus: params.autoApprove ? 'disetujui' : 'menunggu',
    createdAt: new Date().toISOString(),
  };

  ideas[idx] = {
    ...ideas[idx],
    comments: [...ideas[idx].comments, comment],
    updatedAt: new Date().toISOString(),
  };
  writeStorage(STORAGE_KEYS.IDEAS, ideas);
  return { idea: ideas[idx] };
}

export function moderateComment(
  ideaId: string,
  commentId: string,
  decision: ModerationStatus
): Idea | undefined {
  const ideas = getAllIdeas();
  const idx = ideas.findIndex((i) => i.id === ideaId);
  if (idx === -1) return undefined;
  ideas[idx] = {
    ...ideas[idx],
    comments: ideas[idx].comments.map((c) =>
      c.id === commentId ? { ...c, moderationStatus: decision } : c
    ),
  };
  writeStorage(STORAGE_KEYS.IDEAS, ideas);
  return ideas[idx];
}

export function updateIdeaStatus(
  ideaId: string,
  status: IdeaStatus,
  reason?: string,
  linkedProgramId?: string
): Idea | undefined {
  const ideas = getAllIdeas();
  const idx = ideas.findIndex((i) => i.id === ideaId);
  if (idx === -1) return undefined;
  const target = ideas[idx];
  const updated: Idea = {
    ...target,
    status,
    statusReason: reason?.trim() || target.statusReason,
    linkedProgramId: linkedProgramId || target.linkedProgramId,
    updatedAt: new Date().toISOString(),
  };
  ideas[idx] = updated;
  writeStorage(STORAGE_KEYS.IDEAS, ideas);

  const ownerId = getIdeaTrueAuthorId(target);
  if (ownerId) {
    pushNotification({
      workspaceId: target.workspaceId,
      userId: ownerId,
      title: `Status ide berubah: ${status}`,
      message: reason
        ? `Ide "${target.title}" kini berstatus ${status}. Catatan: ${reason}`
        : `Ide "${target.title}" kini berstatus ${status}.`,
      type: status === 'Ditolak' ? 'warning' : 'info',
      linkTab: 'detail',
      linkId: target.id,
    });
  }
  return updated;
}

export function updateIdeaModeration(
  ideaId: string,
  moderationStatus: ModerationStatus,
  reason?: string
): Idea | undefined {
  const ideas = getAllIdeas();
  const idx = ideas.findIndex((i) => i.id === ideaId);
  if (idx === -1) return undefined;
  const target = ideas[idx];
  const updated: Idea = {
    ...target,
    moderationStatus,
    status: moderationStatus === 'ditolak' ? 'Ditolak' : target.status,
    statusReason: reason || target.statusReason,
    updatedAt: new Date().toISOString(),
  };
  ideas[idx] = updated;
  writeStorage(STORAGE_KEYS.IDEAS, ideas);

  const ownerId = getIdeaTrueAuthorId(target);
  if (ownerId) {
    pushNotification({
      workspaceId: target.workspaceId,
      userId: ownerId,
      title:
        moderationStatus === 'disetujui'
          ? 'Idemu lolos moderasi!'
          : 'Ide perlu penyesuaian',
      message:
        moderationStatus === 'disetujui'
          ? `Ide "${target.title}" sudah tampil di Dashboard Publik.`
          : `Ide "${target.title}" tidak ditayangkan. ${reason || ''}`,
      type: moderationStatus === 'disetujui' ? 'success' : 'warning',
      linkTab: 'detail',
      linkId: target.id,
    });
  }
  return updated;
}

export function updateIdeaThemeGroup(ideaId: string, themeGroup: string): Idea | undefined {
  const ideas = getAllIdeas();
  const idx = ideas.findIndex((i) => i.id === ideaId);
  if (idx === -1) return undefined;
  const current = ideas[idx];
  const nextStatus: IdeaStatus =
    current.status === 'Baru' && themeGroup !== 'Belum Dikelompokkan'
      ? 'Dikelompokkan'
      : current.status;
  ideas[idx] = {
    ...current,
    themeGroup,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };
  writeStorage(STORAGE_KEYS.IDEAS, ideas);
  return ideas[idx];
}

// Pencarian identitas asli dari vault terpisah (hanya untuk notifikasi pribadi atau admin saat ada laporan)
function getIdeaTrueAuthorId(idea: Idea): string | null {
  if (idea.authorId) return idea.authorId;
  const vault = readStorage<AnonymousVaultEntry[]>(STORAGE_KEYS.ANON_VAULT, []);
  return vault.find((v) => v.ideaId === idea.id)?.authorId ?? null;
}

export function getReportsByWorkspace(workspaceId: string): ViolationReport[] {
  return readStorage<ViolationReport[]>(STORAGE_KEYS.REPORTS, []).filter(
    (r) => r.workspaceId === workspaceId
  );
}

export function submitViolationReport(params: {
  workspaceId: string;
  ideaId: string;
  reportedByUserId: string;
  reportedByName: string;
  reason: string;
}): ViolationReport {
  const reports = readStorage<ViolationReport[]>(STORAGE_KEYS.REPORTS, []);
  const report: ViolationReport = {
    id: generateId('rpt'),
    ...params,
    status: 'terbuka',
    createdAt: new Date().toISOString(),
  };
  writeStorage(STORAGE_KEYS.REPORTS, [report, ...reports]);
  return report;
}

// HANYA boleh dipanggil Admin ketika ada laporan pelanggaran aktif pada ide tersebut
export function revealAnonymousAuthorForReport(
  reportId: string,
  adminUsername: string
): { username: string } | { error: string } {
  const reports = readStorage<ViolationReport[]>(STORAGE_KEYS.REPORTS, []);
  const idx = reports.findIndex((r) => r.id === reportId);
  if (idx === -1) return { error: 'Laporan tidak ditemukan.' };
  const report = reports[idx];

  const vault = readStorage<AnonymousVaultEntry[]>(STORAGE_KEYS.ANON_VAULT, []);
  const entry = vault.find((v) => v.ideaId === report.ideaId);
  if (!entry) {
    return { error: 'Ide ini tidak menggunakan mode anonim atau data vault tidak tersedia.' };
  }

  reports[idx] = {
    ...report,
    status: 'ditinjau',
    identityRevealedByAdmin: adminUsername,
    identityRevealedAt: new Date().toISOString(),
  };
  writeStorage(STORAGE_KEYS.REPORTS, reports);
  return { username: entry.authorUsername };
}

export function resolveReport(reportId: string, note: string): void {
  const reports = readStorage<ViolationReport[]>(STORAGE_KEYS.REPORTS, []);
  const idx = reports.findIndex((r) => r.id === reportId);
  if (idx === -1) return;
  reports[idx] = {
    ...reports[idx],
    status: 'selesai',
    resolutionNote: note,
  };
  writeStorage(STORAGE_KEYS.REPORTS, reports);
}

// Refleksi Keberanian 1-5 setelah kirim ide
export function saveReflection(params: {
  workspaceId: string;
  userId: string;
  ideaId: string;
  comfortScore: number;
  safetyScore: number;
}): ReflectionEntry {
  const all = readStorage<ReflectionEntry[]>(STORAGE_KEYS.REFLECTIONS, []);
  const entry: ReflectionEntry = {
    id: generateId('ref'),
    ...params,
    createdAt: new Date().toISOString(),
  };
  writeStorage(STORAGE_KEYS.REFLECTIONS, [entry, ...all]);
  return entry;
}

export function getUserReflections(workspaceId: string, userId: string): ReflectionEntry[] {
  return readStorage<ReflectionEntry[]>(STORAGE_KEYS.REFLECTIONS, []).filter(
    (r) => r.workspaceId === workspaceId && r.userId === userId
  );
}

// Notifikasi dalam aplikasi
export function getNotifications(workspaceId: string, userId: string): AppNotification[] {
  return readStorage<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, [])
    .filter((n) => n.workspaceId === workspaceId && n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function pushNotification(
  params: Omit<AppNotification, 'id' | 'read' | 'createdAt'>
): void {
  const all = readStorage<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  const notif: AppNotification = {
    id: generateId('ntf'),
    ...params,
    read: false,
    createdAt: new Date().toISOString(),
  };
  writeStorage(STORAGE_KEYS.NOTIFICATIONS, [notif, ...all.slice(0, 99)]);
}

export function markAllNotificationsRead(workspaceId: string, userId: string): void {
  const all = readStorage<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  const updated = all.map((n) =>
    n.workspaceId === workspaceId && n.userId === userId ? { ...n, read: true } : n
  );
  writeStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
}

// Lencana Apresiasi Keberanian Berkontribusi (bukan kompetisi ide "paling benar")
export function computeUserBadges(workspaceId: string, userId: string): AppreciationBadge[] {
  const myIdeas = getMyIdeas(workspaceId, userId);
  const allIdeas = getIdeasByWorkspace(workspaceId);
  const myAdditionsCount = allIdeas.reduce(
    (acc, idea) => acc + idea.additions.filter((a) => a.authorId === userId).length,
    0
  );
  const myOralCount = myIdeas.filter((i) => i.wantOralDiscussion).length;

  // Cek konsistensi minggu unik berkontribusi
  const weekBuckets = new Set<string>();
  myIdeas.forEach((idea) => {
    const d = new Date(idea.createdAt);
    const week = Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000));
    weekBuckets.add(String(week));
  });
  allIdeas.forEach((idea) => {
    idea.additions
      .filter((a) => a.authorId === userId)
      .forEach((a) => {
        const d = new Date(a.createdAt);
        const week = Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000));
        weekBuckets.add(String(week));
      });
  });

  const weeksActive = weekBuckets.size;

  return [
    {
      id: 'badge_pemantik',
      name: 'Pemantik Ide',
      description: 'Berani menuliskan gagasan pertama di ruang kelompok.',
      criteriaText: 'Kirim minimal 1 ide (termasuk mode anonim)',
      earned: myIdeas.length >= 1,
      progressText: `${Math.min(myIdeas.length, 1)}/1 ide`,
      color: 'purple',
    },
    {
      id: 'badge_pengembang',
      name: 'Pengembang Ide',
      description: 'Aktif memperkaya ide teman lewat tambahan membangun tanpa mencela.',
      criteriaText: 'Beri minimal 2 Tambahan Ide',
      earned: myAdditionsCount >= 2,
      progressText: `${Math.min(myAdditionsCount, 2)}/2 tambahan`,
      color: 'mint',
    },
    {
      id: 'badge_konsisten',
      name: 'Konsisten 4 Minggu',
      description: 'Terus berpartisipasi secara berkala menjaga kotak ide tetap hidup.',
      criteriaText: 'Aktif berkontribusi di 4 minggu berbeda',
      earned: weeksActive >= 4,
      progressText: `${Math.min(weeksActive, 4)}/4 minggu`,
      color: 'amber',
    },
    {
      id: 'badge_jembatan',
      name: 'Penjembatan Diskusi',
      description: 'Mengajukan ide yang siap dibahas lisan bersama di forum nyata.',
      criteriaText: 'Ajukan 1 ide dengan opsi "Mau dibahas lisan"',
      earned: myOralCount >= 1,
      progressText: `${Math.min(myOralCount, 1)}/1 ajuan`,
      color: 'sky',
    },
  ];
}
