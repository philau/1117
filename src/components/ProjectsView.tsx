import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { getTodayIsoDate } from '../services/firestoreService';
import { Project, ProjectStatus, Task } from '../types';

interface ProjectsViewProps {
  projects: Project[];
  tasks: Task[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onToggleStatus: (project: Project) => Promise<void>;
}

type StatusFilter = 'all' | ProjectStatus;

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  tasks,
  loading,
  onCreate,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const today = getTodayIsoDate();

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (filter !== 'all' && p.status !== filter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.clientName || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    });
  }, [projects, filter, search]);

  const counts = useMemo(() => {
    const inProgress = projects.filter((p) => p.status === 'in_progress').length;
    return {
      all: projects.length,
      in_progress: inProgress,
      completed: projects.length - inProgress,
    };
  }, [projects]);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg self-start">
            {(
              [
                { key: 'all', label: `全部 (${counts.all})` },
                { key: 'in_progress', label: `進行中 (${counts.in_progress})` },
                { key: 'completed', label: `已完成 (${counts.completed})` },
              ] as { key: StatusFilter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                  filter === tab.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋專案名稱或客戶..."
              className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>新增專案</span>
        </button>
      </div>

      {/* Table / List Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="h-4 w-56 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="px-6 py-16 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-800">尚未建立任何專案</p>
            <p className="text-xs text-slate-500">
              新增第一個接案專案，管理狀態、合作客戶與截止期限。
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={onCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>新增專案</span>
              </button>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="px-6 py-12 text-center space-y-2">
            <p className="text-sm font-medium text-slate-700">找不到符合條件的專案</p>
            <p className="text-xs text-slate-500">請調整搜尋關鍵字或切換狀態篩選。</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 bg-slate-50/60">
                    <th className="py-3 px-6">專案名稱</th>
                    <th className="py-3 px-4">狀態</th>
                    <th className="py-3 px-4">截止日期</th>
                    <th className="py-3 px-4 text-right">關聯任務</th>
                    <th className="py-3 px-6 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredProjects.map((project) => {
                    const pTasks = tasks.filter((t) => t.projectId === project.id);
                    const doneTasks = pTasks.filter((t) => t.status === 'completed').length;
                    const isOverdue =
                      project.status === 'in_progress' &&
                      Boolean(project.dueDate) &&
                      project.dueDate < today;

                    return (
                      <tr key={project.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-6 max-w-sm">
                          <p className="font-medium text-slate-900 truncate">{project.name}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {[
                              project.clientName || '未指定客戶',
                              project.budget ? `預算 ${project.budget.toLocaleString()}` : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => void onToggleStatus(project)}
                            title="點擊切換專案狀態"
                            className={`inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                              project.status === 'completed'
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {project.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 shrink-0" />
                            )}
                            <span>{project.status === 'completed' ? '已完成' : '進行中'}</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono-tabular text-xs">
                          <span className={isOverdue ? 'text-red-600 font-medium' : 'text-slate-600'}>
                            {project.dueDate || '未設定'}
                          </span>
                          {isOverdue && (
                            <span className="ml-2 text-red-600 font-sans font-medium">已逾期</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono-tabular text-xs text-slate-600">
                          {doneTasks} / {pTasks.length}
                        </td>
                        <td className="py-3.5 px-6 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEdit(project)}
                              aria-label={`編輯 ${project.name}`}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(project)}
                              aria-label={`刪除 ${project.name}`}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <ul className="md:hidden divide-y divide-slate-100">
              {filteredProjects.map((project) => {
                const isOverdue =
                  project.status === 'in_progress' &&
                  Boolean(project.dueDate) &&
                  project.dueDate < today;
                return (
                  <li key={project.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {project.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {project.clientName || '未指定客戶'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void onToggleStatus(project)}
                        className={`inline-flex items-center gap-1 text-xs font-medium shrink-0 cursor-pointer ${
                          project.status === 'completed' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {project.status === 'completed' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        <span>{project.status === 'completed' ? '已完成' : '進行中'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span
                        className={`font-mono-tabular ${
                          isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'
                        }`}
                      >
                        截止：{project.dueDate || '未設定'}
                        {isOverdue ? ' (已逾期)' : ''}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(project)}
                          className="px-2.5 py-1.5 text-slate-600 hover:text-blue-600 rounded-md hover:bg-blue-50 cursor-pointer"
                        >
                          編輯
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(project)}
                          className="px-2.5 py-1.5 text-slate-600 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};
