import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowDownUp, 
  AlertCircle, 
  Plus, 
  Coins, 
  CheckCircle2, 
  Clock,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Link } from 'react-router-dom';

interface DashboardProps {
  profile: any;
}

export default function Dashboard({ profile }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const currency = profile?.currency || 'SAR';

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsData = await apiFetch('/api/stats');
      setStats(statsData);

      const txData = await apiFetch('/api/transactions?limit=5');
      setRecentTransactions(txData.slice(0, 5));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">جاري تحميل بيانات لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  const summary = stats?.summary || {
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    totalOwedToMe: 0,
    totalIOwe: 0,
    budget: 0,
    budgetUtilization: 0
  };

  const categories = stats?.categoryBreakdown || [];
  const trend = stats?.monthlyTrend || [];

  // Find max value in categories to scale the progress bars
  const maxCategoryValue = categories.length > 0 ? Math.max(...categories.map((c: any) => c.value)) : 1;

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">أهلاً بك، {profile?.full_name || 'مستخدم ثروتي'} 👋</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">إليك نظرة عامة على وضعك المالي اليوم.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/transactions?add=true"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-emerald-600/10 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة عملية مالية</span>
          </Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Net Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-sm font-medium">الرصيد الحالي</span>
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold tracking-tight">
              {summary.netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              <span className="text-sm font-normal text-slate-400 mr-1.5">{currency}</span>
            </h3>
            <span className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${summary.netBalance >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {summary.netBalance >= 0 ? 'رصيد إيجابي' : 'رصيد سلبي'}
            </span>
          </div>
        </motion.div>

        {/* Total Income Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xs flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">إجمالي المدخولات</span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
              {summary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500 mr-1.5">{currency}</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              <span>مصادر الدخل النشطة والفرعية</span>
            </p>
          </div>
        </motion.div>

        {/* Total Expenses Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xs flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">إجمالي المصروفات</span>
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 rounded-xl">
              <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
              {summary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500 mr-1.5">{currency}</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-rose-500" />
              <span>المصاريف والالتزامات الثابتة والمتغيرة</span>
            </p>
          </div>
        </motion.div>

        {/* Monthly Budget Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xs flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">الميزانية الشهرية</span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
              {summary.budget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500 mr-1.5">{currency}</span>
            </h3>
            <div className="mt-2.5">
              <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                <span>الاستهلاك: {summary.budgetUtilization.toFixed(0)}%</span>
                <span>{summary.totalExpenses.toLocaleString()} / {summary.budget.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-550 ${summary.budgetUtilization > 100 ? 'bg-rose-500' : summary.budgetUtilization > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(summary.budgetUtilization, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Debts Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 p-6 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500 text-white rounded-xl">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400">ديون مستحقة لك (تنتظر تحصيلها)</h4>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {summary.totalOwedToMe.toLocaleString()} <span className="text-xs font-medium">{currency}</span>
              </p>
            </div>
          </div>
          <Link to="/debts" className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:underline">إدارة الديون ←</Link>
        </div>

        <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 p-6 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500 text-white rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400">التزامات وديون عليك (يجب سدادها)</h4>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {summary.totalIOwe.toLocaleString()} <span className="text-xs font-medium">{currency}</span>
              </p>
            </div>
          </div>
          <Link to="/debts" className="text-rose-600 dark:text-rose-400 font-semibold text-sm hover:underline">إدارة الديون ←</Link>
        </div>
      </div>

      {/* Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category breakdown bar chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xs lg:col-span-1">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">المصروفات حسب التصنيف</h3>
          {categories.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">لا توجد مصروفات مسجلة حتى الآن</p>
            </div>
          ) : (
            <div className="space-y-5">
              {categories.map((cat: any, i: number) => {
                const colors = ['bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-teal-500', 'bg-emerald-500'];
                const colorClass = colors[i % colors.length];
                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{cat.name}</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {cat.value.toLocaleString()} <span className="text-xs font-normal text-slate-400">{currency}</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(cat.value / maxCategoryValue) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        className={`h-full rounded-full ${colorClass}`}
                      ></motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xs lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">أحدث العمليات المالية</h3>
            <Link to="/transactions" className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold hover:underline">عرض الكل ←</Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12">
              <ArrowDownUp className="w-10 h-10 mb-2" />
              <p className="text-sm">لا توجد عمليات مالية مضافة بعد</p>
            </div>
          ) : (
            <div className="flex-1 space-y-4">
              {recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-200">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${t.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'}`}>
                      {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-250">{t.description || t.category}</h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t.category} • {t.date}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className={`text-base font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 mr-1">{currency}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
