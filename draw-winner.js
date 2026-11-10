import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed' });

  try {
    const { data: approvedTickets, error: fetchError } = await supabase
      .from('tickets')
      .select('*')
      .eq('status', 'Approved')
      .eq('isWinner', false);

    if (fetchError) throw fetchError;
    if (!approvedTickets || approvedTickets.length === 0) {
      return res.status(400).json({ success: false, message: 'ለዕጣ የሚሆን የጸደቀ ቲኬት የለም' });
    }

    const randomIndex = Math.floor(Math.random() * approvedTickets.length);
    const winner = approvedTickets[randomIndex];
    const prize = req.body.prize || '1,000,000 ብር';

    const { error: updateError } = await supabase
      .from('tickets')
      .update({ isWinner: true, prizeWon: prize })
      .eq('id', winner.id);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true, winner: { ...winner, isWinner: true, prizeWon: prize } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
