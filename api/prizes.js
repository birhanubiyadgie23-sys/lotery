import { getSupabase, guard } from './_lib/common.js';

// "አበበ ከበደ" -> "አበበ ከ."  (public pages never show full names)
function maskName(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  return parts[1] ? `${parts[0]} ${Array.from(parts[1])[0]}.` : parts[0];
}

export default async function handler(req, res) {
  if (await guard(req, res, { methods: ['GET'] })) return;

  try {
    const supabase = getSupabase();

    // Registration order = rank order (1st registered = 1st prize)
    const { data: prizes, error } = await supabase
      .from('prizes')
      .select('id, prizeName, amount, description, created_at, winnerTicketId, drawnAt')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });
    if (error) throw error;

    const ids = (prizes || []).map(p => p.winnerTicketId).filter(v => v !== null && v !== undefined);
    let byId = new Map();
    if (ids.length) {
      const { data: tickets, error: ticketError } = await supabase
        .from('tickets')
        .select('id, ticketNumber, fullName')
        .in('id', ids);
      if (ticketError) throw ticketError;
      byId = new Map((tickets || []).map(t => [String(t.id), t]));
    }

    const result = (prizes || []).map(({ winnerTicketId, ...p }) => {
      const t = byId.get(String(winnerTicketId));
      return {
        ...p,
        isDrawn: winnerTicketId !== null && winnerTicketId !== undefined,
        winnerTicketNumber: t?.ticketNumber ?? null,
        winnerName: t ? maskName(t.fullName) : null,
      };
    });

    return res.status(200).json({ success: true, prizes: result });
  } catch (error) {
    console.error('prizes:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
