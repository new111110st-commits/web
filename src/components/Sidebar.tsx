import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowDownUp, 
  HandCoins, 
  BarChart3, 
  User, 
  LogOut, 
  Sun, 
  Moon,
  Wallet
} from 'lucide-react';
import supabase from '../lib/supabase';

interface SidebarProps {
  user: any;
  profile: any;
  theme: string;
  toggleTheme: () => void;
}

export default function Sidebar({ user, profile, theme, toggleTheme }: SidebarProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'لوحة التحكم' },
    { to: '/transactions', icon: ArrowDownUp, label: 'العمليات المالية' },
    { to: '/debts', icon: HandCoins, label: 'إدارة الديون' },
    { to: '/reports', icon: BarChart3, label: 'التقارير والإحصائيات' },
    { to: '/profile', icon: User, label: 'الملف الشخصي' },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 flex flex-col h-screen sticky top-0 transition-colors duration-300">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-850 dark:text-white leading-none">ثروتي</h1>
          <span className="text-xs text-slate-400 dark:text-slate-500">إدارة مالية ذكية</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                ${isActive 
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Theme & User Profile */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
        >
          <span className="flex items-center gap-3">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
            <span>{theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
          </span>
          <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            {theme === 'dark' ? 'نهاري' : 'ليلي'}
          </span>
        </button>

        {/* User Info Card */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-base">
            {(profile?.full_name || user?.email || 'ع').substring(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
              {profile?.full_name || 'مستخدم ثروتي'}
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
              {user?.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            title="تسجيل الخروج"
            className="p-1.5 text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
