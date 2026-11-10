import { getSupabase, guard, normalizePhone } from './_lib/common.js';

export default async function handler(req, res) {
  if (guard(req, res, { methods: ['GET'] })) return;

  try {
    if (!req.query.phone) {
      return res.status(400).json({ success: false, message: 'የስልክ ቁጥር አልተገኘም' });
    }
    const phone = normalizePhone(req.query.phone);
    if (!phone) {
      return res.status(400).json({ success: false, message: 'የስልክ ቁጥር ትክክል አይደለም' });
    }

    const { data, error } = await getSupabase()
      .from('tickets')
      .select('ticketNumber, paymentMethod, status, isWinner, prizeWon, created_at')
      .eq('phone', phone)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ success: true, tickets: data || [] });
  } catch (error) {
    console.error('my-tickets:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
