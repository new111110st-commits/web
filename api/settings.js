import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'غير مصرح: لم يتم توفير رمز التحقق' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'غير مصرح: رمز التحقق غير صالح' });

    if (req.method === 'GET') {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;

      if (!data) {
        const defaultProfile = {
          user_id: user.id,
          currency: 'SAR',
          theme: 'light',
          monthly_budget: 5000,
          full_name: user.email.split('@')[0]
        };
        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert(defaultProfile)
          .select()
          .single();
        if (insertError) throw insertError;
        data = inserted;
      }

      return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
      const { currency, theme, monthly_budget, full_name } = req.body;
      const { data, error } = await supabase
        .from('profiles')
        .update({
          currency,
          theme,
          monthly_budget: parseFloat(monthly_budget) || 0,
          full_name
        })
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'الطريقة غير مسموح بها' });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message });
  }
}
