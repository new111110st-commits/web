import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit2, 
  TrendingUp, 
  TrendingDown, 
  X, 
  Calendar, 
  Tag, 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft,
  AlertCircle
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useSearchParams } from 'react-router-dom';

interface TransactionsProps {
  profile: any;
}

const INCOME_CATEGORIES = ['الراتب', 'عمل حر', 'استثمارات', 'مبيعات', 'مكافأة', 'أخرى'];
const EXPENSE_CATEGORIES = ['طعام وغذاء', 'سكن', 'فواتير', 'مواصلات', 'تعليم وتطوير', 'صحة وطب', 'ترفيه', 'ملابس', 'تسوق', 'أخرى'];

export default function Transactions({ profile }: TransactionsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const currency = profile?.currency || 'SAR';

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: EXPENSE_CATEGORIES[0],
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const url = `/api/transactions?search=${encodeURIComponent(search)}&type=${typeFilter}&category=${categoryFilter}`;
      const data = await apiFetch(url);
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search, typeFilter, categoryFilter]);

  // Open modal if URL has add=true
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      openAddModal();
      searchParams.delete('add');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  const openAddModal = () => {
    setEditingTransaction(null);
    setFormData({
      type: 'expense',
      amount: '',
      category: EXPENSE_CATEGORIES[0],
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: any) => {
    setEditingTransaction(t);
    setFormData({
      type: t.type,
      amount: t.amount.toString(),
      category: t.category,
      date: t.date,
      description: t.description || ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type,
      category: type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingTransaction) {
        // Edit mode
        await apiFetch('/api/transactions', {
          method: 'PUT',
          body: JSON.stringify({
            id: editingTransaction.id,
            ...formData
          })
        });
      } else {
        // Add mode
        await apiFetch('/api/transactions', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setIsModalOpen(false);
      fetchTransactions();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذه العملية المالية نهائياً؟')) return;
    try {
      await apiFetch('/api/transactions', {
        method: 'DELETE',
        body: JSON.stringify({ id })
      });
      fetchTransactions();
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">العمليات المالية</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">سجل وتابع جميع مدخولاتك ومصروفاتك اليومية بدقة.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-emerald-600/10 transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة عملية جديدة</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="البحث عن عملية مالية أو تصنيف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
          />
        </div>

        {/* Type filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white appearance-none cursor-pointer"
          >
            <option value="">كل العمليات</option>
            <option value="income">المدخولات فقط</option>
            <option value="expense">المصروفات فقط</option>
          </select>
        </div>

        {/* Category filter */}
        <div className="relative">
          <Tag className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white appearance-none cursor-pointer"
          >
            <option value="">كل التصنيفات</option>
            {[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">جاري تحميل العمليات المالية...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">لا توجد عمليات مالية</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-sm">لم نجد أي عمليات مالية تطابق مرشحات البحث الحالية. أضف عملية جديدة للبدء.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 px-6">العملية / الوصف</th>
                  <th className="py-4 px-6">التصنيف</th>
                  <th className="py-4 px-6">التاريخ</th>
                  <th className="py-4 px-6 text-left">المبلغ</th>
                  <th className="py-4 px-6 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${t.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'}`}>
                          {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-250">{t.description || t.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400 font-medium">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-450 font-mono text-xs">{t.date}</td>
                    <td className="py-4 px-6 text-left">
                      <span className={`text-base font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 mr-1">{currency}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(t)}
                          title="تعديل"
                          className="p-1.5 text-slate-400 hover:text-emerald-500 dark:text-slate-500 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          title="حذف"
                          className="p-1.5 text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {editingTransaction ? 'تعديل العملية المالية' : 'إضافة عملية مالية جديدة'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Type Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('expense')}
                    className={`py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${formData.type === 'expense' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span>مصروف</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('income')}
                    className={`py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${formData.type === 'income' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>مدخول</span>
                  </button>
                </div>

                {/* Amount Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">المبلغ ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                {/* Category Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">التصنيف</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white cursor-pointer"
                  >
                    {formData.type === 'income' 
                      ? INCOME_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)
                      : EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)
                    }
                  </select>
                </div>

                {/* Date Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">التاريخ</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                {/* Description Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">الوصف (اختياري)</label>
                  <textarea
                    placeholder="تفاصيل إضافية عن العملية..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white resize-none"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-emerald-600/10 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ العملية'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
