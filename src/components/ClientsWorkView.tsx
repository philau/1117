import React, { useMemo, useState } from 'react';
import { Briefcase, Mail, Pencil, Phone, Plus, Search, Trash2, Users } from 'lucide-react';
import { Client, WorkLog } from '../types';

interface ClientsWorkViewProps {
  clients: Client[];
  workLogs: WorkLog[];
  loading: boolean;
  onCreateClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
  onCreateWorkLog: () => void;
  onEditWorkLog: (log: WorkLog) => void;
  onDeleteWorkLog: (log: WorkLog) => void;
}

export const ClientsWorkView: React.FC<ClientsWorkViewProps> = ({
  clients,
  workLogs,
  loading,
  onCreateClient,
  onEditClient,
  onDeleteClient,
  onCreateWorkLog,
  onEditWorkLog,
  onDeleteWorkLog,
}) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'work'>('clients');
  const [search, setSearch] = useState('');

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
    );
  }, [clients, search]);

  const filteredWorkLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workLogs;
    return workLogs.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        (w.projectName || '').toLowerCase().includes(q) ||
        (w.clientName || '').toLowerCase().includes(q)
    );
  }, [workLogs, search]);

  const totalHours = useMemo(
    () => workLogs.reduce((acc, cur) => acc + (Number(cur.hours) || 0), 0),
    [workLogs]
  );

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('clients')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                activeTab === 'clients'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              客戶名單 ({clients.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('work')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                activeTab === 'work'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              工作紀錄 ({workLogs.length} · {totalHours}h)
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'clients' ? '搜尋客戶或公司...' : '搜尋工作或專案...'}
              className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={activeTab === 'clients' ? onCreateClient : onCreateWorkLog}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{activeTab === 'clients' ? '新增客戶' : '新增工作'}</span>
        </button>
      </div>

      {/* Content */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : activeTab === 'clients' ? (
          filteredClients.length === 0 ? (
            <div className="px-6 py-16 text-center space-y-3">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">
                {clients.length === 0 ? '尚未建立客戶資料' : '找不到符合的客戶'}
              </p>
              <p className="text-xs text-slate-500">
                記錄合作窗口與品牌公司資訊，方便專案歸檔與聯繫。
              </p>
              {clients.length === 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onCreateClient}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>新增客戶</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <li
                  key={client.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-slate-900 truncate">{client.name}</span>
                      {client.company && (
                        <>
                          <span className="text-slate-300" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-slate-600 truncate">{client.company}</span>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      {client.email && (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.email}</span>
                        </span>
                      )}
                      {client.phone && (
                        <span className="inline-flex items-center gap-1.5 font-mono-tabular">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.phone}</span>
                        </span>
                      )}
                      {client.notes && <span className="truncate max-w-md">{client.notes}</span>}
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditClient(client)}
                      aria-label={`編輯 ${client.name}`}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteClient(client)}
                      aria-label={`刪除 ${client.name}`}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : filteredWorkLogs.length === 0 ? (
          <div className="px-6 py-16 text-center space-y-3">
            <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">
              {workLogs.length === 0 ? '尚未新增任何工作紀錄' : '找不到符合的工作紀錄'}
            </p>
            <p className="text-xs text-slate-500">
              記錄日常執行的工作項目與工時，累積清晰的工作歷程。
            </p>
            {workLogs.length === 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onCreateWorkLog}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>新增工作</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredWorkLogs.map((log) => (
              <li
                key={log.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{log.title}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {[
                      log.projectName || '一般接案工作',
                      log.clientName || null,
                      log.notes || null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="flex items-center gap-3 text-xs font-mono-tabular">
                    <span className="font-semibold text-slate-900">{log.hours} 小時</span>
                    <span className="text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-slate-500">{log.workDate}</span>
                  </div>

                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditWorkLog(log)}
                      aria-label={`編輯 ${log.title}`}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteWorkLog(log)}
                      aria-label={`刪除 ${log.title}`}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
