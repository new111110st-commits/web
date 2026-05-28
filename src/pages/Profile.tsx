import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Settings, 
  Wallet, 
  Palette, 
  Check, 
  AlertCircle,
  Key
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import supabase from '../lib/supabase';

interface ProfileProps {
  profile: any;
  setProfile: (p: any) => void;
  theme: string;
  setTheme: (t: string) => void;
}

const CURRENCIES = [
  { code: 'SAR', name: 'ريال سعودي (SAR)' },
  { code: 'USD', name: 'دولار أمريكي (USD)' },
  { code: 'EUR', name: 'يورو أوروبي (EUR)' },
  { code: 'AED', name: 'درهم إماراتي (AED)' },
  { code: 'KWD', name: 'دينار كويتي (KWD)' },
  { code: 'QAR', name: 'ريال قطري (QAR)' },
  { code: 'EGP', name: 'جنيه مصري (EGP)' }
];

export default function Profile({ profile, setProfile, theme, setTheme }: ProfileProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    currency: 'SAR',
    monthly_budget: '5000'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirm_password: ''
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        currency: profile.currency || 'SAR',
        monthly_budget: (profile.monthly_budget || 0).toString()
      });
    }
  }, [profile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError('');

    if (!formData.full_name.trim()) {
      setError('يرجى إدخال اسمك الكامل');
      return;
    }
    if (parseFloat(formData.monthly_budget) < 0) {
      setError('يجب أن تكون الميزانية الشهرية أكبر من أو تساوي الصفر');
      return;
    }

    try {
      setLoading(true);
      const updated = await apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      setProfile(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSuccess(false);
    setPwError('');

    if (passwordForm.password.length < 6) {
      setPwError('يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل');
      return;
    }
    if (passwordForm.password !== passwordForm.confirm_password) {
      setPwError('كلمتا المرور غير متطابقتين');
      return;
    }

    try {
      setPwLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.password
      });
      if (error) throw error;
      setPwSuccess(true);
      setPasswordForm({ password: '', confirm_password: '' });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: any) {
      setPwError(err.message || 'حدث خطأ أثناء تحديث كلمة المرور');
    } finally {
      setPwLoading(false);
    }
  };

  const handleThemeChange = (selectedTheme: string) => {
    setTheme(selectedTheme);
    // Persist to database profile
    apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({
        ...formData,
        theme: selectedTheme
      })
    }).catch(err => console.error('Error updating theme settings:', err));
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto max-w-4xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">الملف الشخصي والإعدادات</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">قم بتخصيص حسابك المالي، وتعديل الميزانية، والعملة، وإعدادات المظهر.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column: Quick settings/summary */}
        <div className="md:col-span-1 space-y-6">
          {/* Avatar Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xs text-center">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center font-bold text-3xl mx-auto mb-4 border-4 border-emerald-50 dark:border-emerald-900">
              {(profile?.full_name || 'ع').substring(0, 1).toUpperCase()}
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{profile?.full_name || 'مستخدم ثروتي'}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{profile ? 'مستخدم نشط' : ''}</p>
          </div>

          {/* Theme Selector Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>مظهر التطبيق</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleThemeChange('light')}
                className={`py-2 px-3 rounded-xl font-semibold text-xs transition-all ${theme === 'light' ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-emerald-500' : 'text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800'}`}
              >
                نهاري (Light)
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`py-2 px-3 rounded-xl font-semibold text-xs transition-all ${theme === 'dark' ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-emerald-500' : 'text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800'}`}
              >
                ليلي (Dark)
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Settings Forms */}
        <div className="md:col-span-2 space-y-8">
          {/* Profile Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b pb-4 border-slate-100 dark:border-slate-800">
              <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>إعدادات الحساب والمالية</span>
            </h3>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {success && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>تم حفظ الإعدادات بنجاح!</span>
                </div>
              )}
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">العملة الافتراضية</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white cursor-pointer"
                >
                  {CURRENCIES.map(curr => (
                    <option key={curr.code} value={curr.code}>{curr.name}</option>
                  ))}
                </select>
              </div>

              {/* Monthly Budget */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">الميزانية الشهرية المقدرة</label>
                <input
                  type="number"
                  required
                  value={formData.monthly_budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthly_budget: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-emerald-600/10 transition-colors disabled:opacity-50"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </form>
          </div>

          {/* Password Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b pb-4 border-slate-100 dark:border-slate-800">
              <Key className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>تغيير كلمة المرور</span>
            </h3>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {pwSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>تم تحديث كلمة المرور بنجاح!</span>
                </div>
              )}
              {pwError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{pwError}</span>
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  placeholder="6 أحرف على الأقل"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  placeholder="أعد إدخال كلمة المرور"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={pwLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-emerald-600/10 transition-colors disabled:opacity-50"
              >
                {pwLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
