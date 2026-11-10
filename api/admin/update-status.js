import { getSupabase, guard } from '../_lib/common.js';

const ALLOWED = ['Pending', 'Approved', 'Rejected'];

export default async function handler(req, res) {
  if (await guard(req, res, { methods: ['POST'], admin: true })) return;

  try {
    const { id, status } = req.body || {};
    if (id === undefined || id === null || id === '' || !status) {
      return res.status(400).json({ success: false, message: 'መረጃው ጎድሏል' });
    }
    if (!ALLOWED.includes(status)) {
      return res.status(400).json({ success: false, message: 'ሁኔታው ትክክል አይደለም' });
    }

    const { data, error } = await getSupabase()
      .from('tickets')
      .update({ status })
      .eq('id', id)
      .select('id');

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: 'ቲኬቱ አልተገኘም' });
    }
    return res.status(200).json({ success: true, message: 'የቲኬቱ ሁኔታ ተቀይሯል' });
  } catch (error) {
    console.error('admin/update-status:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
