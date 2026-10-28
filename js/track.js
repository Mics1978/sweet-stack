// Anonymous play tracking: one event per session, no cookies/IDs/storage. Never throws.
(function () {
  function device() {
    try { var coarse = matchMedia('(pointer:coarse)').matches, m = Math.min(screen.width, screen.height);
      return !coarse ? 'desktop' : m < 600 ? 'phone' : 'tablet'; } catch (e) { return 'desktop'; }
  }
  function iso(d) { return new Date(Math.floor(d / 60000) * 60000).toISOString().slice(0, 16) + 'Z'; }
  var open = [];
  function send(s) {
    try {
      if (!s || s.sent) return; s.sent = true; open.splice(open.indexOf(s), 1);
      var body = JSON.stringify({ start: iso(s.t0), mode: s.mode, score: Math.max(0, Math.floor(s.score || 0)), level: s.level || 0, time: Math.round(s.time || 0), device: device() });
      if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'text/plain' }));
      else fetch('/api/track', { method: 'POST', body: body, keepalive: true, credentials: 'omit' }).catch(function () {});
    } catch (e) {}
  }
  window.SSTrack = {
    begin: function (mode) { var s = { mode: mode, t0: Date.now(), sent: false }; open.push(s); return s; },
    end: function (s, data) { try { if (s && !s.sent) { for (var k in data) s[k] = data[k]; send(s); } } catch (e) {} },
    update: function (s, data) { try { if (s) for (var k in data) s[k] = data[k]; } catch (e) {} }
  };
  addEventListener('pagehide', function () { open.slice().forEach(send); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') open.slice().forEach(send); });
})();
