import React from 'react';
import {
  Briefcase,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { UserProfile, ViewKey } from '../types';
import { Avatar } from './Avatar';

interface SidebarProps {
  activeView: ViewKey;
  onSelectView: (view: ViewKey) => void;
  profile: UserProfile | null;
  fallbackName: string;
  fallbackEmail: string;
  fallbackPhoto?: string | null;
  onSignOut: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'dashboard', label: '儀表板總覽', icon: LayoutDashboard },
  { key: 'projects', label: '專案管理', icon: FolderKanban },
  { key: 'tasks', label: '任務管理', icon: CheckSquare },
  { key: 'clients_work', label: '客戶與工作', icon: Users },
  { key: 'profile', label: '個人資料設定', icon: UserCog },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  profile,
  fallbackName,
  fallbackEmail,
  fallbackPhoto,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}) => {
  const displayName = profile?.displayName || fallbackName || '自由接案工作者';
  const subtitle = profile?.title || fallbackEmail || 'Freelancer';
  const avatarUrl = profile?.photoURL || fallbackPhoto;

  const handleNav = (key: ViewKey) => {
    onSelectView(key);
    onCloseMobile();
  };

  const navContent = (
    <div className="h-full flex flex-col bg-white border-r border-slate-200 w-64">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 shrink-0">
        <button
          type="button"
          onClick={() => handleNav('dashboard')}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            接案工作台
          </span>
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="關閉選單"
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="主導覽列">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = activeView === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleNav(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`}
              />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-3 shrink-0">
        <button
          type="button"
          onClick={() => handleNav('profile')}
          className="w-full flex items-center gap-3 p-2 -mx-1 rounded-lg hover:bg-slate-100/70 transition-colors text-left cursor-pointer"
        >
          <Avatar src={avatarUrl} alt={displayName} sizeClass="w-9 h-9" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
            <p className="text-xs text-slate-500 truncate">{subtitle}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>登出帳號</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block shrink-0">{navContent}</aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{navContent}</div>
        </div>
      )}
    </>
  );
};
