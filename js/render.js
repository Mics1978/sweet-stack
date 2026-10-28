// Candy sprites + board rendering (Canvas, procedural, glossy rounded shapes).
(function (root) {
  'use strict';
  var COLORS = ['#ff3b5c', '#ff8a1f', '#ffd21f', '#33d46a', '#2fa8ff', '#a35bff', '#ff5fc8'];
  var NAMES = ['Cherry Bean', 'Orange Bear', 'Lemon Pop', 'Lime Bean', 'Berry Bear', 'Grape Pop', 'Bubblegum Bean'];
  var SHAPES = ['bean', 'bear', 'pop', 'bean', 'bear', 'pop', 'bean'];
  var cache = {};
  function shade(hex, f) { var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function m(x) { return Math.max(0, Math.min(255, Math.round(f > 0 ? x + (255 - x) * f : x * (1 + f)))); }
    return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')'; }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function gloss(c, s, base) { var g = c.createRadialGradient(s * 0.35, s * 0.3, s * 0.05, s * 0.5, s * 0.55, s * 0.6); g.addColorStop(0, shade(base, 0.55)); g.addColorStop(0.45, base); g.addColorStop(1, shade(base, -0.35)); return g; }
  function sprite(v, s) {
    var key = v + ':' + s; if (cache[key]) return cache[key];
    var cv = document.createElement('canvas'); cv.width = cv.height = s; var c = cv.getContext('2d'), base = COLORS[(v - 1) % 7], shape = SHAPES[(v - 1) % 7];
    c.shadowColor = 'rgba(0,0,0,0.25)'; c.shadowBlur = s * 0.08; c.shadowOffsetY = s * 0.04; c.fillStyle = gloss(c, s, base);
    if (shape === 'bean') { c.beginPath(); c.ellipse(s / 2, s / 2, s * 0.44, s * 0.32, -0.35, 0, 7); c.fill(); }
    else if (shape === 'bear') {
      c.beginPath(); c.arc(s * 0.28, s * 0.2, s * 0.12, 0, 7); c.arc(s * 0.72, s * 0.2, s * 0.12, 0, 7); c.fill();
      c.beginPath(); c.arc(s / 2, s * 0.36, s * 0.24, 0, 7); c.fill();
      rr(c, s * 0.2, s * 0.42, s * 0.6, s * 0.5, s * 0.22); c.fill();
      c.shadowColor = 'transparent'; c.fillStyle = shade(base, -0.5); c.beginPath(); c.arc(s * 0.42, s * 0.33, s * 0.035, 0, 7); c.arc(s * 0.58, s * 0.33, s * 0.035, 0, 7); c.fill();
    } else {
      c.fillStyle = '#f4efe6'; c.fillRect(s * 0.46, s * 0.6, s * 0.08, s * 0.38);
      c.fillStyle = gloss(c, s, base); c.beginPath(); c.arc(s / 2, s * 0.4, s * 0.36, 0, 7); c.fill();
      c.shadowColor = 'transparent'; c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = s * 0.06; c.beginPath();
      for (var a = 0; a < 9; a += 0.2) { var rad = s * 0.03 * a; c.lineTo(s / 2 + Math.cos(a * 2) * rad, s * 0.4 + Math.sin(a * 2) * rad); } c.stroke();
    }
    c.shadowColor = 'transparent'; c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.ellipse(s * 0.36, s * 0.27, s * 0.11, s * 0.06, -0.6, 0, 7); c.fill();
    cache[key] = cv; return cv;
  }
  function Renderer(canvas) { this.cv = canvas; this.ctx = canvas.getContext('2d'); this.sparks = []; }
  Renderer.prototype.resize = function (w, h) {
    var dpr = Math.min(2, root.devicePixelRatio || 1), C = SSCore;
    this.cell = Math.floor(Math.min(w / C.COLS, h / C.ROWS)); this.w = this.cell * C.COLS; this.h = this.cell * C.ROWS;
    this.cv.style.width = this.w + 'px'; this.cv.style.height = this.h + 'px';
    this.cv.width = this.w * dpr; this.cv.height = this.h * dpr; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.dpr = dpr; cache = {};
  };
  Renderer.prototype.burst = function (cells) {
    var s = this.cell;
    for (var i = 0; i < cells.length; i++) for (var k = 0; k < 7; k++) { var a = Math.random() * 6.28, sp = 40 + Math.random() * 160;
      this.sparks.push({ x: (cells[i].c + 0.5) * s, y: (cells[i].r + 0.5) * s, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: 0.5 + Math.random() * 0.4, col: COLORS[(cells[i].v - 1) % 7] }); }
    if (this.sparks.length > 600) this.sparks.splice(0, this.sparks.length - 600);
  };
  Renderer.prototype.draw = function (g, dt) {
    var c = this.ctx, s = this.cell, C = SSCore, spr = Math.round(s * this.dpr);
    var bg = c.createLinearGradient(0, 0, 0, this.h); bg.addColorStop(0, '#3b1d5e'); bg.addColorStop(1, '#ff8fc8'); c.fillStyle = bg; c.fillRect(0, 0, this.w, this.h);
    c.fillStyle = 'rgba(255,255,255,0.06)'; for (var x = 0; x < C.COLS; x += 2) c.fillRect(x * s, 0, s, this.h);
    var clearing = {}, ct = 0; if (g.clearing) { ct = g.clearing.t / C.Game.CLEAR_TIME; g.clearing.cells.forEach(function (o) { clearing[o.r * C.COLS + o.c] = 1; }); }
    for (var r = 0; r < C.ROWS; r++) for (var col = 0; col < C.COLS; col++) { var v = g.grid[r][col]; if (!v) continue;
      if (clearing[r * C.COLS + col]) { var k = 1 + ct * 0.4; c.globalAlpha = 1 - ct; c.drawImage(sprite(v, spr), col * s + s * (1 - k) / 2, r * s + s * (1 - k) / 2, s * k, s * k); c.globalAlpha = 1;
        c.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - ct)) + ')'; c.beginPath(); c.arc((col + 0.5) * s, (r + 0.5) * s, s * 0.5 * ct + 2, 0, 7); c.fill(); }
      else c.drawImage(sprite(v, spr), col * s, r * s, s, s); }
    if (g.piece) { var p = g.piece, gy = p.y; while (g.fits(p.x, gy + 1)) gy++;
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(p.x * s, Math.max(0, gy) * s, s, (gy + 3 - Math.max(0, gy)) * s);
      for (var i = 0; i < 3; i++) if (p.y + i >= 0) c.drawImage(sprite(p.cells[i], spr), p.x * s, (p.y + i) * s, s, s); }
    for (var j = this.sparks.length - 1; j >= 0; j--) { var q = this.sparks[j]; q.t += dt; if (q.t > q.life) { this.sparks.splice(j, 1); continue; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 200 * dt; var a2 = 1 - q.t / q.life, z = 2 + 3 * a2;
      c.globalAlpha = a2; c.fillStyle = j % 3 ? q.col : '#fff'; c.fillRect(q.x - z / 2, q.y - 0.5, z, 1.5); c.fillRect(q.x - 0.75, q.y - z / 2, 1.5, z); }
    c.globalAlpha = 1;
  };
  root.SSRender = { Renderer: Renderer, sprite: sprite, COLORS: COLORS, NAMES: NAMES };
})(window);
