import { useState } from 'react';
import {
  ArrowLeftRight,
  Bell,
  CalendarCheck,
  ClipboardList,
  FolderKanban,
  Globe2,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  PenSquare,
  Settings,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import {
  AppNotification,
  User,
  Workspace,
  WorkspaceRole,
} from '../../types/ideacard';
import { ACCENT_THEME_MAP, getRoleLabel } from '../../utils/themeUtils';

export type ActiveTab =
  | 'personal'
  | 'publik'
  | 'kelompok'
  | 'program'
  | 'monev_bulanan'
  | 'moderasi'
  | 'pengaturan';

interface AppShellProps {
  workspace: Workspace;
  user: User | null;
  role: WorkspaceRole | null;
  isGuest: boolean;
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenWriteIdea: () => void;
  onSwitchWorkspace: () => void;
  onLogout: () => void;
  onExitGuestToAuth: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  notifications: AppNotification[];
  overdueCount: number;
  pendingModerationCount: number;
  onMarkAllRead: () => void;
  onOpenNotificationTarget: (notif: AppNotification) => void;
  children: React.ReactNode;
}

export function AppShell({
  workspace,
  user,
  role,
  isGuest,
  activeTab,
  onChangeTab,
  onOpenWriteIdea,
  onSwitchWorkspace,
  onLogout,
  onExitGuestToAuth,
  darkMode,
  onToggleDarkMode,
  notifications,
  overdueCount,
  pendingModerationCount,
  onMarkAllRead,
  onOpenNotificationTarget,
  children,
}: AppShellProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const accent = ACCENT_THEME_MAP[workspace.accentTheme] || ACCENT_THEME_MAP.indigo;

  const canManageIdeas = role === 'admin' || role === 'pengelola';
  const canModerate = role === 'admin' || role === 'pengelola';

  const navItems: {
    id: ActiveTab;
    label: string;
    shortLabel: string;
    Icon: typeof Home;
    badge?: number;
    hidden?: boolean;
  }[] = [
    {
      id: 'personal',
      label: 'Dashboard Saya',
      shortLabel: 'Saya',
      Icon: Home,
      hidden: isGuest,
    },
    {
      id: 'publik',
      label: 'Dashboard Publik',
      shortLabel: 'Publik',
      Icon: Globe2,
    },
    {
      id: 'kelompok',
      label: 'Papan Kelompok',
      shortLabel: 'Kelompok',
      Icon: LayoutGrid,
      hidden: isGuest || (!canManageIdeas && role !== 'pengamat'),
    },
    {
      id: 'program',
      label: `Daftar ${workspace.terms.programSingular}`,
      shortLabel: workspace.terms.programSingular,
      Icon: FolderKanban,
      badge: overdueCount > 0 && canManageIdeas ? overdueCount : undefined,
      hidden: isGuest,
    },
    {
      id: 'monev_bulanan',
      label: 'Monev Bulanan',
      shortLabel: 'Bulanan',
      Icon: CalendarCheck,
      hidden: isGuest,
    },
    {
      id: 'moderasi',
      label: 'Moderasi & Laporan',
      shortLabel: 'Moderasi',
      Icon: ShieldCheck,
      badge: pendingModerationCount > 0 ? pendingModerationCount : undefined,
      hidden: isGuest || !canModerate,
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan Ruang',
      shortLabel: 'Atur',
      Icon: Settings,
      hidden: isGuest || (role !== 'admin' && role !== 'pengelola'),
    },
  ];

  const visibleNav = navItems.filter((item) => !item.hidden);
  // Maksimal 4 tab utama di bottom bar mobile + tombol Menu untuk sisanya
  const mobileBottomTabs = visibleNav.slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col lg:flex-row">
      {/* Sidebar Desktop */}
      <aside className="no-print hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Idea<span className="text-indigo-600 dark:text-indigo-400">Card</span>
            </span>
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label="Ubah mode tampilan"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          {/* Info Ruang Aktif */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-display text-sm font-extrabold text-slate-900 dark:text-white">
                {workspace.name}
              </span>
              {!isGuest && (
                <button
                  type="button"
                  onClick={onSwitchWorkspace}
                  title="Ganti Ruang"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-indigo-600 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isGuest ? 'Mode Tamu (Contoh Publik)' : role ? getRoleLabel(role) : 'Anggota'}
            </p>
          </div>

          {/* Tombol Utama Tulis Ide */}
          {!isGuest && role !== 'pengamat' && (
            <button
              type="button"
              onClick={onOpenWriteIdea}
              className={`mt-4 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold shadow-sm transition-all active:scale-[0.99] cursor-pointer ${accent.button}`}
            >
              <PenSquare className="h-4 w-4" />
              Tulis Ide Baru
            </button>
          )}

          {/* Navigasi */}
          <nav className="mt-5 flex-1 space-y-1 overflow-y-auto">
            {visibleNav.map((item) => {
              const Icon = item.Icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChangeTab(item.id)}
                  className={`flex min-h-[42px] w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-bold transition-colors cursor-pointer ${
                    isActive
                      ? `${accent.soft}`
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span className="ml-2 font-mono text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer Profil / Keluar */}
          <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
            {isGuest ? (
              <button
                type="button"
                onClick={onExitGuestToAuth}
                className="w-full min-h-[42px] rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
              >
                Masuk / Buat Akun
              </button>
            ) : (
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                    {user?.displayName || user?.username}
                  </p>
                  <p className="truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                    @{user?.username}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Keluar akun"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="no-print sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="lg:hidden font-display text-base font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0">
              IdeaCard
            </span>
            <span className="lg:hidden text-slate-300 dark:text-slate-700">/</span>
            <span className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
              {workspace.name}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isGuest && role !== 'pengamat' && (
              <button
                type="button"
                onClick={onOpenWriteIdea}
                className={`lg:hidden inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ${accent.button} cursor-pointer whitespace-nowrap`}
              >
                <PenSquare className="h-3.5 w-3.5" />
                Tulis Ide
              </button>
            )}

            {!isGuest && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen(!notifOpen)}
                  aria-label="Notifikasi"
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 font-mono text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900 z-50">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                      <span className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
                        Notifikasi ({unreadCount} baru)
                      </span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={onMarkAllRead}
                          className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
                        >
                          Tandai dibaca
                        </button>
                      )}
                    </div>
                    <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="py-6 text-center text-xs text-slate-500">
                          Belum ada notifikasi di ruang ini.
                        </p>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              setNotifOpen(false);
                              onOpenNotificationTarget(n);
                            }}
                            className={`w-full rounded-xl p-2.5 text-left transition-colors cursor-pointer ${
                              n.read
                                ? 'bg-slate-50/60 dark:bg-slate-950/40'
                                : 'bg-indigo-50/70 dark:bg-indigo-950/40'
                            }`}
                          >
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              {n.title}
                            </div>
                            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                              {n.message}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label="Ubah tema"
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300 cursor-pointer"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Guest Mode Banner */}
        {isGuest && (
          <div className="no-print border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 sm:px-6 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
            <span>
              Kamu sedang melihat <strong>Dashboard Publik Contoh</strong> sebagai Tamu (mode baca saja).
            </span>
            <button
              type="button"
              onClick={onExitGuestToAuth}
              className="font-bold text-indigo-700 underline dark:text-indigo-300 cursor-pointer"
            >
              Masuk atau Buat Akun untuk Berkontribusi
            </button>
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 px-4 py-6 pb-24 lg:pb-10 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Bottom Navigation Mobile (Thumb Zone, Ringkas <= 15% Viewport) */}
      <nav className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="grid grid-cols-5 h-16 items-center">
          {mobileBottomTabs.map((item) => {
            const Icon = item.Icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className={`flex flex-col items-center justify-center h-full min-w-[44px] px-1 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-1 text-[10px] font-bold truncate max-w-full">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center h-full min-w-[44px] px-1 text-slate-500 dark:text-slate-400 cursor-pointer"
          >
            <Menu className="h-5 w-5" />
            <span className="mt-1 text-[10px] font-bold">Menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu Sheet */}
      {mobileMenuOpen && (
        <div className="no-print lg:hidden fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-xs">
          <div className="w-full rounded-t-3xl bg-white p-5 pb-8 dark:bg-slate-900 max-h-[80vh] overflow-y-auto">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  {workspace.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isGuest ? 'Mode Tamu' : `${user?.displayName || user?.username} · ${role ? getRoleLabel(role) : ''}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-1.5">
              {visibleNav.map((item) => {
                const Icon = item.Icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onChangeTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex min-h-[46px] w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer ${
                      isActive
                        ? accent.soft
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {item.badge !== undefined && (
                      <span className="font-mono text-xs font-bold text-rose-600">{item.badge}</span>
                    )}
                  </button>
                );
              })}

              {!isGuest && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSwitchWorkspace();
                    }}
                    className="flex min-h-[46px] w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Ganti / Gabung Ruang Lain
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="flex min-h-[46px] w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar Akun
                  </button>
                </>
              )}
              {isGuest && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onExitGuestToAuth();
                  }}
                  className="mt-2 flex min-h-[46px] w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white cursor-pointer"
                >
                  Masuk / Buat Akun
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
