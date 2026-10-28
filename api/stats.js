// GET /api/stats?token=... (or /stats?token=...) — aggregated stats; 401 without STATS_TOKEN. &format=json for JSON.
const { list } = require('@vercel/blob');
const crypto = require('crypto');
function ok(t) { const a = Buffer.from(String(t || '')), b = Buffer.from(process.env.STATS_TOKEN || ''); return b.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b); }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Robots-Tag', 'noindex');
  const token = req.query.token || String(req.headers.authorization || '').replace(/^Bearer /, '');
  if (!ok(token)) return res.status(401).send('Unauthorized');
  const ev = []; let cursor, pages = 0;
  do { const r = await list({ prefix: 'events/', limit: 1000, cursor }); cursor = r.hasMore ? r.cursor : null;
    for (const b of r.blobs) { const p = b.pathname.slice(7).split('_'); if (p.length < 7) continue;
      const d = p[0]; ev.push({ start: `${d.slice(0, 10)}T${d.slice(11, 13)}:${d.slice(13, 15)}Z`, day: d.slice(0, 10), mode: p[1], device: p[2], score: +p[3].slice(1), level: +p[4].slice(1), time: +p[5].slice(1) }); }
  } while (cursor && ++pages < 50);
  const byMode = {}, byDevice = {}, perDay = {};
  for (const e of ev) {
    const m = byMode[e.mode] = byMode[e.mode] || { sessions: 0, total: 0, top: 0 }; m.sessions++; m.total += e.score; m.top = Math.max(m.top, e.score);
    byDevice[e.device] = (byDevice[e.device] || 0) + 1; perDay[e.day] = (perDay[e.day] || 0) + 1;
  }
  for (const k in byMode) { byMode[k].avg = Math.round(byMode[k].total / byMode[k].sessions); delete byMode[k].total; }
  const recent = ev.sort((a, b) => b.start.localeCompare(a.start)).slice(0, 50);
  const out = { totalSessions: ev.length, byMode, byDevice, sessionsPerDay: perDay, recent };
  if (req.query.format === 'json') return res.status(200).json(out);
  const tbl = (h, rows) => `<table><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(x => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</table>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!doctype html><meta name=viewport content="width=device-width"><title>Sweet Stack stats</title><style>body{font:14px system-ui;margin:16px;background:#fff6fb}table{border-collapse:collapse;margin:8px 0 20px}td,th{border:1px solid #e3c;padding:4px 8px}</style>
<h1>Sweet Stack stats</h1><p>Total sessions: <b>${ev.length}</b></p>
<h2>By mode</h2>${tbl(['Mode', 'Sessions', 'Top score', 'Avg score'], Object.entries(byMode).map(([k, v]) => [k, v.sessions, v.top, v.avg]))}
<h2>By device</h2>${tbl(['Device', 'Sessions'], Object.entries(byDevice))}
<h2>Sessions per day</h2>${tbl(['Day (UTC)', 'Sessions'], Object.entries(perDay).sort().reverse())}
<h2>Recent sessions</h2>${tbl(['Start (UTC)', 'Mode', 'Device', 'Score', 'Level', 'Time (s)'], recent.map(e => [e.start, e.mode, e.device, e.score, e.level, e.mode === 'timerun' ? e.time : '']))}`);
};
