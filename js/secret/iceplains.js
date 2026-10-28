// Secret game 3: ICE PLAINS RUN - blocky 2600-style snow-speeder homage. Original names/art.
// Fly the speeder, fire a tow cable at a giant walker, circle it twice to wrap its legs and trip it.
(function () {
  var S = window.SSSecret = window.SSSecret || {};
  S.ice = { title: 'Ice Plains Run', start: function (cv, done) {
    var c = cv.getContext('2d'), W = 160, H = 192, raf, ended = 0, keys = {}, f = 0;
    var p = { x: 80, y: 160, tx: 80, ty: 160 }, walkers = [], bolts = [], snow = [], shields = 3, trips = 0, t = 0, cable = null, spawnT = 0, BTN = { x: 2, y: 176, w: 44, h: 14 };
    for (var i = 0; i < 40; i++) snow.push({ x: Math.random() * W, y: Math.random() * H });
    function spawn() { walkers.push({ x: 16 + Math.random() * 128, y: -24, hp: 1, fall: 0, fire: 60 + Math.random() * 90, step: 0 }); }
    function fireCable() {
      if (cable) { cable = null; return; } var best = null, bd = 50;
      walkers.forEach(function (w) { if (w.fall) return; var d = Math.hypot(w.x - p.x, w.y + 10 - p.y); if (d < bd) { bd = d; best = w; } });
      if (best) cable = { w: best, a: Math.atan2(p.y - best.y - 10, p.x - best.x), sum: 0 };
    }
    function xy(e) { var b = cv.getBoundingClientRect(); return [(e.clientX - b.left) / b.width * W, (e.clientY - b.top) / b.height * H]; }
    function pd(e) { var q = xy(e); if (q[0] < BTN.x + BTN.w && q[1] > BTN.y - 4) fireCable(); else { p.tx = q[0]; p.ty = q[1]; } }
    function pm(e) { if (!e.buttons && e.pointerType === 'mouse') return; var q = xy(e); if (!(q[0] < BTN.x + BTN.w && q[1] > BTN.y - 4)) { p.tx = q[0]; p.ty = q[1]; } }
    function kd(e) { keys[e.key] = 1; if (e.key === ' ') fireCable(); } function ku(e) { keys[e.key] = 0; }
    cv.addEventListener('pointerdown', pd); cv.addEventListener('pointermove', pm); addEventListener('keydown', kd); addEventListener('keyup', ku);
    function bonus() { return Math.floor(t) * 25 + trips * 500; }
    function finish() { if (ended === 2) return; ended = 2; cancelAnimationFrame(raf); cv.removeEventListener('pointerdown', pd); cv.removeEventListener('pointermove', pm);
      removeEventListener('keydown', kd); removeEventListener('keyup', ku); done(bonus()); }
    function hurt() { shields--; if (shields <= 0) { ended = 1; setTimeout(finish, 2000); } }
    function step() {
      f++; t += 1 / 60;
      var kx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), ky = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
      if (kx || ky) { p.tx = p.x + kx * 20; p.ty = p.y + ky * 20; }
      var dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy), sp = 2.4; if (d > sp) { p.x += dx / d * sp; p.y += dy / d * sp; } else { p.x = p.tx; p.y = p.ty; }
      p.x = Math.max(4, Math.min(W - 4, p.x)); p.y = Math.max(16, Math.min(H - 6, p.y));
      snow.forEach(function (s) { s.y += 1.5; if (s.y > H) { s.y = 12; s.x = Math.random() * W; } });
      spawnT--; if (spawnT <= 0) { spawn(); spawnT = Math.max(70, 240 - t * 3); }
      var spd = Math.min(0.5, 0.18 + t * 0.003);
      walkers.forEach(function (w) {
        if (w.fall) { w.fall++; return; } w.y += spd; w.step++;
        if (--w.fire <= 0) { w.fire = Math.max(45, 120 - t); var a = Math.atan2(p.y - w.y - 6, p.x - w.x); bolts.push({ x: w.x, y: w.y + 6, vx: Math.cos(a) * 1.8, vy: Math.sin(a) * 1.8 }); }
        if (w.y > H) { w.gone = 1; hurt(); }
        if (Math.abs(p.x - w.x) < 9 && p.y > w.y - 6 && p.y < w.y + 22 && !w.hitT) { w.hitT = 30; hurt(); } if (w.hitT) w.hitT--;
      });
      walkers = walkers.filter(function (w) { return !w.gone && w.fall < 90; });
      bolts.forEach(function (b) { b.x += b.vx; b.y += b.vy; if (Math.abs(b.x - p.x) < 4 && Math.abs(b.y - p.y) < 4) { b.dead = 1; hurt(); } });
      bolts = bolts.filter(function (b) { return !b.dead && b.x > -4 && b.x < W + 4 && b.y > 0 && b.y < H; });
      if (cable) { var w = cable.w, a = Math.atan2(p.y - w.y - 10, p.x - w.x), da = a - cable.a;
        if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; cable.sum += da; cable.a = a;
        if (w.fall || w.gone || Math.hypot(p.x - w.x, p.y - w.y - 10) > 75) cable = null;
        else if (Math.abs(cable.sum) >= 4 * Math.PI) { w.fall = 1; trips++; cable = null; } }
    }
    function rect(x, y, w, h, col) { c.fillStyle = col; c.fillRect(x | 0, y | 0, w, h); }
    function draw() {
      rect(0, 0, W, H, '#b4c8e0'); snow.forEach(function (s) { rect(s.x, s.y, 1, 1, '#fff'); });
      walkers.forEach(function (w) { var col = w.fall ? '#6c6c6c' : '#8a8a96', x = w.x - 8, y = w.y;
        if (w.fall) { rect(x - 4, y + 12, 24, 8, col); rect(x + 18, y + 10, 6, 5, col); return; }
        var lg = (w.step >> 4) & 1; rect(x, y, 16, 9, col); rect(x + 4, y + 9, 8, 3, '#505060'); rect(x + 5, y - 4, 6, 4, col);
        rect(x + 1, y + 9, 2, 12 - lg * 2, col); rect(x + 13, y + 9, 2, 12 - (1 - lg) * 2, col); rect(x + 5, y + 12, 2, 9 - (1 - lg) * 2, col); rect(x + 9, y + 12, 2, 9 - lg * 2, col); });
      if (cable) { c.strokeStyle = '#3a2a10'; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(cable.w.x, cable.w.y + 14); c.stroke();
        rect(cable.w.x - 8, cable.w.y + 13, Math.min(16, Math.abs(cable.sum) / (4 * Math.PI) * 16), 2, '#ff0'); }
      bolts.forEach(function (b) { rect(b.x - 1, b.y - 1, 2, 3, '#ff3020'); });
      if (!(ended && f & 4)) { rect(p.x - 4, p.y - 2, 8, 4, '#e86a10'); rect(p.x - 1, p.y - 5, 2, 3, '#e86a10'); rect(p.x - 5, p.y + 2, 2, 2, '#fff'); rect(p.x + 3, p.y + 2, 2, 2, '#fff'); }
      rect(0, 0, W, 11, '#202040'); c.font = '8px monospace'; c.fillStyle = '#fff';
      c.fillText('ICE PLAINS ' + Math.floor(t) + 's  TRIP ' + trips + '  ♦' + shields, 2, 8);
      rect(BTN.x, BTN.y, BTN.w, BTN.h, cable ? '#d8d800' : '#204060'); c.fillStyle = cable ? '#000' : '#fff'; c.fillText(cable ? 'RELEASE' : 'CABLE', BTN.x + 6, BTN.y + 10);
      if (ended) { c.fillStyle = '#000'; c.fillText('BONUS ' + bonus(), 52, 96); }
    }
    (function loop() { if (ended < 2) { if (!ended) step(); draw(); raf = requestAnimationFrame(loop); } })();
    return finish;
  } };
})();
