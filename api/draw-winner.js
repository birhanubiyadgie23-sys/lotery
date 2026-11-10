import { randomInt } from 'node:crypto';
import { getSupabase, guard } from './_lib/common.js';

/**
 * One call = ONE prize drawn.
 * - Only prizes registered in the `prizes` table can be drawn (each exactly once).
 * - Body: { prizeId } to draw a specific prize; omit it to draw the next one in registration order.
 */
export default async function handler(req, res) {
  if (await guard(req, res, { methods: ['POST'], admin: true })) return;

  try {
    const supabase = getSupabase();
    const wantedId = req.body?.prizeId;

    // 1) Registered prizes that still have no winner (registration order = rank order)
    const { count: totalPrizes, error: totalError } = await supabase
      .from('prizes').select('id', { count: 'exact', head: true });
    if (totalError) throw totalError;
    if (!totalPrizes) {
      return res.status(400).json({ success: false, message: 'መጀመሪያ በአድሚን ፓነል ሽልማቶችን ያስመዝግቡ' });
    }

    const { data: open, error: openError } = await supabase
      .from('prizes')
      .select('*')
      .is('winnerTicketId', null)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });
    if (openError) throw openError;

    if (!open || open.length === 0) {
      return res.status(400).json({
        success: false,
        message: `ሁሉም ${totalPrizes} ሽልማቶች ዕጣ ወጥቶባቸዋል፤ ተጨማሪ ዕጣ ማውጣት አይቻልም`,
      });
    }

    let prize = open[0];
    if (wantedId !== undefined && wantedId !== null && wantedId !== '') {
      prize = open.find(p => String(p.id) === String(wantedId));
      if (!prize) {
        return res.status(409).json({ success: false, message: 'ይህ ሽልማት ቀድሞ ዕጣ ወጥቶበታል ወይም አልተገኘም' });
      }
    }
    const prizeLabel = `${prize.prizeName} — ${prize.amount}`.slice(0, 200);

    // 2) Pick a random approved ticket that has not won yet
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

      // 3) Claim the ticket (succeeds only if nobody else drew it meanwhile)
      const { data: updated, error: updateError } = await supabase
        .from('tickets')
        .update({ isWinner: true, prizeWon: prizeLabel })
        .eq('id', winner.id)
        .eq('isWinner', false)
        .select();
      if (updateError) throw updateError;
      if (!updated || updated.length !== 1) continue;

      // 4) Claim the prize (succeeds only if it still has no winner)
      const { data: claimed, error: claimError } = await supabase
        .from('prizes')
        .update({ winnerTicketId: String(winner.id), drawnAt: new Date().toISOString() })
        .eq('id', prize.id)
        .is('winnerTicketId', null)
        .select();

      if (claimError || !claimed || claimed.length !== 1) {
        // Someone else drew this prize first → undo the ticket claim
        await supabase.from('tickets').update({ isWinner: false, prizeWon: null }).eq('id', winner.id);
        if (claimError) throw claimError;
        return res.status(409).json({ success: false, message: 'ይህ ሽልማት በሌላ ጥሪ ዕጣ ወጥቶበታል' });
      }

      return res.status(200).json({
        success: true,
        winner: updated[0],
        prize: claimed[0],
        remaining: open.length - 1,
      });
    }
    return res.status(409).json({ success: false, message: 'ዕጣው አልተሳካም፣ እንደገና ይሞክሩ' });
  } catch (error) {
    console.error('draw-winner:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
