import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method Not Allowed' });

  try {
    const { phone } = req.query; // ከዩአርኤል የሚመጣው ስልክ ቁጥር
    if (!phone) {
      return res.status(400).json({ success: false, message: 'የስልክ ቁጥር አልተገኘም' });
    }

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ success: true, tickets: data || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
