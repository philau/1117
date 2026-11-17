import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { getTodayIsoDate } from '../services/firestoreService';
import {
  BLUEPRINT_LIMITS,
  Client,
  ClientInput,
  Project,
  ProjectInput,
  ProjectStatus,
  Task,
  TaskInput,
  TaskStatus,
  WorkLog,
  WorkLogInput,
} from '../types';

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const ModalShell: React.FC<ModalShellProps> = ({ open, onClose, title, subtitle, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative z-10 w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉視窗"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// --- Project Modal ---

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: Project | null;
  clients: Client[];
  onSubmit: (data: ProjectInput, newClientName?: string) => Promise<void>;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  open,
  onClose,
  initialData,
  clients,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [createNewClient, setCreateNewClient] = useState(false);
  const [status, setStatus] = useState<ProjectStatus>('in_progress');
  const [dueDate, setDueDate] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initialData?.name || '');
    setClientId(initialData?.clientId || '');
    setClientName(initialData?.clientName || '');
    setCreateNewClient(false);
    setStatus(initialData?.status || 'in_progress');
    setDueDate(initialData?.dueDate || getTodayIsoDate());
    setBudget(initialData?.budget ? String(initialData.budget) : '');
    setDescription(initialData?.description || '');
    setError(null);
  }, [open, initialData]);

  const handleClientSelect = (selectedId: string) => {
    if (selectedId === '__NEW__') {
      setCreateNewClient(true);
      setClientId('');
      setClientName('');
      return;
    }
    setCreateNewClient(false);
    setClientId(selectedId);
    const matched = clients.find((c) => c.id === selectedId);
    setClientName(matched ? matched.name : '');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('請輸入專案名稱。');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const parsedBudget = budget.trim() ? Math.max(0, Number(budget)) : 0;
      await onSubmit(
        {
          name: name.trim(),
          clientId: createNewClient ? '' : clientId,
          clientName: clientName.trim(),
          status,
          dueDate,
          budget: Number.isFinite(parsedBudget) ? parsedBudget : 0,
          description: description.trim(),
        },
        createNewClient && clientName.trim() ? clientName.trim() : undefined
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存專案失敗，請再試一次。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={initialData ? '編輯專案' : '新增專案'}
      subtitle="設定專案名稱、合作客戶、執行狀態與截止日期"
    >
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="project-name" className="block text-xs font-medium text-slate-700">
            專案名稱 *
          </label>
          <input
            id="project-name"
            type="text"
            required
            maxLength={BLUEPRINT_LIMITS.PROJECT_NAME_MAX}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：品牌官網設計改版"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="project-client" className="block text-xs font-medium text-slate-700">
              合作客戶
            </label>
            <select
              id="project-client"
              value={createNewClient ? '__NEW__' : clientId}
              onChange={(e) => handleClientSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            >
              <option value="">未指定客戶</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.company ? ` (${c.company})` : ''}
                </option>
              ))}
              <option value="__NEW__">+ 建立新客戶</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="project-status" className="block text-xs font-medium text-slate-700">
              專案狀態
            </label>
            <select
              id="project-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            >
              <option value="in_progress">進行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>

        {createNewClient && (
          <div className="space-y-1.5">
            <label htmlFor="project-new-client" className="block text-xs font-medium text-slate-700">
              新客戶名稱 *
            </label>
            <input
              id="project-new-client"
              type="text"
              required
              maxLength={BLUEPRINT_LIMITS.CLIENT_NAME_MAX}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="輸入客戶或聯絡人名稱，將自動加入客戶名單"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="project-due" className="block text-xs font-medium text-slate-700">
              截止日期
            </label>
            <input
              id="project-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="project-budget" className="block text-xs font-medium text-slate-700">
              預估金額 (選填)
            </label>
            <input
              id="project-budget"
              type="number"
              min="0"
              step="100"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="例如：45000"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="project-desc" className="block text-xs font-medium text-slate-700">
            專案備註與範疇
          </label>
          <textarea
            id="project-desc"
            rows={3}
            maxLength={BLUEPRINT_LIMITS.DESCRIPTION_MAX}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="簡述交付項目、設計需求或合作備忘..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
          >
            {saving ? '儲存中...' : initialData ? '儲存變更' : '建立專案'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// --- Task Modal ---

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: Task | null;
  projects: Project[];
  defaultProjectId?: string;
  onSubmit: (data: TaskInput) => Promise<void>;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  open,
  onClose,
  initialData,
  projects,
  defaultProjectId,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initialData?.title || '');
    setProjectId(initialData?.projectId || defaultProjectId || '');
    setStatus(initialData?.status || 'todo');
    setDueDate(initialData?.dueDate || getTodayIsoDate());
    setNotes(initialData?.notes || '');
    setError(null);
  }, [open, initialData, defaultProjectId]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('請輸入任務標題。');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const matchedProject = projects.find((p) => p.id === projectId);
      await onSubmit({
        title: title.trim(),
        projectId: matchedProject ? matchedProject.id : '',
        projectName: matchedProject ? matchedProject.name : '',
        status,
        dueDate,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存任務失敗，請再試一次。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={initialData ? '編輯任務' : '新增任務'}
      subtitle="設定任務標題、所屬專案、狀態與到期日"
    >
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="task-title" className="block text-xs font-medium text-slate-700">
            任務標題 *
          </label>
          <input
            id="task-title"
            type="text"
            required
            maxLength={BLUEPRINT_LIMITS.TASK_TITLE_MAX}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：交付首頁 Wireframe 初稿"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="task-project" className="block text-xs font-medium text-slate-700">
              關聯專案
            </label>
            <select
              id="task-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            >
              <option value="">一般個人任務（不指定專案）</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="task-status" className="block text-xs font-medium text-slate-700">
              任務狀態
            </label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            >
              <option value="todo">待辦</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="task-due" className="block text-xs font-medium text-slate-700">
            到期日
          </label>
          <input
            id="task-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="task-notes" className="block text-xs font-medium text-slate-700">
            任務備註
          </label>
          <textarea
            id="task-notes"
            rows={3}
            maxLength={BLUEPRINT_LIMITS.NOTES_MAX}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="補充細節、參考連結或客戶回饋..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
          >
            {saving ? '儲存中...' : initialData ? '儲存變更' : '建立任務'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// --- Work Log Modal (新增工作) ---

interface WorkLogModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: WorkLog | null;
  projects: Project[];
  clients: Client[];
  onSubmit: (data: WorkLogInput) => Promise<void>;
}

export const WorkLogModal: React.FC<WorkLogModalProps> = ({
  open,
  onClose,
  initialData,
  projects,
  clients,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [clientName, setClientName] = useState('');
  const [hours, setHours] = useState('2');
  const [workDate, setWorkDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initialData?.title || '');
    setProjectId(initialData?.projectId || '');
    setClientName(initialData?.clientName || '');
    setHours(initialData?.hours !== undefined ? String(initialData.hours) : '2');
    setWorkDate(initialData?.workDate || getTodayIsoDate());
    setNotes(initialData?.notes || '');
    setError(null);
  }, [open, initialData]);

  const handleProjectChange = (pid: string) => {
    setProjectId(pid);
    const matched = projects.find((p) => p.id === pid);
    if (matched?.clientName) {
      setClientName(matched.clientName);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('請輸入工作項目內容。');
      return;
    }
    const parsedHours = Math.max(0, Number(hours));
    if (!Number.isFinite(parsedHours)) {
      setError('請輸入有效的工作時數。');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const matchedProject = projects.find((p) => p.id === projectId);
      await onSubmit({
        title: title.trim(),
        projectId: matchedProject ? matchedProject.id : '',
        projectName: matchedProject ? matchedProject.name : '',
        clientName: clientName.trim(),
        hours: parsedHours,
        workDate: workDate || getTodayIsoDate(),
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存工作紀錄失敗，請再試一次。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={initialData ? '編輯工作紀錄' : '新增工作'}
      subtitle="記錄實際執行的接案工作內容、投入時數與對應專案"
    >
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="work-title" className="block text-xs font-medium text-slate-700">
            工作項目名稱 *
          </label>
          <input
            id="work-title"
            type="text"
            required
            maxLength={BLUEPRINT_LIMITS.WORKLOG_TITLE_MAX}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：客戶需求訪談與首頁視覺切版"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="work-project" className="block text-xs font-medium text-slate-700">
              關聯專案
            </label>
            <select
              id="work-project"
              value={projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            >
              <option value="">一般接案工作</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="work-client" className="block text-xs font-medium text-slate-700">
              客戶名稱
            </label>
            <input
              id="work-client"
              type="text"
              list="client-suggestions"
              maxLength={BLUEPRINT_LIMITS.CLIENT_NAME_MAX}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="選擇或輸入客戶名稱"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
            <datalist id="client-suggestions">
              {clients.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="work-hours" className="block text-xs font-medium text-slate-700">
              投入時數 (小時) *
            </label>
            <input
              id="work-hours"
              type="number"
              required
              min="0"
              max="1000"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="work-date" className="block text-xs font-medium text-slate-700">
              執行日期
            </label>
            <input
              id="work-date"
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="work-notes" className="block text-xs font-medium text-slate-700">
            工作成果備註
          </label>
          <textarea
            id="work-notes"
            rows={3}
            maxLength={BLUEPRINT_LIMITS.NOTES_MAX}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="記錄完成的模組、待確認事項..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
          >
            {saving ? '儲存中...' : initialData ? '儲存變更' : '記錄工作'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// --- Client Modal ---

interface ClientModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: Client | null;
  onSubmit: (data: ClientInput) => Promise<void>;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  open,
  onClose,
  initialData,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initialData?.name || '');
    setCompany(initialData?.company || '');
    setEmail(initialData?.email || '');
    setPhone(initialData?.phone || '');
    setNotes(initialData?.notes || '');
    setError(null);
  }, [open, initialData]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('請輸入客戶名稱。');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存客戶資料失敗，請再試一次。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={initialData ? '編輯客戶資料' : '新增客戶'}
      subtitle="維護合作窗口聯絡方式與品牌資訊"
    >
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="client-name" className="block text-xs font-medium text-slate-700">
              客戶／聯絡人名稱 *
            </label>
            <input
              id="client-name"
              type="text"
              required
              maxLength={BLUEPRINT_LIMITS.CLIENT_NAME_MAX}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：陳小姐"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="client-company" className="block text-xs font-medium text-slate-700">
              公司／品牌名稱
            </label>
            <input
              id="client-company"
              type="text"
              maxLength={BLUEPRINT_LIMITS.COMPANY_MAX}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="例如：晨曦文創有限公司"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="client-email" className="block text-xs font-medium text-slate-700">
              聯絡信箱
            </label>
            <input
              id="client-email"
              type="email"
              maxLength={BLUEPRINT_LIMITS.EMAIL_MAX}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="client-phone" className="block text-xs font-medium text-slate-700">
              聯絡電話
            </label>
            <input
              id="client-phone"
              type="text"
              maxLength={BLUEPRINT_LIMITS.PHONE_MAX}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912-345-678"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="client-notes" className="block text-xs font-medium text-slate-700">
            合作備註
          </label>
          <textarea
            id="client-notes"
            rows={3}
            maxLength={BLUEPRINT_LIMITS.NOTES_MAX}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="匯款偏好、溝通習慣或合作歷史..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
          >
            {saving ? '儲存中...' : initialData ? '儲存變更' : '建立客戶'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// --- Confirm Delete Modal ---

interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  open,
  onClose,
  title,
  description,
  onConfirm,
}) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ModalShell open={open} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p>{description}</p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
          >
            {deleting ? '刪除中...' : '確認刪除'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};
