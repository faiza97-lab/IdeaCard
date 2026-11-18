import {
  BookOpen,
  Camera,
  Compass,
  HeartHandshake,
  Layers,
  Leaf,
  Lightbulb,
  Megaphone,
  Package,
  Palette,
  Settings,
  Shield,
  Sparkles,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';
import { AccentTheme, BidangColor, IdeaStatus, ProgramStatus, WorkspaceRole } from '../types/ideacard';

export const BIDANG_COLOR_MAP: Record<
  BidangColor,
  {
    label: string;
    dot: string;
    stickyBg: string;
    stickyBorder: string;
    text: string;
    softBg: string;
    hex: string;
  }
> = {
  purple: {
    label: 'Ungu',
    dot: 'bg-violet-500',
    stickyBg: 'bg-violet-50/90 dark:bg-violet-950/35',
    stickyBorder: 'border-violet-200/80 dark:border-violet-800/60',
    text: 'text-violet-700 dark:text-violet-300',
    softBg: 'bg-violet-100/70 dark:bg-violet-900/40',
    hex: '#8B5CF6',
  },
  sky: {
    label: 'Biru Langit',
    dot: 'bg-sky-500',
    stickyBg: 'bg-sky-50/90 dark:bg-sky-950/35',
    stickyBorder: 'border-sky-200/80 dark:border-sky-800/60',
    text: 'text-sky-700 dark:text-sky-300',
    softBg: 'bg-sky-100/70 dark:bg-sky-900/40',
    hex: '#0EA5E9',
  },
  mint: {
    label: 'Hijau Mint',
    dot: 'bg-emerald-500',
    stickyBg: 'bg-emerald-50/90 dark:bg-emerald-950/35',
    stickyBorder: 'border-emerald-200/80 dark:border-emerald-800/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    softBg: 'bg-emerald-100/70 dark:bg-emerald-900/40',
    hex: '#10B981',
  },
  amber: {
    label: 'Kuning Hangat',
    dot: 'bg-amber-500',
    stickyBg: 'bg-amber-50/95 dark:bg-amber-950/35',
    stickyBorder: 'border-amber-200/80 dark:border-amber-800/60',
    text: 'text-amber-800 dark:text-amber-300',
    softBg: 'bg-amber-100/70 dark:bg-amber-900/40',
    hex: '#F59E0B',
  },
  orange: {
    label: 'Oranye',
    dot: 'bg-orange-500',
    stickyBg: 'bg-orange-50/90 dark:bg-orange-950/35',
    stickyBorder: 'border-orange-200/80 dark:border-orange-800/60',
    text: 'text-orange-700 dark:text-orange-300',
    softBg: 'bg-orange-100/70 dark:bg-orange-900/40',
    hex: '#F97316',
  },
  coral: {
    label: 'Koral',
    dot: 'bg-rose-500',
    stickyBg: 'bg-rose-50/90 dark:bg-rose-950/35',
    stickyBorder: 'border-rose-200/80 dark:border-rose-800/60',
    text: 'text-rose-700 dark:text-rose-300',
    softBg: 'bg-rose-100/70 dark:bg-rose-900/40',
    hex: '#F43F5E',
  },
};

export const ACCENT_THEME_MAP: Record<
  AccentTheme,
  { label: string; button: string; soft: string; ring: string }
> = {
  indigo: {
    label: 'Indigo Utama',
    button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    soft: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
    ring: 'focus:ring-indigo-500',
  },
  sky: {
    label: 'Biru Langit',
    button: 'bg-sky-600 hover:bg-sky-700 text-white',
    soft: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
    ring: 'focus:ring-sky-500',
  },
  emerald: {
    label: 'Hijau Mint',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    soft: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    ring: 'focus:ring-emerald-500',
  },
  amber: {
    label: 'Kuning Hangat',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
    soft: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
    ring: 'focus:ring-amber-500',
  },
  rose: {
    label: 'Koral Cerah',
    button: 'bg-rose-600 hover:bg-rose-700 text-white',
    soft: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
    ring: 'focus:ring-rose-500',
  },
};

export const BIDANG_ICONS = [
  { name: 'HeartHandshake', label: 'Sosial & Karakter', Icon: HeartHandshake },
  { name: 'Shield', label: 'Kedisiplinan', Icon: Shield },
  { name: 'BookOpen', label: 'Akademik & Literasi', Icon: BookOpen },
  { name: 'Palette', label: 'Seni & Kreativitas', Icon: Palette },
  { name: 'Megaphone', label: 'Humas & Media', Icon: Megaphone },
  { name: 'Leaf', label: 'Lingkungan', Icon: Leaf },
  { name: 'Trophy', label: 'Olahraga & Prestasi', Icon: Trophy },
  { name: 'Users', label: 'Kebersamaan', Icon: Users },
  { name: 'Wallet', label: 'Keuangan & Kas', Icon: Wallet },
  { name: 'Sparkles', label: 'Inovasi', Icon: Sparkles },
  { name: 'Compass', label: 'Eksplorasi', Icon: Compass },
  { name: 'Package', label: 'Perlengkapan', Icon: Package },
  { name: 'Camera', label: 'Dokumentasi', Icon: Camera },
  { name: 'Settings', label: 'Operasional', Icon: Settings },
  { name: 'Lightbulb', label: 'Gagasan', Icon: Lightbulb },
  { name: 'Layers', label: 'Umum', Icon: Layers },
];

export function getBidangIconComponent(iconName: string) {
  return BIDANG_ICONS.find((i) => i.name === iconName)?.Icon ?? Layers;
}

export function getRoleLabel(role: WorkspaceRole): string {
  switch (role) {
    case 'admin':
      return 'Pemilik / Admin';
    case 'pengelola':
      return 'Pengelola / Anggota Inti';
    case 'anggota':
      return 'Anggota / Siswa';
    case 'pengamat':
      return 'Pengamat / Pembina';
  }
}

export function getIdeaStatusTextColor(status: IdeaStatus): string {
  switch (status) {
    case 'Baru':
      return 'text-sky-700 dark:text-sky-300';
    case 'Dikelompokkan':
      return 'text-violet-700 dark:text-violet-300';
    case 'Dibahas':
      return 'text-amber-700 dark:text-amber-300';
    case 'Disetujui':
      return 'text-emerald-700 dark:text-emerald-300';
    case 'Dijadikan Program':
      return 'text-indigo-700 dark:text-indigo-300';
    case 'Ditunda':
      return 'text-orange-700 dark:text-orange-300';
    case 'Ditolak':
      return 'text-rose-700 dark:text-rose-300';
  }
}

export function getProgramStatusTextColor(status: ProgramStatus): string {
  switch (status) {
    case 'Perencanaan':
      return 'text-sky-700 dark:text-sky-300';
    case 'Berjalan':
      return 'text-indigo-700 dark:text-indigo-300';
    case 'Selesai':
      return 'text-emerald-700 dark:text-emerald-300';
    case 'Tertunda':
      return 'text-amber-700 dark:text-amber-300';
    case 'Dibatalkan':
      return 'text-rose-700 dark:text-rose-300';
  }
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateId(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatMonthLabelId(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  const date = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}
