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
    const { fullName, phone, paymentMethod, transactionId } = req.body;
    if (!fullName || !phone || !transactionId) {
      return res.status(400).json({ success: false, message: 'እባክዎን ሁሉንም መረጃዎች ይሙሉ' });
    }

    const ticketNumber = 'ETH-' + Math.floor(100000 + Math.random() * 900000);
    
    const { data, error } = await supabase
      .from('tickets')
      .insert([{ fullName, phone, paymentMethod, transactionId, ticketNumber, status: 'Pending', isWinner: false, prizeWon: null }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ success: false, message: 'ይህ የትራንዛክሽን ቁጥር ቀድሞ ጥቅም ላይ ውሏል!' });
      }
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true, ticket: data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}