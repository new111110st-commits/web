import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Printer, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertCircle 
} from 'lucide-react';
import { apiFetch } from '../lib/api';

interface ReportsProps {
  profile: any;
}

export default function Reports({ profile }: ReportsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const currency = profile?.currency || 'SAR';

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/stats');
      setStats(data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">جاري إعداد التقارير المالية...</p>
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

  const maxCategoryValue = categories.length > 0 ? Math.max(...categories.map((c: any) => c.value)) : 1;
  const maxTrendValue = trend.length > 0 ? Math.max(...trend.map((t: any) => Math.max(t.income, t.expense))) : 1;

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full print:p-0 print:bg-white print:text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>التقارير والإحصائيات المالية</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">تحليل شامل ومفصل لمصادر دخلك وحركة مصروفاتك الشهرية.</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-xs"
        >
          <Printer className="w-5 h-5" />
          <span>طباعة / تصدير التقرير</span>
        </button>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block text-center border-b pb-6 mb-8">
        <h1 className="text-3xl font-bold">تقرير الوضع المالي الشامل - منصة ثروتي</h1>
        <p className="text-sm text-gray-500 mt-2">تاريخ إصدار التقرير: {new Date().toLocaleDateString('ar-SA')}</p>
        <p className="text-sm text-gray-500">اسم المستخدم: {profile?.full_name || 'عبد الله الغامدي'}</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xs print:border print:shadow-none">
          <span className="text-slate-400 text-xs font-bold">إجمالي الإيرادات (المدخولات)</span>
          <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {summary.totalIncome.toLocaleString()} <span className="text-sm font-medium">{currency}</span>
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">إجمالي التدفقات النقدية الواردة</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xs print:border print:shadow-none">
          <span className="text-slate-400 text-xs font-bold">إجمالي النفقات (المصروفات)</span>
          <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
            {summary.totalExpenses.toLocaleString()} <span className="text-sm font-medium">{currency}</span>
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">إجمالي النفقات والمصاريف المدفوعة</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xs print:border print:shadow-none">
          <span className="text-slate-400 text-xs font-bold">صافي الأرباح / العوائد</span>
          <h3 className={`text-2xl font-extrabold mt-2 ${summary.netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {summary.netBalance.toLocaleString()} <span className="text-sm font-medium">{currency}</span>
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">الرصيد المتبقي بعد طرح المصروفات</p>
        </div>
      </div>

      {/* Monthly Trend Chart (Custom CSS/SVG Visualizer) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xs print:border print:shadow-none">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">المنحنى الشهري للتدفقات المالية</h3>
        {trend.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 py-12">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p className="text-sm">لا توجد بيانات كافية لعرض المنحنى الشهري</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="h-64 flex items-end justify-between gap-4 pt-4 border-b border-slate-100 dark:border-slate-800">
              {trend.map((t: any) => {
                const incomeHeight = maxTrendValue > 0 ? (t.income / maxTrendValue) * 100 : 0;
                const expenseHeight = maxTrendValue > 0 ? (t.expense / maxTrendValue) * 100 : 0;

                return (
                  <div key={t.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="w-full flex justify-center gap-1.5 items-end h-[85%]">
                      {/* Income Bar */}
                      <div className="w-1/2 flex flex-col items-center justify-end h-full">
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded-sm mb-1 transition-opacity duration-200">
                          {t.income.toLocaleString()}
                        </span>
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${incomeHeight}%` }}
                          transition={{ duration: 0.6 }}
                          className="w-full bg-emerald-500 rounded-t-md cursor-pointer hover:bg-emerald-600 transition-colors"
                        ></motion.div>
                      </div>

                      {/* Expense Bar */}
                      <div className="w-1/2 flex flex-col items-center justify-end h-full">
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1 rounded-sm mb-1 transition-opacity duration-200">
                          {t.expense.toLocaleString()}
                        </span>
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${expenseHeight}%` }}
                          transition={{ duration: 0.6 }}
                          className="w-full bg-rose-500 rounded-t-md cursor-pointer hover:bg-rose-600 transition-colors"
                        ></motion.div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono mt-1">{t.month}</span>
                  </div>
                );
              })}
            </div>
            {/* Chart Legend */}
            <div className="flex justify-center gap-6 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-3.5 h-3.5 bg-emerald-500 rounded-xs"></span>
                <span>المدخولات (الإيرادات)</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-3.5 h-3.5 bg-rose-500 rounded-xs"></span>
                <span>المصروفات (النفقات)</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Categories Breakdown & Visual Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Category breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xs print:border print:shadow-none">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">المصروفات حسب التصنيف</h3>
          {categories.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">لا توجد نفقات مسجلة بعد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((cat: any, i: number) => {
                const colors = ['bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-teal-500', 'bg-emerald-500'];
                const colorClass = colors[i % colors.length];
                const percentage = (cat.value / summary.totalExpenses) * 100;

                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{cat.name} ({percentage.toFixed(0)}%)</span>
                      <span className="font-bold text-slate-950 dark:text-white">{cat.value.toLocaleString()} {currency}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
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

        {/* Budget Utilization Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xs print:border print:shadow-none flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">تحليل الميزانية الشهرية والإنفاق</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">مقارنة بين إجمالي المصروفات الفعلية والميزانية التقديرية المحددة في الإعدادات.</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">الميزانية المستهدفة</h4>
                <p className="text-lg font-extrabold text-slate-800 dark:text-white mt-1">{summary.budget.toLocaleString()} {currency}</p>
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">الإنفاق الفعلي</h4>
                <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-1">{summary.totalExpenses.toLocaleString()} {currency}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-600 dark:text-slate-400">مستوى استهلاك الميزانية</span>
                <span className={summary.budgetUtilization > 100 ? 'text-rose-600' : 'text-emerald-600'}>
                  {summary.budgetUtilization.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-550 ${summary.budgetUtilization > 100 ? 'bg-rose-500' : summary.budgetUtilization > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(summary.budgetUtilization, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {summary.budgetUtilization > 100 
                  ? '⚠️ انتبه! لقد تجاوزت الحد الأقصى للميزانية الشهرية المحددة.' 
                  : summary.budgetUtilization > 80 
                    ? '⚠️ تحذير: لقد قاربت على استهلاك كامل الميزانية الشهرية.' 
                    : '✅ رائع! مصروفاتك الحالية تقع ضمن نطاق الميزانية الآمن.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
