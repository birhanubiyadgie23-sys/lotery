import { getSupabase, guard } from '../_lib/common.js';

export default async function handler(req, res) {
  if (await guard(req, res, { methods: ['POST'], admin: true })) return;

  try {
    const prizeName = String(req.body?.prizeName ?? '').trim();
    const amount = String(req.body?.amount ?? '').trim();
    const description = String(req.body?.description ?? '').trim() || null;

    if (!prizeName || !amount) {
      return res.status(400).json({ success: false, message: 'የሽልማቱን ስም እና መጠን ያስገቡ' });
    }
    if (prizeName.length > 100 || amount.length > 100 || (description && description.length > 300)) {
      return res.status(400).json({ success: false, message: 'የገባው መረጃ በጣም ረጅም ነው' });
    }

    const { error } = await getSupabase()
      .from('prizes')
      .insert([{ prizeName, amount, description }]);

    if (error) throw error;
    return res.status(200).json({ success: true, message: 'ሽልማቱ በተሳካ ሁኔታ ተመዝግቧል' });
  } catch (error) {
    console.error('admin/add-prize:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
