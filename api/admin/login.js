import { createClient } from '@supabase/supabase-js';
import { guard, isAdminEmail } from '../_lib/common.js';

const FAIL = { success: false, message: 'ኢሜይል ወይም ይለፍ ቃል ትክክል አይደለም' };

export default async function handler(req, res) {
  if (await guard(req, res, { methods: ['POST'] })) return;

  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'ኢሜይል እና ይለፍ ቃል ያስገቡ' });
    }

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const missing = [
      !url && 'SUPABASE_URL',
      !anon && 'SUPABASE_ANON_KEY',
      !process.env.ADMIN_EMAILS && 'ADMIN_EMAILS',
    ].filter(Boolean);
    if (missing.length) {
      throw new Error('እነዚህ ተለዋዋጮች በ Vercel ላይ አልተገኙም: ' + missing.join(', '));
    }

    // Separate anon client just for sign-in; it never touches the service-role client.
    const authClient = createClient(url, anon, { auth: { persistSession: false } });
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });

    // Same message for wrong password and for "valid user but not an admin" (no information leak)
    if (error || !data?.session || !isAdminEmail(data.user?.email)) {
      return res.status(401).json(FAIL);
    }
    return res.status(200).json({ success: true, token: data.session.access_token });
  } catch (error) {
    console.error('admin/login:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
