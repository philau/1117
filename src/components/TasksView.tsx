import React, { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { getTodayIsoDate } from '../services/firestoreService';
import { Project, Task, TaskStatus } from '../types';

interface TasksViewProps {
  tasks: Task[];
  projects: Project[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleStatus: (task: Task) => Promise<void>;
}

type TaskFilter = 'all' | TaskStatus;

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  projects,
  loading,
  onCreate,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const today = getTodayIsoDate();

  const counts = useMemo(() => {
    const todo = tasks.filter((t) => t.status === 'todo').length;
    return {
      all: tasks.length,
      todo,
      completed: tasks.length - todo,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (filter !== 'all' && t.status !== filter) return false;
      if (projectFilter !== 'all' && (t.projectId || '') !== projectFilter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.projectName || '').toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q)
      );
    });
  }, [tasks, filter, projectFilter, search]);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
            {(
              [
                { key: 'all', label: `全部 (${counts.all})` },
                { key: 'todo', label: `待辦 (${counts.todo})` },
                { key: 'completed', label: `已完成 (${counts.completed})` },
              ] as { key: TaskFilter; label: string }[]
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

          <select
            aria-label="依專案篩選任務"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">所有專案</option>
            <option value="">無關聯專案</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋任務標題或備註..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>新增任務</span>
        </button>
      </div>

      {/* Tasks List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="px-6 py-16 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-800">目前沒有任何任務</p>
            <p className="text-xs text-slate-500">
              建立待辦事項並設定到期日，掌握每日接案工作進度。
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={onCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>新增任務</span>
              </button>
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="px-6 py-12 text-center space-y-2">
            <p className="text-sm font-medium text-slate-700">找不到符合條件的任務</p>
            <p className="text-xs text-slate-500">請嘗試更換篩選狀態或清除搜尋字串。</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredTasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const isOverdue = !isCompleted && Boolean(task.dueDate) && task.dueDate < today;

              return (
                <li
                  key={task.id}
                  className="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => void onToggleStatus(task)}
                      aria-label={isCompleted ? '切換為待辦' : '標記為已完成'}
                      className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{task.projectName || '個人任務'}</span>
                        {task.notes && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-xs">{task.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pl-8 sm:pl-0 shrink-0">
                    <div className="flex items-center gap-3 text-xs">
                      <span
                        className={`font-medium ${
                          isCompleted ? 'text-emerald-700' : 'text-slate-700'
                        }`}
                      >
                        {isCompleted ? '已完成' : '待辦'}
                      </span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span
                        className={`font-mono-tabular ${
                          isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'
                        }`}
                      >
                        {task.dueDate || '無到期日'}
                        {isOverdue ? ' (已逾期)' : ''}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(task)}
                        aria-label={`編輯 ${task.title}`}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(task)}
                        aria-label={`刪除 ${task.title}`}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
