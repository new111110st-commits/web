import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'غير مصرح: لم يتم توفير رمز التحقق' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'غير مصرح: رمز التحقق غير صالح' });

    if (req.method === 'POST') {
      const { debt_id, amount, payment_date, notes } = req.body;
      if (!debt_id || !amount || !payment_date) {
        return res.status(400).json({ error: 'الحقول المطلوبة ناقصة' });
      }

      // 1. Insert the payment
      const { data: payment, error: paymentError } = await supabase
        .from('debt_payments')
        .insert({
          user_id: user.id,
          debt_id: parseInt(debt_id),
          amount: parseFloat(amount),
          payment_date,
          notes: notes || ''
        })
        .select()
        .single();
      if (paymentError) throw paymentError;

      // 2. Fetch the debt and all payments to recalculate status
      const { data: debt, error: debtError } = await supabase
        .from('debts')
        .select('*')
        .eq('id', debt_id)
        .eq('user_id', user.id)
        .single();
      if (debtError) throw debtError;

      const { data: payments, error: paymentsError } = await supabase
        .from('debt_payments')
        .select('amount')
        .eq('debt_id', debt_id)
        .eq('user_id', user.id);
      if (paymentsError) throw paymentsError;

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      let newStatus = 'pending';
      if (totalPaid >= debt.amount) {
        newStatus = 'paid';
      } else if (totalPaid > 0) {
        newStatus = 'partially_paid';
      }

      // 3. Update the debt status
      await supabase
        .from('debts')
        .update({ status: newStatus })
        .eq('id', debt_id)
        .eq('user_id', user.id);

      return res.status(201).json({ payment, totalPaid, newStatus });
    }

    if (req.method === 'DELETE') {
      const { id, debt_id } = req.body;
      if (!id || !debt_id) return res.status(400).json({ error: 'الحقول المطلوبة ناقصة' });

      // Delete payment
      const { error: deleteError } = await supabase
        .from('debt_payments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (deleteError) throw deleteError;

      // Recalculate debt status
      const { data: debt, error: debtError } = await supabase
        .from('debts')
        .select('*')
        .eq('id', debt_id)
        .eq('user_id', user.id)
        .single();
      if (debtError) throw debtError;

      const { data: payments, error: paymentsError } = await supabase
        .from('debt_payments')
        .select('amount')
        .eq('debt_id', debt_id)
        .eq('user_id', user.id);
      if (paymentsError) throw paymentsError;

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      let newStatus = 'pending';
      if (totalPaid >= debt.amount) {
        newStatus = 'paid';
      } else if (totalPaid > 0) {
        newStatus = 'partially_paid';
      }

      await supabase
        .from('debts')
        .update({ status: newStatus })
        .eq('id', debt_id)
        .eq('user_id', user.id);

      return res.status(200).json({ success: true, totalPaid, newStatus });
    }

    res.status(405).json({ error: 'الطريقة غير مسموح بها' });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message });
  }
}
