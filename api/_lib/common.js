import { createClient } from '@supabase/supabase-js';

let client;

// Lazy init: a missing env var returns a readable JSON error
// instead of crashing the whole function at import time.
export function getSupabase() {
  if (client) return client;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL ወይም SUPABASE_SERVICE_ROLE_KEY አልተዋቀረም');
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export function isAdminEmail(email) {
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  return !!email && list.includes(String(email).toLowerCase());
}

// Verifies a Supabase access token with Supabase Auth and checks the user is an allow-listed admin.
async function verifyAdmin(token) {
  const { data, error } = await getSupabase().auth.getUser(token);
  const user = data?.user;
  if (error || !user || !user.email_confirmed_at) return null;
  return isAdminEmail(user.email) ? user : null;
}

/**
 * Shared preamble for every endpoint: CORS, OPTIONS, method check, admin auth.
 * Returns true when the response has already been sent (caller must `return`).
 */
export async function guard(req, res, { methods, admin = false }) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', [...methods, 'OPTIONS'].join(', '));
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  if (!methods.includes(req.method)) {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
    return true;
  }
  if (admin) {
    if (!process.env.ADMIN_EMAILS) {
      res.status(500).json({ success: false, message: 'ADMIN_EMAILS አልተዋቀረም' });
      return true;
    }
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    let user = null;
    try { user = token ? await verifyAdmin(token) : null; } catch { user = null; }
    if (!user) {
      res.status(401).json({ success: false, message: 'ፈቃድ የለዎትም' });
      return true;
    }
  }
  return false;
}

// Accepts 09xxxxxxxx, 07xxxxxxxx, +2519xxxxxxxx, 2519xxxxxxxx → returns 09xxxxxxxx (or null)
export function normalizePhone(raw) {
  let p = String(raw ?? '').replace(/[\s\-()]/g, '');
  if (p.startsWith('+251')) p = '0' + p.slice(4);
  else if (p.startsWith('251')) p = '0' + p.slice(3);
  return /^0[79]\d{8}$/.test(p) ? p : null;
}
