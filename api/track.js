// POST /api/track — one anonymous session event. Stored as an empty private blob whose pathname encodes the event.
const { put } = require('@vercel/blob');
const MODES = ['infinite', 'timerun', 'brick', 'pong', 'ice'], DEVICES = ['phone', 'tablet', 'desktop'];
const hits = new Map(); // in-memory per-instance rate limit; IP used only as transient key, never stored
function limited(ip) {
  const now = Date.now(), h = hits.get(ip) || { n: 0, t: now };
  if (now - h.t > 60000) { h.n = 0; h.t = now; }
  h.n++; hits.set(ip, h); if (hits.size > 5000) hits.clear();
  return h.n > 20;
}
const int = (v, max) => { v = Math.floor(Number(v)); return Number.isFinite(v) && v >= 0 ? Math.min(v, max) : 0; };
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  try {
    if (limited(String(req.headers['x-forwarded-for'] || '').split(',')[0])) return res.status(429).end();
    let raw = req.body; if (Buffer.isBuffer(raw)) raw = raw.toString();
    if (typeof raw === 'string') { if (raw.length > 500) return res.status(413).end(); raw = JSON.parse(raw); }
    const b = raw || {};
    if (!MODES.includes(b.mode) || !DEVICES.includes(b.device)) return res.status(400).end();
    const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})Z$/.exec(String(b.start || ''));
    const start = m ? `${m[1]}T${m[2]}${m[3]}Z` : new Date().toISOString().slice(0, 16).replace(':', '') + 'Z';
    const parts = [start, b.mode, b.device, 's' + int(b.score, 1e9), 'l' + int(b.level, 1e6), 't' + int(b.time, 1e6), Math.random().toString(36).slice(2, 8)];
    await put('events/' + parts.join('_'), '1', { access: 'private', addRandomSuffix: false, contentType: 'text/plain' });
    res.status(204).end();
  } catch (e) { res.status(400).end(); }
};
