import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Coins, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Calendar, 
  User, 
  DollarSign, 
  ChevronDown, 
  ChevronUp,
  CreditCard
} from 'lucide-react';
import { apiFetch } from '../lib/api';

interface DebtsProps {
  profile: any;
}

export default function Debts({ profile }: DebtsProps) {
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'owe_me' | 'i_owe'>('owe_me');
  const currency = profile?.currency || 'SAR';

  // Debt Modal State
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [debtForm, setDebtForm] = useState({
    type: 'owe_me',
    person_name: '',
    amount: '',
    due_date: '',
    description: '',
    status: 'pending'
  });
  const [isDebtSubmitting, setIsDebtSubmitting] = useState(false);
  const [debtError, setDebtError] = useState('');

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Expanded payments list for a specific debt
  const [expandedDebtId, setExpandedDebtId] = useState<number | null>(null);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/debts');
      setDebts(data);
    } catch (err) {
      console.error('Error fetching debts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  const openAddDebtModal = () => {
    setEditingDebt(null);
    setDebtForm({
      type: activeTab,
      person_name: '',
      amount: '',
      due_date: new Date().toISOString().split('T')[0],
      description: '',
      status: 'pending'
    });
    setDebtError('');
    setIsDebtModalOpen(true);
  };

  const openEditDebtModal = (d: any) => {
    setEditingDebt(d);
    setDebtForm({
      type: d.type,
      person_name: d.person_name,
      amount: d.amount.toString(),
      due_date: d.due_date || '',
      description: d.description || '',
      status: d.status
    });
    setDebtError('');
    setIsDebtModalOpen(true);
  };

  const handleDebtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDebtError('');

    if (!debtForm.person_name.trim()) {
      setDebtError('يرجى إدخال اسم المدين أو الدائن');
      return;
    }
    if (!debtForm.amount || parseFloat(debtForm.amount) <= 0) {
      setDebtError('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    try {
      setIsDebtSubmitting(true);
      if (editingDebt) {
        await apiFetch('/api/debts', {
          method: 'PUT',
          body: JSON.stringify({
            id: editingDebt.id,
            ...debtForm
          })
        });
      } else {
        await apiFetch('/api/debts', {
          method: 'POST',
          body: JSON.stringify(debtForm)
        });
      }
      setIsDebtModalOpen(false);
      fetchDebts();
    } catch (err: any) {
      setDebtError(err.message || 'حدث خطأ أثناء حفظ الدين');
    } finally {
      setIsDebtSubmitting(false);
    }
  };

  const handleDeleteDebt = async (id: number) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الدين وجميع سجلات سداده بشكل نهائي؟')) return;
    try {
      await apiFetch('/api/debts', {
        method: 'DELETE',
        body: JSON.stringify({ id })
      });
      fetchDebts();
    } catch (err) {
      console.error('Error deleting debt:', err);
    }
  };

  const openPaymentModal = (d: any) => {
    setSelectedDebt(d);
    const paymentsSum = (d.debt_payments || []).reduce((sum: number, p: any) => sum + p.amount, 0);
    const remaining = d.amount - paymentsSum;

    setPaymentForm({
      amount: remaining.toString(),
      payment_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setPaymentError('');
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');

    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      setPaymentError('يرجى إدخال مبلغ سداد صحيح');
      return;
    }

    try {
      setIsPaymentSubmitting(true);
      await apiFetch('/api/debt-payments', {
        method: 'POST',
        body: JSON.stringify({
          debt_id: selectedDebt.id,
          ...paymentForm
        })
      });
      setIsPaymentModalOpen(false);
      fetchDebts();
    } catch (err: any) {
      setPaymentError(err.message || 'حدث خطأ أثناء تسجيل الدفعة');
    } finally {
      setIsPaymentSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId: number, debtId: number) => {
    if (!confirm('هل تريد فعلاً حذف دفعة السداد هذه؟')) return;
    try {
      await apiFetch('/api/debt-payments', {
        method: 'DELETE',
        body: JSON.stringify({ id: paymentId, debt_id: debtId })
      });
      fetchDebts();
    } catch (err) {
      console.error('Error deleting payment:', err);
    }
  };

  const filteredDebts = debts.filter(d => d.type === activeTab);

  // Totals calculations
  const totalAmount = filteredDebts.reduce((sum, d) => sum + d.amount, 0);
  const totalPaid = filteredDebts.reduce((sum, d) => {
    const paymentsSum = (d.debt_payments || []).reduce((pSum: number, p: any) => pSum + p.amount, 0);
    return sum + paymentsSum;
  }, 0);
  const totalRemaining = totalAmount - totalPaid;

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">إدارة الديون والالتزامات</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">تتبع الديون المستحقة لك على الآخرين، أو الالتزامات المالية التي يجب عليك سدادها.</p>
        </div>
        <button
          onClick={openAddDebtModal}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-emerald-600/10 transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة دين جديد</span>
        </button>
      </div>

      {/* Debt Type Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 max-w-md rounded-2xl shadow-xs">
        <button
          onClick={() => setActiveTab('owe_me')}
          className={`py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'owe_me' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
        >
          <Coins className="w-4 h-4" />
          <span>ديون لي على الآخرين</span>
        </button>
        <button
          onClick={() => setActiveTab('i_owe')}
          className={`py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'i_owe' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
        >
          <Clock className="w-4 h-4" />
          <span>التزامات وديون عليّ</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي قيمة الديون</h4>
            <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{totalAmount.toLocaleString()} <span className="text-xs font-normal text-slate-400">{currency}</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">ما تم سداده</h4>
            <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{totalPaid.toLocaleString()} <span className="text-xs font-normal text-slate-400">{currency}</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">المبلغ المتبقي المعلق</h4>
            <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{totalRemaining.toLocaleString()} <span className="text-xs font-normal text-slate-400">{currency}</span></p>
          </div>
        </div>
      </div>

      {/* Debts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-12 rounded-2xl text-center shadow-xs">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">جاري تحميل كشوفات الديون...</p>
          </div>
        ) : filteredDebts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-16 rounded-2xl text-center shadow-xs flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">لا توجد ديون مسجلة</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-sm">
              {activeTab === 'owe_me' 
                ? 'ليس لديك ديون مستحقة على الآخرين حالياً.' 
                : 'رائع! ليس عليك أي ديون أو التزامات مالية حالية.'}
            </p>
          </div>
        ) : (
          filteredDebts.map((debt) => {
            const payments = debt.debt_payments || [];
            const paymentsSum = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
            const remaining = debt.amount - paymentsSum;
            const progress = (paymentsSum / debt.amount) * 100;
            const isExpanded = expandedDebtId === debt.id;

            return (
              <motion.div
                key={debt.id}
                layout
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden"
              >
                {/* Debt Card Header */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-white">{debt.person_name}</h3>
                      {debt.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{debt.description}</p>}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>تاريخ الاستحقاق: {debt.due_date || 'غير محدد'}</span>
                        </span>
                        <span>•</span>
                        <span>تاريخ الإنشاء: {new Date(debt.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-2 text-right">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-slate-850 dark:text-white">{debt.amount.toLocaleString()}</span>
                      <span className="text-xs font-normal text-slate-400">{currency}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status Badge */}
                      {debt.status === 'paid' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>سدد بالكامل</span>
                        </span>
                      )}
                      {debt.status === 'partially_paid' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                          <Clock className="w-3 h-3" />
                          <span>سدد جزئياً ({paymentsSum.toLocaleString()} {currency})</span>
                        </span>
                      )}
                      {debt.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <AlertCircle className="w-3 h-3" />
                          <span>غير مسدد</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="px-5 pb-4">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-350"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
                    <span>نسبة السداد: {progress.toFixed(0)}%</span>
                    <span>المتبقي: {remaining.toLocaleString()} {currency}</span>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {debt.status !== 'paid' && (
                      <button
                        onClick={() => openPaymentModal(debt)}
                        className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>تسجيل دفعة سداد</span>
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedDebtId(isExpanded ? null : debt.id)}
                      className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    >
                      <span>سجل الدفعات ({payments.length})</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditDebtModal(debt)}
                      title="تعديل الدين"
                      className="p-1.5 text-slate-400 hover:text-emerald-500 dark:text-slate-500 dark:hover:text-emerald-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDebt(debt.id)}
                      title="حذف الدين"
                      className="p-1.5 text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Payments List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 overflow-hidden"
                    >
                      <div className="p-5 space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">سجل الدفعات المسددة لهذا الدين:</h4>
                        {payments.length === 0 ? (
                          <p className="text-sm text-slate-400 dark:text-slate-500 py-2">لا توجد دفعات مسجلة بعد.</p>
                        ) : (
                          <div className="space-y-2">
                            {payments.map((p: any) => (
                              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800/60 text-xs">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-350">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.amount.toLocaleString()} {currency}</span>
                                    <span>•</span>
                                    <span className="font-mono text-slate-400">{p.payment_date}</span>
                                  </div>
                                  {p.notes && <p className="text-slate-400 dark:text-slate-500">{p.notes}</p>}
                                </div>
                                <button
                                  onClick={() => handleDeletePayment(p.id, debt.id)}
                                  className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-1.5 rounded-lg transition-colors"
                                  title="حذف الدفعة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add / Edit Debt Modal */}
      <AnimatePresence>
        {isDebtModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {editingDebt ? 'تعديل بيانات الدين' : 'إضافة دين / التزام جديد'}
                </h3>
                <button
                  onClick={() => setIsDebtModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDebtSubmit} className="p-5 space-y-4">
                {debtError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{debtError}</span>
                  </div>
                )}

                {/* Debt Type Toggle Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDebtForm(prev => ({ ...prev, type: 'owe_me' }))}
                    className={`py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${debtForm.type === 'owe_me' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    <Coins className="w-4 h-4" />
                    <span>دين لي على الآخرين</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDebtForm(prev => ({ ...prev, type: 'i_owe' }))}
                    className={`py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${debtForm.type === 'i_owe' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>التزام / دين عليّ</span>
                  </button>
                </div>

                {/* Person Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">اسم الشخص / الجهة</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: محمد العتيبي، شركة التقسيط"
                    value={debtForm.person_name}
                    onChange={(e) => setDebtForm(prev => ({ ...prev, person_name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                {/* Original Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">المبلغ الإجمالي ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={debtForm.amount}
                    onChange={(e) => setDebtForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">تاريخ الاستحقاق المتوقع</label>
                  <input
                    type="date"
                    value={debtForm.due_date}
                    onChange={(e) => setDebtForm(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">ملاحظات / سبب الدين</label>
                  <textarea
                    placeholder="تفاصيل إضافية حول شروط السداد أو تفاصيل الدين..."
                    value={debtForm.description}
                    onChange={(e) => setDebtForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white resize-none"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={isDebtSubmitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-emerald-600/10 transition-colors disabled:opacity-50"
                  >
                    {isDebtSubmitting ? 'جاري الحفظ...' : 'حفظ الدين'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDebtModalOpen(false)}
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

      {/* Record Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedDebt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="text-right">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">تسجيل دفعة سداد</h3>
                  <p className="text-xs text-slate-500 mt-0.5">لصالح: {selectedDebt.person_name}</p>
                </div>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4">
                {paymentError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Payment Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 font-medium">مبلغ الدفعة ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                {/* Payment Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 font-medium">تاريخ الدفع</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 font-medium">ملاحظات السداد (مثال: تحويل بنكي، نقداً)</label>
                  <input
                    type="text"
                    placeholder="ملاحظات اختيارية..."
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={isPaymentSubmitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-emerald-600/10 transition-colors disabled:opacity-50"
                  >
                    {isPaymentSubmitting ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
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
