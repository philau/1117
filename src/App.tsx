import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { AlertCircle, Menu, Plus, X } from 'lucide-react';
import { AuthGate } from './components/AuthGate';
import { ClientsWorkView } from './components/ClientsWorkView';
import { DashboardView } from './components/DashboardView';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  ClientModal,
  ConfirmDeleteModal,
  ProjectModal,
  TaskModal,
  WorkLogModal,
} from './components/Modals';
import { ProfileSettingsView } from './components/ProfileSettingsView';
import { ProjectsView } from './components/ProjectsView';
import { Sidebar } from './components/Sidebar';
import { TasksView } from './components/TasksView';
import { auth, formatFriendlyError } from './lib/firebase';
import {
  createClient,
  createProject,
  createTask,
  createWorkLog,
  deleteClient,
  deleteProject,
  deleteTask,
  deleteWorkLog,
  ensureUserProfile,
  subscribeClients,
  subscribeProjects,
  subscribeTasks,
  subscribeUserProfile,
  subscribeWorkLogs,
  toggleProjectStatus,
  toggleTaskStatus,
  updateClient,
  updateProject,
  updateTask,
  updateUserProfile,
  updateWorkLog,
} from './services/firestoreService';
import {
  Client,
  ClientInput,
  ProfileInput,
  Project,
  ProjectInput,
  Task,
  TaskInput,
  UserProfile,
  ViewKey,
  WorkLog,
  WorkLogInput,
} from './types';

const VIEW_TITLES: Record<ViewKey, { title: string; breadcrumb: string }> = {
  dashboard: { title: '儀表板總覽', breadcrumb: '接案工作台 / 儀表板' },
  projects: { title: '專案管理', breadcrumb: '接案工作台 / 專案管理' },
  tasks: { title: '任務管理', breadcrumb: '接案工作台 / 任務管理' },
  clients_work: { title: '客戶與工作紀錄', breadcrumb: '接案工作台 / 客戶與工作' },
  profile: { title: '個人資料設定', breadcrumb: '接案工作台 / 個人設定' },
};

function FreelancerWorkspace() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [activeView, setActiveView] = useState<ViewKey>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [bannerError, setBannerError] = useState<string | null>(null);

  // Modal states
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [workModalOpen, setWorkModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<WorkLog | null>(null);

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'project' | 'task' | 'client' | 'work';
    id: string;
    label: string;
  } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (!currentUser) {
        setProfile(null);
        setClients([]);
        setProjects([]);
        setTasks([]);
        setWorkLogs([]);
        setDataLoading(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;

    let isMounted = true;
    setDataLoading(true);
    setBannerError(null);

    void ensureUserProfile(user).catch((err) => {
      if (isMounted) setBannerError(formatFriendlyError(err));
    });

    const handleSubError = (err: unknown) => {
      if (isMounted) {
        setBannerError(formatFriendlyError(err));
        setDataLoading(false);
      }
    };

    const unsubProfile = subscribeUserProfile(
      user.uid,
      (p) => {
        if (isMounted) setProfile(p);
      },
      handleSubError
    );

    const unsubClients = subscribeClients(
      user.uid,
      (list) => {
        if (isMounted) setClients(list);
      },
      handleSubError
    );

    const unsubProjects = subscribeProjects(
      user.uid,
      (list) => {
        if (isMounted) {
          setProjects(list);
          setDataLoading(false);
        }
      },
      handleSubError
    );

    const unsubTasks = subscribeTasks(
      user.uid,
      (list) => {
        if (isMounted) setTasks(list);
      },
      handleSubError
    );

    const unsubWorkLogs = subscribeWorkLogs(
      user.uid,
      (list) => {
        if (isMounted) setWorkLogs(list);
      },
      handleSubError
    );

    return () => {
      isMounted = false;
      unsubProfile();
      unsubClients();
      unsubProjects();
      unsubTasks();
      unsubWorkLogs();
    };
  }, [authReady, user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      setBannerError(formatFriendlyError(err));
    }
  };

  // --- CRUD Handlers ---

  const handleSaveProject = async (input: ProjectInput, newClientName?: string) => {
    if (!user) return;
    try {
      let resolvedClientId = input.clientId || '';
      const resolvedClientName = input.clientName || '';

      if (newClientName) {
        resolvedClientId = await createClient(user.uid, {
          name: newClientName,
        });
      }

      const payload: ProjectInput = {
        ...input,
        clientId: resolvedClientId,
        clientName: resolvedClientName,
      };

      if (editingProject) {
        await updateProject(editingProject.id, payload);
      } else {
        await createProject(user.uid, payload);
      }
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  };

  const handleToggleProjectStatus = async (project: Project) => {
    try {
      const next = project.status === 'completed' ? 'in_progress' : 'completed';
      await toggleProjectStatus(project.id, next);
    } catch (err) {
      setBannerError(formatFriendlyError(err));
    }
  };

  const handleSaveTask = async (input: TaskInput) => {
    if (!user) return;
    try {
      if (editingTask) {
        await updateTask(editingTask.id, input);
      } else {
        await createTask(user.uid, input);
      }
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    try {
      const next = task.status === 'completed' ? 'todo' : 'completed';
      await toggleTaskStatus(task.id, next);
    } catch (err) {
      setBannerError(formatFriendlyError(err));
    }
  };

  const handleSaveWorkLog = async (input: WorkLogInput) => {
    if (!user) return;
    try {
      if (editingWork) {
        await updateWorkLog(editingWork.id, input);
      } else {
        await createWorkLog(user.uid, input);
      }
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  };

  const handleSaveClient = async (input: ClientInput) => {
    if (!user) return;
    try {
      if (editingClient) {
        await updateClient(editingClient.id, input);
      } else {
        await createClient(user.uid, input);
      }
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  };

  const handleSaveProfile = async (input: ProfileInput) => {
    if (!user) return;
    try {
      await updateUserProfile(user.uid, input);
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'project') {
        await deleteProject(deleteTarget.id);
      } else if (deleteTarget.type === 'task') {
        await deleteTask(deleteTarget.id);
      } else if (deleteTarget.type === 'client') {
        await deleteClient(deleteTarget.id);
      } else if (deleteTarget.type === 'work') {
        await deleteWorkLog(deleteTarget.id);
      }
    } catch (err) {
      setBannerError(formatFriendlyError(err));
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-500">正在初始化工作台...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthGate />;
  }

  const headerMeta = VIEW_TITLES[activeView];

  const renderPrimaryTopAction = () => {
    if (activeView === 'tasks') {
      return (
        <button
          type="button"
          onClick={() => {
            setEditingTask(null);
            setTaskModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>新增任務</span>
        </button>
      );
    }
    if (activeView === 'clients_work') {
      return (
        <button
          type="button"
          onClick={() => {
            setEditingWork(null);
            setWorkModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>新增工作</span>
        </button>
      );
    }
    if (activeView === 'profile') {
      return null;
    }
    return (
      <button
        type="button"
        onClick={() => {
          setEditingProject(null);
          setProjectModalOpen(true);
        }}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <Plus className="w-4 h-4 shrink-0" />
        <span>新增專案</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        profile={profile}
        fallbackName={user.displayName || '自由接案工作者'}
        fallbackEmail={user.email || ''}
        fallbackPhoto={user.photoURL}
        onSignOut={() => void handleSignOut()}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="開啟導覽選單"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 truncate hidden sm:block">
                {headerMeta.breadcrumb}
              </p>
              <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                {headerMeta.title}
              </h1>
            </div>
          </div>

          <div className="shrink-0">{renderPrimaryTopAction()}</div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {bannerError && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3 text-xs sm:text-sm text-red-800"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{bannerError}</span>
              </div>
              <button
                type="button"
                onClick={() => setBannerError(null)}
                aria-label="關閉錯誤提示"
                className="p-1 text-red-500 hover:text-red-700 rounded cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeView === 'dashboard' && (
            <DashboardView
              projects={projects}
              clients={clients}
              tasks={tasks}
              workLogs={workLogs}
              loading={dataLoading}
              onNavigate={setActiveView}
              onOpenNewProject={() => {
                setEditingProject(null);
                setProjectModalOpen(true);
              }}
              onOpenNewWork={() => {
                setEditingWork(null);
                setWorkModalOpen(true);
              }}
              onOpenNewTask={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
              onToggleTaskStatus={handleToggleTaskStatus}
              onEditProject={(project) => {
                setEditingProject(project);
                setProjectModalOpen(true);
              }}
            />
          )}

          {activeView === 'projects' && (
            <ProjectsView
              projects={projects}
              tasks={tasks}
              loading={dataLoading}
              onCreate={() => {
                setEditingProject(null);
                setProjectModalOpen(true);
              }}
              onEdit={(project) => {
                setEditingProject(project);
                setProjectModalOpen(true);
              }}
              onDelete={(project) =>
                setDeleteTarget({
                  type: 'project',
                  id: project.id,
                  label: project.name,
                })
              }
              onToggleStatus={handleToggleProjectStatus}
            />
          )}

          {activeView === 'tasks' && (
            <TasksView
              tasks={tasks}
              projects={projects}
              loading={dataLoading}
              onCreate={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
              onEdit={(task) => {
                setEditingTask(task);
                setTaskModalOpen(true);
              }}
              onDelete={(task) =>
                setDeleteTarget({
                  type: 'task',
                  id: task.id,
                  label: task.title,
                })
              }
              onToggleStatus={handleToggleTaskStatus}
            />
          )}

          {activeView === 'clients_work' && (
            <ClientsWorkView
              clients={clients}
              workLogs={workLogs}
              loading={dataLoading}
              onCreateClient={() => {
                setEditingClient(null);
                setClientModalOpen(true);
              }}
              onEditClient={(client) => {
                setEditingClient(client);
                setClientModalOpen(true);
              }}
              onDeleteClient={(client) =>
                setDeleteTarget({
                  type: 'client',
                  id: client.id,
                  label: client.name,
                })
              }
              onCreateWorkLog={() => {
                setEditingWork(null);
                setWorkModalOpen(true);
              }}
              onEditWorkLog={(log) => {
                setEditingWork(log);
                setWorkModalOpen(true);
              }}
              onDeleteWorkLog={(log) =>
                setDeleteTarget({
                  type: 'work',
                  id: log.id,
                  label: log.title,
                })
              }
            />
          )}

          {activeView === 'profile' && (
            <ProfileSettingsView
              profile={profile}
              fallbackName={user.displayName || '自由接案工作者'}
              fallbackEmail={user.email || ''}
              fallbackPhoto={user.photoURL}
              loading={dataLoading}
              onSave={handleSaveProfile}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <ProjectModal
        open={projectModalOpen}
        onClose={() => {
          setProjectModalOpen(false);
          setEditingProject(null);
        }}
        initialData={editingProject}
        clients={clients}
        onSubmit={handleSaveProject}
      />

      <TaskModal
        open={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        initialData={editingTask}
        projects={projects}
        onSubmit={handleSaveTask}
      />

      <WorkLogModal
        open={workModalOpen}
        onClose={() => {
          setWorkModalOpen(false);
          setEditingWork(null);
        }}
        initialData={editingWork}
        projects={projects}
        clients={clients}
        onSubmit={handleSaveWorkLog}
      />

      <ClientModal
        open={clientModalOpen}
        onClose={() => {
          setClientModalOpen(false);
          setEditingClient(null);
        }}
        initialData={editingClient}
        onSubmit={handleSaveClient}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="確認刪除項目"
        description={
          deleteTarget
            ? `確定要刪除「${deleteTarget.label}」嗎？此操作無法復原。`
            : ''
        }
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FreelancerWorkspace />
    </ErrorBoundary>
  );
}
