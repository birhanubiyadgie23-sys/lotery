import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed' });

  try {
    const { fullName, phone, paymentMethod, transactionId, ticketNumber } = req.body;

    if (!fullName || !phone || !paymentMethod || !transactionId || !ticketNumber) {
      return res.status(400).json({ success: false, message: 'እባክዎ ሁሉንም መረጃዎች ይሙሉ' });
    }

    // መረጃውን ወደ Supabase tickets ቴብል መመዝገብ (status በነባሪ Pending ይሆናል)
    const { data, error } = await supabase
      .from('tickets')
      .insert([
        {
          fullName,
          phone,
          paymentMethod,
          transactionId,
          ticketNumber,
          status: 'Pending', // አድሚኑ እንዲያጸድቀው በPending ይገባል
          isWinner: false
        }
      ]);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'ቲኬቱ በተሳካ ሁኔታ ተገዝቷል! በአድሚን ማጽደቅ ይጠበቅብታል።' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
