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
      const { search, type, category } = req.query;
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('id', { ascending: false });

      if (type) query = query.eq('type', type);
      if (category) query = query.eq('category', category);
      
      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data;
      if (search) {
        const s = search.toLowerCase();
        filteredData = data.filter(t => 
          (t.description && t.description.toLowerCase().includes(s)) || 
          (t.category && t.category.toLowerCase().includes(s))
        );
      }

      return res.status(200).json(filteredData);
    }

    if (req.method === 'POST') {
      const { type, amount, category, date, description } = req.body;
      if (!type || !amount || !category || !date) {
        return res.status(400).json({ error: 'الحقول المطلوبة ناقصة' });
      }
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type,
          amount: parseFloat(amount),
          category,
          date,
          description: description || ''
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, type, amount, category, date, description } = req.body;
      if (!id) return res.status(400).json({ error: 'معرف العملية مفقود' });
      const { data, error } = await supabase
        .from('transactions')
        .update({
          type,
          amount: parseFloat(amount),
          category,
          date,
          description: description || ''
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
      if (!id) return res.status(400).json({ error: 'معرف العملية مفقود' });
      const { error } = await supabase
        .from('transactions')
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
