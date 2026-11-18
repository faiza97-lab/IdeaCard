import { useEffect, useState } from 'react';
import { ensureSeedData } from './data/seedData';
import {
  clearSession,
  enterGuestMode,
  getSession,
  getUserById,
  setSession,
} from './services/authService';
import {
  getAllIdeas,
  getIdeasByWorkspace,
  getNotifications,
  markAllNotificationsRead,
} from './services/ideaService';
import { getOverdueReminders } from './services/monevService';
import {
  STORAGE_KEYS,
  hydrateFromServer,
  normalizeJoinCode,
  onExternalSync,
  readStorage,
  writeStorage,
} from './services/storageService';
import {
  getMemberRole,
  getWorkspaceById,
  getWorkspaces,
  joinWorkspaceByCodeAsync,
} from './services/workspaceService';
import { AppNotification, Idea, User, Workspace } from './types/ideacard';
import { LandingPage } from './components/auth/LandingPage';
import { AuthView } from './components/auth/AuthView';
import { WorkspaceSelector } from './components/workspace/WorkspaceSelector';
import { ActiveTab, AppShell } from './components/layout/AppShell';
import { PersonalDashboard } from './components/dashboard/PersonalDashboard';
import { PublicDashboard } from './components/dashboard/PublicDashboard';
import { IdeaFormModal } from './components/ideas/IdeaFormModal';
import { IdeaDetailView } from './components/ideas/IdeaDetailView';
import { GroupingBoard } from './components/ideas/GroupingBoard';
import { ProgramManager } from './components/monev/ProgramManager';
import { MonthlyMonevView } from './components/monev/MonthlyMonevView';
import { ModerationView } from './components/admin/ModerationView';
import { WorkspaceSettings } from './components/settings/WorkspaceSettings';

type AppScreen = 'landing' | 'auth' | 'workspace_select' | 'app';

export default function App() {
  const [ready, setReady] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() =>
    readStorage<boolean>(STORAGE_KEYS.THEME_MODE, false)
  );
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('personal');
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [ideaToConvert, setIdeaToConvert] = useState<Idea | null>(null);
  const [pendingJoinCode, setPendingJoinCode] = useState<string>('');
  const [refreshTick, setRefreshTick] = useState(0);

  // Sync Tailwind dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    writeStorage(STORAGE_KEYS.THEME_MODE, darkMode);
  }, [darkMode]);

  // Hydrate server state, seed data, parse ?ruang= link, & restore session on mount
  useEffect(() => {
    async function init() {
      const params = new URLSearchParams(window.location.search);
      const rawParam = params.get('ruang') || params.get('gabung') || '';
      const inviteCode = rawParam ? normalizeJoinCode(rawParam) : '';
      if (inviteCode && window.history?.replaceState) {
        window.history.replaceState({}, '', window.location.pathname);
      }

      await hydrateFromServer();
      await ensureSeedData();
      const session = getSession();
      if (session.isGuest) {
        const ws =
          (session.activeWorkspaceId && getWorkspaceById(session.activeWorkspaceId)) ||
          getWorkspaces()[0] ||
          null;
        if (ws) {
          setIsGuest(true);
          setActiveWorkspace(ws);
          setActiveTab('publik');
          setScreen('app');
        }
      } else if (session.userId) {
        const user = getUserById(session.userId);
        if (user) {
          setCurrentUser(user);
          if (inviteCode) {
            const joinRes = await joinWorkspaceByCodeAsync({ code: inviteCode, user });
            if (!('error' in joinRes)) {
              const role = getMemberRole(joinRes.workspace, user.id);
              setActiveWorkspace(joinRes.workspace);
              setSession({
                userId: user.id,
                isGuest: false,
                activeWorkspaceId: joinRes.workspace.id,
              });
              setActiveTab(role === 'pengamat' ? 'publik' : 'personal');
              setScreen('app');
              setReady(true);
              return;
            }
            setPendingJoinCode(inviteCode);
            setScreen('workspace_select');
            setReady(true);
            return;
          }
          if (session.activeWorkspaceId) {
            const ws = getWorkspaceById(session.activeWorkspaceId);
            if (ws) {
              setActiveWorkspace(ws);
              setScreen('app');
            } else {
              setScreen('workspace_select');
            }
          } else {
            setScreen('workspace_select');
          }
        } else if (inviteCode) {
          setPendingJoinCode(inviteCode);
          setScreen('auth');
        }
      } else if (inviteCode) {
        setPendingJoinCode(inviteCode);
        setScreen('auth');
      }
      setReady(true);
    }
    init();
  }, []);

  // Sinkronisasi otomatis antar tab saat ada perubahan penyimpanan bersama
  useEffect(() => {
    return onExternalSync(() => {
      if (activeWorkspace?.id) {
        const latestWs = getWorkspaceById(activeWorkspace.id);
        if (latestWs) setActiveWorkspace(latestWs);
      }
      setRefreshTick((t) => t + 1);
    });
  }, [activeWorkspace?.id]);

  function triggerRefresh() {
    if (activeWorkspace) {
      const latestWs = getWorkspaceById(activeWorkspace.id);
      if (latestWs) setActiveWorkspace(latestWs);
    }
    setRefreshTick((t) => t + 1);
  }

  function handleEnterGuest() {
    const sampleWs = getWorkspaces()[0];
    if (!sampleWs) return;
    enterGuestMode(sampleWs.id);
    setCurrentUser(null);
    setIsGuest(true);
    setActiveWorkspace(sampleWs);
    setActiveTab('publik');
    setSelectedIdeaId(null);
    setScreen('app');
  }

  async function handleAuthenticated(user: User) {
    setCurrentUser(user);
    setIsGuest(false);
    if (pendingJoinCode) {
      const joinRes = await joinWorkspaceByCodeAsync({ code: pendingJoinCode, user });
      if (!('error' in joinRes)) {
        setPendingJoinCode('');
        setActiveWorkspace(joinRes.workspace);
        setSession({
          userId: user.id,
          isGuest: false,
          activeWorkspaceId: joinRes.workspace.id,
        });
        const role = getMemberRole(joinRes.workspace, user.id);
        setActiveTab(role === 'pengamat' ? 'publik' : 'personal');
        setSelectedIdeaId(null);
        setScreen('app');
        return;
      }
    }
    setScreen('workspace_select');
  }

  function handleSelectWorkspace(ws: Workspace) {
    setPendingJoinCode('');
    setActiveWorkspace(ws);
    setSession({
      userId: currentUser?.id || null,
      isGuest: false,
      activeWorkspaceId: ws.id,
    });
    const role = getMemberRole(ws, currentUser?.id || null);
    setActiveTab(role === 'pengamat' ? 'publik' : 'personal');
    setSelectedIdeaId(null);
    setScreen('app');
  }

  function handleLogout() {
    clearSession();
    setPendingJoinCode('');
    setCurrentUser(null);
    setIsGuest(false);
    setActiveWorkspace(null);
    setSelectedIdeaId(null);
    setScreen('landing');
  }

  function handleOpenNotification(notif: AppNotification) {
    if (notif.linkTab === 'detail' && notif.linkId) {
      setSelectedIdeaId(notif.linkId);
    } else if (notif.linkTab === 'moderasi') {
      setSelectedIdeaId(null);
      setActiveTab('moderasi');
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        <p className="font-display text-sm font-bold">Menyiapkan ruang IdeaCard...</p>
      </div>
    );
  }

  if (screen === 'landing') {
    return (
      <LandingPage
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onGoAuth={(mode) => {
          setAuthMode(mode);
          setScreen('auth');
        }}
        onEnterGuest={handleEnterGuest}
      />
    );
  }

  if (screen === 'auth') {
    return (
      <AuthView
        initialMode={authMode}
        onBack={() => setScreen('landing')}
        onAuthenticated={handleAuthenticated}
        onEnterGuest={handleEnterGuest}
      />
    );
  }

  if (screen === 'workspace_select' && currentUser) {
    return (
      <WorkspaceSelector
        user={currentUser}
        darkMode={darkMode}
        initialJoinCode={pendingJoinCode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onSelectWorkspace={handleSelectWorkspace}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === 'app' && activeWorkspace) {
    const role = getMemberRole(activeWorkspace, currentUser?.id || null);
    const notifications =
      currentUser && !isGuest
        ? getNotifications(activeWorkspace.id, currentUser.id)
        : [];
    const overdueCount = getOverdueReminders(activeWorkspace.id).length;
    const allWsIdeas = getIdeasByWorkspace(activeWorkspace.id);
    const pendingIdeasCount = allWsIdeas.filter((i) => i.moderationStatus === 'menunggu').length;
    const pendingCommentsCount = allWsIdeas.reduce(
      (acc, i) => acc + i.comments.filter((c) => c.moderationStatus === 'menunggu').length,
      0
    );
    const selectedIdea = selectedIdeaId
      ? getAllIdeas().find((i) => i.id === selectedIdeaId) || null
      : null;

    // Trigger dependency on refreshTick
    void refreshTick;

    return (
      <>
        <AppShell
          workspace={activeWorkspace}
          user={currentUser}
          role={role}
          isGuest={isGuest}
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setSelectedIdeaId(null);
            setActiveTab(tab);
          }}
          onOpenWriteIdea={() => setWriteModalOpen(true)}
          onSwitchWorkspace={() => setScreen('workspace_select')}
          onLogout={handleLogout}
          onExitGuestToAuth={() => {
            clearSession();
            setIsGuest(false);
            setAuthMode('login');
            setScreen('auth');
          }}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          notifications={notifications}
          overdueCount={overdueCount}
          pendingModerationCount={pendingIdeasCount + pendingCommentsCount}
          onMarkAllRead={() => {
            if (currentUser) {
              markAllNotificationsRead(activeWorkspace.id, currentUser.id);
              triggerRefresh();
            }
          }}
          onOpenNotificationTarget={handleOpenNotification}
        >
          {selectedIdea ? (
            <IdeaDetailView
              idea={selectedIdea}
              workspace={activeWorkspace}
              user={currentUser}
              role={role}
              isGuest={isGuest}
              onBack={() => setSelectedIdeaId(null)}
              onIdeaUpdated={() => triggerRefresh()}
              onConvertToProgram={(idea) => {
                setSelectedIdeaId(null);
                setIdeaToConvert(idea);
                setActiveTab('program');
              }}
            />
          ) : (
            <>
              {activeTab === 'personal' && currentUser && role && (
                <PersonalDashboard
                  workspace={activeWorkspace}
                  user={currentUser}
                  role={role}
                  onWorkspaceUpdated={(ws) => setActiveWorkspace(ws)}
                  onOpenWriteIdea={() => setWriteModalOpen(true)}
                  onSelectIdea={(idea) => setSelectedIdeaId(idea.id)}
                  onGoPrograms={() => setActiveTab('program')}
                />
              )}

              {activeTab === 'publik' && (
                <PublicDashboard
                  workspace={activeWorkspace}
                  user={currentUser}
                  role={role}
                  isGuest={isGuest}
                  onWorkspaceUpdated={(ws) => setActiveWorkspace(ws)}
                  onSelectIdea={(idea) => setSelectedIdeaId(idea.id)}
                  onRefresh={triggerRefresh}
                />
              )}

              {activeTab === 'kelompok' && (
                <GroupingBoard
                  workspace={activeWorkspace}
                  role={role}
                  onSelectIdea={(idea) => setSelectedIdeaId(idea.id)}
                  onRefresh={triggerRefresh}
                />
              )}

              {activeTab === 'program' && (
                <ProgramManager
                  workspace={activeWorkspace}
                  role={role}
                  initialProgramToCreateFromIdea={ideaToConvert}
                  onClearInitialIdea={() => setIdeaToConvert(null)}
                  onSelectIdea={(idea) => setSelectedIdeaId(idea.id)}
                  onRefresh={triggerRefresh}
                />
              )}

              {activeTab === 'monev_bulanan' && currentUser && role && (
                <MonthlyMonevView
                  workspace={activeWorkspace}
                  user={currentUser}
                  role={role}
                />
              )}

              {activeTab === 'moderasi' && currentUser && role && (
                <ModerationView
                  workspace={activeWorkspace}
                  user={currentUser}
                  role={role}
                  onSelectIdea={(idea) => setSelectedIdeaId(idea.id)}
                  onWorkspaceUpdated={triggerRefresh}
                  onRefresh={triggerRefresh}
                />
              )}

              {activeTab === 'pengaturan' && currentUser && role && (
                <WorkspaceSettings
                  workspace={activeWorkspace}
                  user={currentUser}
                  role={role}
                  onWorkspaceUpdated={(ws) => setActiveWorkspace(ws)}
                />
              )}
            </>
          )}
        </AppShell>

        {writeModalOpen && currentUser && role && (
          <IdeaFormModal
            workspace={activeWorkspace}
            user={currentUser}
            role={role}
            onClose={() => setWriteModalOpen(false)}
            onCreated={() => triggerRefresh()}
            onWorkspaceUpdated={(ws) => setActiveWorkspace(ws)}
          />
        )}
      </>
    );
  }

  return null;
}
