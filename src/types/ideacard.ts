export type WorkspaceRole = 'admin' | 'pengelola' | 'anggota' | 'pengamat';

export type WorkspaceTemplateId =
  | 'osis_smp'
  | 'osis_sma'
  | 'kelas'
  | 'ekskul'
  | 'organisasi'
  | 'tim_kerja'
  | 'kosong';

export type AccentTheme = 'indigo' | 'sky' | 'emerald' | 'amber' | 'rose';

export interface User {
  id: string;
  username: string;
  displayName?: string;
  passwordHash: string;
  passwordSalt: string;
  recoveryCodeHash: string;
  internalAuthEmail: string; // e.g., username@ideacard.app (kept internal for Firebase swap)
  createdAt: string;
  mustChangePassword?: boolean;
}

export interface WorkspaceMember {
  userId: string;
  username: string;
  displayName: string;
  role: WorkspaceRole;
  bidangId?: string;
  joinedAt: string;
}

export interface Bidang {
  id: string;
  name: string;
  color: BidangColor;
  icon: string;
  picName: string;
  picUserId?: string;
  description?: string;
}

export type BidangColor = 'purple' | 'sky' | 'mint' | 'amber' | 'orange' | 'coral';

export interface BidangProposal {
  id: string;
  workspaceId: string;
  proposedByUserId: string;
  proposedByName: string;
  name: string;
  color: BidangColor;
  icon: string;
  reason: string;
  status: 'menunggu' | 'disetujui' | 'ditolak';
  createdAt: string;
}

export interface WorkspaceTerms {
  programSingular: string; // e.g. "Program", "Proker", "Proyek"
  programPlural: string;
  bidangSingular: string; // e.g. "Bidang", "Sekbid", "Divisi", "Kelompok"
  memberSingular: string; // e.g. "Anggota", "Siswa", "Pengurus"
  meetingName: string; // e.g. "Rapat", "Musyawarah", "Forum Kelas"
}

export interface Period {
  id: string;
  name: string; // e.g. "Semester Ganjil 2026/2027"
  startDate: string;
  endDate: string;
  isActive: boolean;
  archivedAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  joinCode: string;
  templateId: WorkspaceTemplateId;
  accentTheme: AccentTheme;
  isPublicLinkEnabled: boolean;
  activePrompt: string;
  terms: WorkspaceTerms;
  bidangList: Bidang[];
  categories: string[];
  statuses: IdeaStatus[];
  periods: Period[];
  activePeriodId: string;
  members: WorkspaceMember[];
  createdAt: string;
}

export type IdeaStatus =
  | 'Baru'
  | 'Dikelompokkan'
  | 'Dibahas'
  | 'Disetujui'
  | 'Dijadikan Program'
  | 'Ditunda'
  | 'Ditolak';

export type ProposalType = 'program' | 'acara' | 'perbaikan' | 'lainnya';

export type ModerationStatus = 'menunggu' | 'disetujui' | 'ditolak';

export interface IdeaAddition {
  id: string;
  ideaId: string;
  authorId: string;
  authorDisplay: string;
  isAnonymous: boolean;
  content: string;
  createdAt: string;
}

export interface IdeaComment {
  id: string;
  ideaId: string;
  authorId: string;
  authorDisplay: string;
  authorRole: WorkspaceRole;
  isAdvisorNote?: boolean;
  content: string;
  moderationStatus: ModerationStatus;
  createdAt: string;
}

export interface Idea {
  id: string;
  workspaceId: string;
  periodId: string;
  title: string;
  content: string;
  category: string;
  bidangId: string;
  proposalType: ProposalType;
  estimatedBenefit: string;
  isAnonymous: boolean;
  showAuthorNameInPublic: boolean;
  authorId: string | null; // null if anonymous (stored in separate anon vault)
  authorDisplayName: string; // "Anonim" if anonymous
  wantOralDiscussion: boolean;
  status: IdeaStatus;
  statusReason?: string;
  moderationStatus: ModerationStatus;
  themeGroup: string; // Cluster/theme for drag-and-drop grouping board
  votes: string[]; // array of userIds
  additions: IdeaAddition[];
  comments: IdeaComment[];
  linkedProgramId?: string;
  createdAt: string;
  updatedAt: string;
}

// Separate vault for anonymous author mapping — only accessible by Admin when violation report exists
export interface AnonymousVaultEntry {
  ideaId: string;
  workspaceId: string;
  authorId: string;
  authorUsername: string;
  createdAt: string;
}

export interface ViolationReport {
  id: string;
  workspaceId: string;
  ideaId: string;
  reportedByUserId: string;
  reportedByName: string;
  reason: string;
  status: 'terbuka' | 'ditinjau' | 'selesai';
  identityRevealedByAdmin?: string;
  identityRevealedAt?: string;
  resolutionNote?: string;
  createdAt: string;
}

export interface ReflectionEntry {
  id: string;
  workspaceId: string;
  userId: string;
  ideaId: string;
  comfortScore: number; // 1-5: "Saya nyaman menyampaikan ide"
  safetyScore: number; // 1-5: "Saya tidak takut diejek"
  createdAt: string;
}

export interface AppNotification {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  linkTab?: string;
  linkId?: string;
  read: boolean;
  createdAt: string;
}

export type ProgramStatus =
  | 'Perencanaan'
  | 'Berjalan'
  | 'Selesai'
  | 'Tertunda'
  | 'Dibatalkan';

export interface SuccessIndicator {
  id: string;
  label: string;
  target: string;
  realization: string;
  achieved: boolean;
}

export interface ProgramTask {
  id: string;
  title: string;
  picName: string;
  dueDate: string; // YYYY-MM-DD
  done: boolean;
}

export interface DocumentationProof {
  id: string;
  title: string;
  url: string;
  type: 'link' | 'image';
  addedAt: string;
}

export interface PostActivityEvaluation {
  whatWorked: string;
  obstacles: string;
  recommendations: string;
  satisfactionScore: number; // 1-5
  evaluatedAt: string;
}

export interface Program {
  id: string;
  workspaceId: string;
  periodId: string;
  bidangId: string;
  name: string;
  background: string;
  objective: string;
  targetAudience: string;
  scheduleDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  budgetPlanned: number;
  budgetRealized: number;
  picName: string;
  teamMembers: string[];
  status: ProgramStatus;
  progressPercent: number;
  indicators: SuccessIndicator[];
  tasks: ProgramTask[];
  documentation: DocumentationProof[];
  linkedIdeaIds: string[];
  evaluation?: PostActivityEvaluation;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyMonevNote {
  id: string;
  workspaceId: string;
  monthKey: string; // YYYY-MM
  evaluationSummary: string;
  followUpPlan: string;
  updatedBy: string;
  updatedAt: string;
}

export interface AppreciationBadge {
  id: string;
  name: string;
  description: string;
  criteriaText: string;
  earned: boolean;
  progressText: string;
  color: BidangColor;
}
