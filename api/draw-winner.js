import { randomInt } from 'node:crypto';
import { getSupabase, guard } from './_lib/common.js';

export default async function handler(req, res) {
  if (await guard(req, res, { methods: ['POST'], admin: true })) return;

  try {
    const supabase = getSupabase();
    const prize = String(req.body?.prize ?? '').trim().slice(0, 200) || '1,000,000 ብር';

    for (let attempt = 0; attempt < 3; attempt++) {
      // Count first, then fetch ONE random row → fair even above Supabase's 1000-row cap.
      const { count, error: countError } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'Approved')
        .eq('isWinner', false);
      if (countError) throw countError;

      if (!count) {
        return res.status(400).json({ success: false, message: 'ለዕጣ የሚሆን የጸደቀ ቲኬት የለም' });
      }

      const offset = randomInt(count);
      const { data: rows, error: fetchError } = await supabase
        .from('tickets')
        .select('*')
        .eq('status', 'Approved')
        .eq('isWinner', false)
        .order('id', { ascending: true })
        .range(offset, offset);
      if (fetchError) throw fetchError;
      const winner = rows?.[0];
      if (!winner) continue;

      // Guarded update: succeeds only if nobody else drew this ticket meanwhile.
      const { data: updated, error: updateError } = await supabase
        .from('tickets')
        .update({ isWinner: true, prizeWon: prize })
        .eq('id', winner.id)
        .eq('isWinner', false)
        .select();
      if (updateError) throw updateError;

      if (updated && updated.length === 1) {
        return res.status(200).json({ success: true, winner: updated[0] });
      }
    }
    return res.status(409).json({ success: false, message: 'ዕጣው አልተሳካም፣ እንደገና ይሞክሩ' });
  } catch (error) {
    console.error('draw-winner:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
