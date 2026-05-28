import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'غير مصرح: لم يتم توفير رمز التحقق' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'غير مصرح: رمز التحقق غير صالح' });

    // Fetch transactions
    const { data: transactions, error: tError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id);
    if (tError) throw tError;

    // Fetch debts
    const { data: debts, error: dError } = await supabase
      .from('debts')
      .select('*, debt_payments(*)')
      .eq('user_id', user.id);
    if (dError) throw dError;

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryBreakdown = {};
    const monthlyTrend = {};

    transactions.forEach(t => {
      const amount = t.amount || 0;
      const date = t.date || '';
      const month = date.substring(0, 7); // YYYY-MM

      if (t.type === 'income') {
        totalIncome += amount;
        if (month) {
          if (!monthlyTrend[month]) monthlyTrend[month] = { income: 0, expense: 0 };
          monthlyTrend[month].income += amount;
        }
      } else if (t.type === 'expense') {
        totalExpenses += amount;
        if (month) {
          if (!monthlyTrend[month]) monthlyTrend[month] = { income: 0, expense: 0 };
          monthlyTrend[month].expense += amount;
        }
        const cat = t.category || 'أخرى';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amount;
      }
    });

    let totalOwedToMe = 0;
    let totalOwedToMePaid = 0;
    let totalIOwe = 0;
    let totalIOwePaid = 0;

    debts.forEach(d => {
      const amount = d.amount || 0;
      const paymentsSum = (d.debt_payments || []).reduce((sum, p) => sum + p.amount, 0);

      if (d.type === 'owe_me') {
        totalOwedToMe += amount;
        totalOwedToMePaid += paymentsSum;
      } else if (d.type === 'i_owe') {
        totalIOwe += amount;
        totalIOwePaid += paymentsSum;
      }
    });

    const netBalance = totalIncome - totalExpenses;
    const budget = profile?.monthly_budget || 0;
    const budgetUtilization = budget > 0 ? (totalExpenses / budget) * 100 : 0;

    return res.status(200).json({
      summary: {
        totalIncome,
        totalExpenses,
        netBalance,
        totalOwedToMe: totalOwedToMe - totalOwedToMePaid,
        totalIOwe: totalIOwe - totalIOwePaid,
        budget,
        budgetUtilization,
      },
      categoryBreakdown: Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value })),
      monthlyTrend: Object.entries(monthlyTrend)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, data]) => ({ month, ...data })),
      debtsSummary: {
        totalOwedToMeRaw: totalOwedToMe,
        totalOwedToMePaid,
        totalIOweRaw: totalIOwe,
        totalIOwePaid,
      }
    });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message });
  }
}
