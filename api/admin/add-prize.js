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
    const { prizeName, amount, description } = req.body;
    
    if (!prizeName || !amount) {
      return res.status(400).json({ success: false, message: 'የሽልማቱን ስም እና መጠን ያስገቡ' });
    }

    const { error } = await supabase
      .from('prizes')
      .insert([{ prizeName, amount, description }]);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'ሽልማቱ በተሳካ ሁኔታ ተመዝግቧል' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}