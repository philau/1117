import React, { useEffect, useState } from 'react';
import { Check, Save } from 'lucide-react';
import { BLUEPRINT_LIMITS, CURRENCIES, CurrencyCode, ProfileInput, UserProfile } from '../types';
import { Avatar } from './Avatar';

interface ProfileSettingsViewProps {
  profile: UserProfile | null;
  fallbackEmail: string;
  fallbackName: string;
  fallbackPhoto?: string | null;
  loading: boolean;
  onSave: (input: ProfileInput) => Promise<void>;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  profile,
  fallbackEmail,
  fallbackName,
  fallbackPhoto,
  loading,
  onSave,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [hourlyRate, setHourlyRate] = useState('1500');
  const [currency, setCurrency] = useState<CurrencyCode>('TWD');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');

  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(profile?.displayName || fallbackName || '');
    setTitle(profile?.title || '獨立接案工作者');
    setEmail(profile?.email || fallbackEmail || '');
    setPhone(profile?.phone || '');
    setLocation(profile?.location || '台灣');
    setWebsite(profile?.website || '');
    setHourlyRate(
      profile?.hourlyRate !== undefined ? String(profile.hourlyRate) : '1500'
    );
    setCurrency(profile?.currency || 'TWD');
    setBio(profile?.bio || '');
    setPhotoURL(profile?.photoURL || fallbackPhoto || '');
  }, [profile, fallbackEmail, fallbackName, fallbackPhoto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('顯示名稱不可為空白。');
      return;
    }

    setSaving(true);
    setError(null);
    setSavedNotice(false);

    try {
      const rateNum = hourlyRate.trim() ? Math.max(0, Number(hourlyRate)) : 0;
      await onSave({
        displayName: displayName.trim(),
        email: email.trim(),
        title: title.trim(),
        phone: phone.trim(),
        location: location.trim(),
        website: website.trim(),
        hourlyRate: Number.isFinite(rateNum) ? rateNum : 0,
        currency,
        bio: bio.trim(),
        photoURL: photoURL.trim(),
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新個人資料失敗，請稍後再試。');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-40 bg-slate-100 rounded animate-pulse" />
            <div className="h-3 w-56 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Profile Summary Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <Avatar
          src={photoURL || fallbackPhoto}
          alt={displayName || '個人頭像'}
          sizeClass="w-16 h-16"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 truncate">
            {displayName || '未設定名稱'}
          </h2>
          <p className="text-sm text-slate-500 truncate">
            {[title || '自由接案工作者', location || null, email || null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <p className="text-xs text-slate-500">參考時薪費率</p>
          <p className="text-lg font-semibold text-slate-900 font-mono-tabular mt-0.5">
            {currency} {Number(hourlyRate || 0).toLocaleString()} / hr
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">編輯個人資料</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            更新您的聯絡資訊、專業職稱與接案費率設定，變更將即時儲存至 Firestore
          </p>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          {savedNotice && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>個人資料已成功儲存並同步。</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label htmlFor="profile-name" className="block text-xs font-medium text-slate-700">
                顯示名稱 *
              </label>
              <input
                id="profile-name"
                type="text"
                required
                maxLength={BLUEPRINT_LIMITS.DISPLAY_NAME_MAX}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-title" className="block text-xs font-medium text-slate-700">
                專業職稱／領域
              </label>
              <input
                id="profile-title"
                type="text"
                maxLength={BLUEPRINT_LIMITS.TITLE_ROLE_MAX}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：資深 UI/UX 設計師、全端工程師"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label htmlFor="profile-email" className="block text-xs font-medium text-slate-700">
                聯絡信箱
              </label>
              <input
                id="profile-email"
                type="email"
                maxLength={BLUEPRINT_LIMITS.EMAIL_MAX}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-phone" className="block text-xs font-medium text-slate-700">
                聯絡電話
              </label>
              <input
                id="profile-phone"
                type="text"
                maxLength={BLUEPRINT_LIMITS.PHONE_MAX}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912-345-678"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label htmlFor="profile-location" className="block text-xs font-medium text-slate-700">
                所在地區／時區
              </label>
              <input
                id="profile-location"
                type="text"
                maxLength={BLUEPRINT_LIMITS.LOCATION_MAX}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例如：台北, 台灣 (UTC+8)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-website" className="block text-xs font-medium text-slate-700">
                作品集／個人網站
              </label>
              <input
                id="profile-website"
                type="url"
                maxLength={BLUEPRINT_LIMITS.WEBSITE_MAX}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://portfolio.example.com"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label htmlFor="profile-rate" className="block text-xs font-medium text-slate-700">
                標準時薪
              </label>
              <input
                id="profile-rate"
                type="number"
                min="0"
                max={BLUEPRINT_LIMITS.HOURLY_RATE_MAX}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-currency" className="block text-xs font-medium text-slate-700">
                結算幣別
              </label>
              <select
                id="profile-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-bio" className="block text-xs font-medium text-slate-700">
              個人簡介與專長說明
            </label>
            <textarea
              id="profile-bio"
              rows={4}
              maxLength={BLUEPRINT_LIMITS.BIO_MAX}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="介紹您的接案年資、核心技能與可配合的工作模式..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
            <p className="text-xs text-slate-400 text-right font-mono-tabular">
              {bio.length} / {BLUEPRINT_LIMITS.BIO_MAX}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-200 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>{saving ? '儲存中...' : '儲存個人設定'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
