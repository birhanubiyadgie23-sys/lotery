import { getSupabase, guard } from '../_lib/common.js';

export default async function handler(req, res) {
  if (guard(req, res, { methods: ['GET'], admin: true })) return;

  try {
    const { data, error } = await getSupabase()
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;
    return res.status(200).json({ success: true, tickets: data || [] });
  } catch (error) {
    console.error('admin/tickets:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
