import { getSupabase, guard } from './_lib/common.js';

export default async function handler(req, res) {
  if (guard(req, res, { methods: ['GET'] })) return;

  try {
    const { data, error } = await getSupabase()
      .from('prizes')
      .select('id, prizeName, amount, description, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ success: true, prizes: data || [] });
  } catch (error) {
    console.error('prizes:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
