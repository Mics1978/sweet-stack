// Candy sprites + board rendering (Canvas, procedural, flat cartoon shapes with ink outlines).
(function (root) {
  'use strict';
  // GMOB palette (gmobai.in): flat cartoon fills with thick ink outlines.
  var COLORS = ['#FF3C00', '#f59e0b', '#a3e635', '#00e5a0', '#3b9eff', '#a855f7', '#ec4899'];
  var NAMES = ['Blaze Bean', 'Amber Bear', 'Lime Pop', 'Mint Bean', 'Sky Bear', 'Grape Pop', 'Bubblegum Bean'];
  var SHAPES = ['bean', 'bear', 'pop', 'bean', 'bear', 'pop', 'bean'];
  var INK = '#111', cache = {};
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function sprite(v, s) {
    var key = v + ':' + s; if (cache[key]) return cache[key];
    var cv = document.createElement('canvas'); cv.width = cv.height = s; var c = cv.getContext('2d'), base = COLORS[(v - 1) % 7], shape = SHAPES[(v - 1) % 7];
    var lw = Math.max(2, s * 0.075); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round'; c.fillStyle = base;
    function ink() { c.stroke(); c.fill(); }
    c.save(); c.translate(s * 0.03, s * 0.03); c.globalAlpha = 1;
    if (shape === 'bean') { c.beginPath(); c.ellipse(s / 2, s / 2, s * 0.42, s * 0.31, -0.35, 0, 7); c.lineWidth = lw * 2; ink(); }
    else if (shape === 'bear') {
      function head() { c.beginPath(); c.arc(s * 0.24, s * 0.18, s * 0.13, 0, 7); c.moveTo(s * 0.89, s * 0.18); c.arc(s * 0.76, s * 0.18, s * 0.13, 0, 7); c.moveTo(s * 0.8, s * 0.38); c.arc(s / 2, s * 0.38, s * 0.3, 0, 7); }
      function body() { rr(c, s * 0.13, s * 0.48, s * 0.74, s * 0.44, s * 0.18); }
      c.lineWidth = lw * 2; body(); c.stroke(); head(); c.stroke(); body(); c.fill(); head(); c.fill();
      c.fillStyle = INK; c.beginPath(); c.arc(s * 0.39, s * 0.34, s * 0.05, 0, 7); c.arc(s * 0.61, s * 0.34, s * 0.05, 0, 7); c.fill();
      c.lineWidth = lw * 0.8; c.beginPath(); c.arc(s / 2, s * 0.42, s * 0.08, 0.3, 2.8); c.stroke();
    } else {
      c.fillStyle = '#fff'; c.fillRect(s * 0.45, s * 0.6, s * 0.1, s * 0.36); c.strokeRect(s * 0.45, s * 0.6, s * 0.1, s * 0.36);
      c.fillStyle = base; c.beginPath(); c.arc(s / 2, s * 0.4, s * 0.35, 0, 7); c.lineWidth = lw * 2; ink();
      c.strokeStyle = '#fff'; c.lineWidth = s * 0.07; c.lineCap = 'round'; c.beginPath();
      for (var a = 0; a < 9; a += 0.2) { var rad = s * 0.03 * a; c.lineTo(s / 2 + Math.cos(a * 2) * rad, s * 0.4 + Math.sin(a * 2) * rad); } c.stroke();
    }
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(s * 0.34, s * 0.27, s * 0.09, s * 0.05, -0.6, 0, 7); c.fill();
    c.restore(); cache[key] = cv; return cv;
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
    c.fillStyle = '#0e1535'; c.fillRect(0, 0, this.w, this.h);
    c.fillStyle = '#16204a'; for (var x = 0; x < C.COLS; x += 2) c.fillRect(x * s, 0, s, this.h);
    var clearing = {}, ct = 0; if (g.clearing) { ct = g.clearing.t / C.Game.CLEAR_TIME; g.clearing.cells.forEach(function (o) { clearing[o.r * C.COLS + o.c] = 1; }); }
    for (var r = 0; r < C.ROWS; r++) for (var col = 0; col < C.COLS; col++) { var v = g.grid[r][col]; if (!v) continue;
      if (clearing[r * C.COLS + col]) { var k = 1 + ct * 0.4; c.globalAlpha = 1 - ct; c.drawImage(sprite(v, spr), col * s + s * (1 - k) / 2, r * s + s * (1 - k) / 2, s * k, s * k); c.globalAlpha = 1;
        c.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - ct)) + ')'; c.beginPath(); c.arc((col + 0.5) * s, (r + 0.5) * s, s * 0.5 * ct + 2, 0, 7); c.fill(); }
      else c.drawImage(sprite(v, spr), col * s, r * s, s, s); }
    if (g.piece) { var p = g.piece, gy = p.y; while (g.fits(p.x, gy + 1)) gy++;
      c.fillStyle = 'rgba(59,158,255,0.18)'; c.fillRect(p.x * s, Math.max(0, gy) * s, s, (gy + 3 - Math.max(0, gy)) * s); c.strokeStyle = '#3b9eff'; c.lineWidth = 3; c.setLineDash([6, 5]); c.strokeRect(p.x * s + 2, Math.max(0, gy) * s + 2, s - 4, (gy + 3 - Math.max(0, gy)) * s - 4); c.setLineDash([]);
      for (var i = 0; i < 3; i++) if (p.y + i >= 0) c.drawImage(sprite(p.cells[i], spr), p.x * s, (p.y + i) * s, s, s); }
    for (var j = this.sparks.length - 1; j >= 0; j--) { var q = this.sparks[j]; q.t += dt; if (q.t > q.life) { this.sparks.splice(j, 1); continue; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 200 * dt; var a2 = 1 - q.t / q.life, z = 2 + 3 * a2;
      c.globalAlpha = a2; c.fillStyle = j % 3 ? q.col : '#fff'; c.fillRect(q.x - z / 2, q.y - 0.5, z, 1.5); c.fillRect(q.x - 0.75, q.y - z / 2, 1.5, z); }
    c.globalAlpha = 1;
  };
  root.SSRender = { Renderer: Renderer, sprite: sprite, COLORS: COLORS, NAMES: NAMES };
})(window);
