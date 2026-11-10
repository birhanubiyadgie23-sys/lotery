import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

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

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Shared preamble for every endpoint: CORS, OPTIONS, method check, admin auth.
 * Returns true when the response has already been sent (caller must `return`).
 */
export function guard(req, res, { methods, admin = false }) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', [...methods, 'OPTIONS'].join(', '));
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
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
    const expected = process.env.ADMIN_KEY;
    if (!expected) {
      res.status(500).json({ success: false, message: 'ADMIN_KEY አልተዋቀረም' });
      return true;
    }
    const given = req.headers['x-admin-key'];
    if (!given || !safeEqual(given, expected)) {
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
