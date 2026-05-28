import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'غير مصرح: لم يتم توفير رمز التحقق' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'غير مصرح: رمز التحقق غير صالح' });

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('debts')
        .select('*, debt_payments(*)')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { type, person_name, amount, due_date, description, status } = req.body;
      if (!type || !person_name || !amount) {
        return res.status(400).json({ error: 'الحقول المطلوبة ناقصة' });
      }
      const { data, error } = await supabase
        .from('debts')
        .insert({
          user_id: user.id,
          type,
          person_name,
          amount: parseFloat(amount),
          due_date: due_date || null,
          description: description || '',
          status: status || 'pending'
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, type, person_name, amount, due_date, description, status } = req.body;
      if (!id) return res.status(400).json({ error: 'معرف الدين مفقود' });
      const { data, error } = await supabase
        .from('debts')
        .update({
          type,
          person_name,
          amount: parseFloat(amount),
          due_date: due_date || null,
          description: description || '',
          status: status || 'pending'
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'معرف الدين مفقود' });

      // Delete payments first
      await supabase.from('debt_payments').delete().eq('debt_id', id).eq('user_id', user.id);

      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'الطريقة غير مسموح بها' });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message });
  }
}
