import React, { useMemo } from 'react';
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  CheckSquare,
  Circle,
  Clock,
  FolderKanban,
  Plus,
  Users,
} from 'lucide-react';
import { timestampToMs } from '../services/firestoreService';
import { Client, Project, Task, ViewKey, WorkLog } from '../types';

interface DashboardViewProps {
  projects: Project[];
  clients: Client[];
  tasks: Task[];
  workLogs: WorkLog[];
  loading: boolean;
  onNavigate: (view: ViewKey) => void;
  onOpenNewProject: () => void;
  onOpenNewWork: () => void;
  onOpenNewTask: () => void;
  onToggleTaskStatus: (task: Task) => Promise<void>;
  onEditProject: (project: Project) => void;
}

type ActivityEntry =
  | {
      kind: 'task';
      id: string;
      title: string;
      subtitle: string;
      statusLabel: string;
      isCompleted: boolean;
      dateText: string;
      sortMs: number;
      raw: Task;
    }
  | {
      kind: 'work';
      id: string;
      title: string;
      subtitle: string;
      statusLabel: string;
      isCompleted: boolean;
      dateText: string;
      sortMs: number;
      raw: WorkLog;
    }
  | {
      kind: 'project';
      id: string;
      title: string;
      subtitle: string;
      statusLabel: string;
      isCompleted: boolean;
      dateText: string;
      sortMs: number;
      raw: Project;
    };

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  clients,
  tasks,
  workLogs,
  loading,
  onNavigate,
  onOpenNewProject,
  onOpenNewWork,
  onOpenNewTask,
  onToggleTaskStatus,
  onEditProject,
}) => {
  const inProgressProjects = useMemo(
    () => projects.filter((p) => p.status === 'in_progress'),
    [projects]
  );
  const completedProjectsCount = projects.length - inProgressProjects.length;

  const todoTasksCount = useMemo(
    () => tasks.filter((t) => t.status === 'todo').length,
    [tasks]
  );
  const completedTasksCount = tasks.length - todoTasksCount;

  const totalHoursThisMonth = useMemo(() => {
    return workLogs.reduce((sum, item) => sum + (Number(item.hours) || 0), 0);
  }, [workLogs]);

  // Recent Activity: combine latest project tasks, logged work, and project updates
  const recentActivities = useMemo<ActivityEntry[]>(() => {
    const taskEntries: ActivityEntry[] = tasks.map((t) => ({
      kind: 'task',
      id: `task-${t.id}`,
      title: t.title,
      subtitle: t.projectName ? `專案任務 · ${t.projectName}` : '獨立任務',
      statusLabel: t.status === 'completed' ? '已完成' : '待辦',
      isCompleted: t.status === 'completed',
      dateText: t.dueDate ? `到期 ${t.dueDate}` : '未設定到期日',
      sortMs: timestampToMs(t.updatedAt) || timestampToMs(t.createdAt),
      raw: t,
    }));

    const workEntries: ActivityEntry[] = workLogs.map((w) => ({
      kind: 'work',
      id: `work-${w.id}`,
      title: w.title,
      subtitle: [
        '工作紀錄',
        w.projectName || null,
        w.clientName || null,
        `${w.hours} 小時`,
      ]
        .filter(Boolean)
        .join(' · '),
      statusLabel: '已記錄',
      isCompleted: true,
      dateText: w.workDate || '',
      sortMs: timestampToMs(w.updatedAt) || timestampToMs(w.createdAt),
      raw: w,
    }));

    const projectEntries: ActivityEntry[] = projects.map((p) => ({
      kind: 'project',
      id: `project-${p.id}`,
      title: p.name,
      subtitle: p.clientName ? `專案 · ${p.clientName}` : '專案',
      statusLabel: p.status === 'completed' ? '已完成' : '進行中',
      isCompleted: p.status === 'completed',
      dateText: p.dueDate ? `截止 ${p.dueDate}` : '未設定截止日',
      sortMs: timestampToMs(p.updatedAt) || timestampToMs(p.createdAt),
      raw: p,
    }));

    return [...taskEntries, ...workEntries, ...projectEntries]
      .sort((a, b) => b.sortMs - a.sortMs)
      .slice(0, 8);
  }, [tasks, workLogs, projects]);

  const upcomingProjects = useMemo(() => {
    return [...inProgressProjects]
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      })
      .slice(0, 5);
  }, [inProgressProjects]);

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <section
        aria-label="快速操作區"
        className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-sm font-semibold text-slate-900">快速操作</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            立即建立新專案、記錄今日工作時數或新增待辦任務
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenNewProject}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>新增專案</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewWork}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Briefcase className="w-4 h-4 text-slate-500 shrink-0" />
            <span>新增工作</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewTask}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <CheckSquare className="w-4 h-4 text-slate-500 shrink-0" />
            <span>新增任務</span>
          </button>
        </div>
      </section>

      {/* Key Metric Cards: 專案數, 客戶數, 任務數 */}
      <section aria-label="關鍵資訊統計" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button
          type="button"
          onClick={() => onNavigate('projects')}
          className="text-left bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">專案數</span>
            <FolderKanban className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          {loading ? (
            <div className="h-9 w-16 bg-slate-100 rounded mt-3 animate-pulse" />
          ) : (
            <div className="text-3xl font-bold text-slate-900 mt-3 font-mono-tabular">
              {projects.length}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="tabular-nums">
              進行中 {inProgressProjects.length} · 已完成 {completedProjectsCount}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('clients_work')}
          className="text-left bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">客戶數</span>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          {loading ? (
            <div className="h-9 w-16 bg-slate-100 rounded mt-3 animate-pulse" />
          ) : (
            <div className="text-3xl font-bold text-slate-900 mt-3 font-mono-tabular">
              {clients.length}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="tabular-nums">
              累計工時 {totalHoursThisMonth} 小時
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('tasks')}
          className="text-left bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">任務數</span>
            <CheckSquare className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          {loading ? (
            <div className="h-9 w-16 bg-slate-100 rounded mt-3 animate-pulse" />
          ) : (
            <div className="text-3xl font-bold text-slate-900 mt-3 font-mono-tabular">
              {tasks.length}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="tabular-nums">
              待辦 {todoTasksCount} · 已完成 {completedTasksCount}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </button>
      </section>

      {/* Main Content Split: Recent Activity (7 cols) & Active Projects (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Activity */}
        <section
          aria-label="最近活動"
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">最近活動</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                顯示最新的專案任務與工作紀錄動態
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              檢視全部任務
            </button>
          </div>

          {loading ? (
            <div className="divide-y divide-slate-100">
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="px-6 py-12 text-center space-y-3">
              <p className="text-sm font-medium text-slate-700">尚無近期專案任務活動</p>
              <p className="text-xs text-slate-500">
                點擊上方快速操作區建立您的第一個專案或待辦任務。
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onOpenNewTask}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增第一筆任務</span>
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentActivities.map((entry) => (
                <li
                  key={entry.id}
                  className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {entry.kind === 'task' ? (
                      <button
                        type="button"
                        onClick={() => void onToggleTaskStatus(entry.raw)}
                        aria-label={
                          entry.isCompleted ? '標記為待辦任務' : '標記為已完成任務'
                        }
                        className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
                      >
                        {entry.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                    ) : entry.kind === 'work' ? (
                      <Briefcase className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    ) : (
                      <FolderKanban className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    )}

                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          entry.kind === 'task' && entry.isCompleted
                            ? 'line-through text-slate-400'
                            : 'text-slate-900'
                        }`}
                      >
                        {entry.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{entry.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <span
                      className={`font-medium ${
                        entry.isCompleted ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {entry.statusLabel}
                    </span>
                    {entry.dateText && (
                      <>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-slate-500 font-mono-tabular hidden sm:inline">
                          {entry.dateText}
                        </span>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Active Projects Summary */}
        <section
          aria-label="進行中專案"
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">進行中專案</h2>
              <p className="text-xs text-slate-500 mt-0.5">依截止日期排序</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              管理專案
            </button>
          </div>

          {loading ? (
            <div className="divide-y divide-slate-100">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="px-6 py-4 space-y-2">
                  <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : upcomingProjects.length === 0 ? (
            <div className="px-6 py-12 text-center space-y-3">
              <p className="text-sm font-medium text-slate-700">目前沒有進行中的專案</p>
              <p className="text-xs text-slate-500">新增接案專案以追蹤交付進度與期限。</p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onOpenNewProject}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增專案</span>
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcomingProjects.map((project) => {
                const projectTasks = tasks.filter((t) => t.projectId === project.id);
                const doneCount = projectTasks.filter((t) => t.status === 'completed').length;
                return (
                  <li key={project.id}>
                    <button
                      type="button"
                      onClick={() => onEditProject(project)}
                      className="w-full px-6 py-4 text-left hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {project.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5 tabular-nums">
                          {project.clientName ? `${project.clientName} · ` : ''}
                          任務 {doneCount}/{projectTasks.length}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono-tabular shrink-0">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{project.dueDate || '無期限'}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
