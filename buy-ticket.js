import { randomInt } from 'node:crypto';
import { getSupabase, guard, normalizePhone } from './_lib/common.js';

const PAYMENT_METHODS = ['Telebirr', 'CBE'];

export default async function handler(req, res) {
  if (guard(req, res, { methods: ['POST'] })) return;

  try {
    const body = req.body || {};
    const fullName = String(body.fullName ?? '').trim();
    const paymentMethod = String(body.paymentMethod ?? '').trim();
    const transactionId = String(body.transactionId ?? '').trim();

    if (!fullName || !body.phone || !transactionId) {
      return res.status(400).json({ success: false, message: 'እባክዎን ሁሉንም መረጃዎች ይሙሉ' });
    }
    const phone = normalizePhone(body.phone);
    if (!phone) {
      return res.status(400).json({ success: false, message: 'የስልክ ቁጥር ትክክል አይደለም (ለምሳሌ 09xxxxxxxx)' });
    }
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'የክፍያ አማራጭ ትክክል አይደለም' });
    }
    if (fullName.length > 100 || transactionId.length > 64) {
      return res.status(400).json({ success: false, message: 'የገባው መረጃ በጣም ረጅም ነው' });
    }

    const supabase = getSupabase();

    // Ticket numbers are generated ONLY here (server). Retry on the rare collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      const ticketNumber = 'ETH-' + randomInt(100000, 1000000);

      const { data, error } = await supabase
        .from('tickets')
        .insert([{
          fullName, phone, paymentMethod, transactionId, ticketNumber,
          status: 'Pending', isWinner: false, prizeWon: null,
        }])
        .select('id, fullName, phone, paymentMethod, ticketNumber, status, created_at')
        .single();

      if (!error) return res.status(200).json({ success: true, ticket: data });

      if (error.code === '23505') {
        const info = `${error.message} ${error.details ?? ''}`.toLowerCase();
        if (info.includes('ticketnumber')) continue; // ticket number collision → new number
        return res.status(400).json({ success: false, message: 'ይህ የትራንዛክሽን ቁጥር ቀድሞ ጥቅም ላይ ውሏል!' });
      }
      throw error;
    }
    return res.status(503).json({ success: false, message: 'የቲኬት ቁጥር ማመንጨት አልተቻለም፣ እንደገና ይሞክሩ' });
  } catch (error) {
    console.error('buy-ticket:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
