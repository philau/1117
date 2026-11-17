import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { Briefcase, CheckSquare, FolderKanban, LogIn, Users } from 'lucide-react';
import { auth, formatFriendlyError, googleProvider } from '../lib/firebase';

export const AuthGate: React.FC = () => {
  const [signingIn, setSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setErrorMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setErrorMsg(formatFriendlyError(err));
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                接案工作台
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                自由接案工作者的現代化專案與任務中樞
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                集中管理進行中專案、客戶合作關係、每日待辦任務與工時紀錄，所有資料透過 Cloud Firestore 即時安全同步。
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                  <FolderKanban className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>專案進度追蹤</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  掌握截止日期、專案狀態與關聯任務完成度。
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                  <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>待辦任務管理</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  快速切換待辦與已完成狀態，避免漏接重要交付。
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                  <Users className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>客戶與工時紀錄</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  統整合作客戶資料與接案工作時數，清楚呈現產出。
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 text-xs text-slate-400">
            資料採用個人專屬權限控管，僅限您本人帳號存取與編輯。
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-8 flex flex-col justify-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">登入工作台</h2>
            <p className="text-sm text-slate-500">
              使用 Google 帳號安全登入，立即同步您的接案儀表板資料。
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
              {errorMsg}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogIn className="w-4 h-4 shrink-0" />
            <span>{signingIn ? '正在驗證登入...' : '使用 Google 帳號登入'}</span>
          </button>

          <p className="text-xs text-slate-400 leading-relaxed">
            首次登入系統將自動為您建立專屬個人設定檔，並可在「個人設定」頁面隨時更新。
          </p>
        </div>
      </div>
    </div>
  );
};
