// Sweet Stack core logic: pure, DOM-free (works in browser and Node).
(function (root) {
  'use strict';
  var COLS = 6, ROWS = 13, MAX_COLORS = 7, CHAIN_CABINET = 5, TIME_RUN_LEVELS = 15;

  function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function emptyGrid() { var g = []; for (var r = 0; r < ROWS; r++) { g.push(new Array(COLS).fill(0)); } return g; }

  // Return array of [r,c] cells in runs of 3+ (horizontal, vertical, both diagonals).
  function findMatches(g) {
    var mark = {}, out = [], dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var v = g[r][c]; if (!v) continue;
      for (var d = 0; d < 4; d++) {
        var dr = dirs[d][0], dc = dirs[d][1], pr = r - dr, pc = c - dc;
        if (pr >= 0 && pr < ROWS && pc >= 0 && pc < COLS && g[pr][pc] === v) continue; // not run start
        var n = 0, rr = r, cc = c;
        while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && g[rr][cc] === v) { n++; rr += dr; cc += dc; }
        if (n >= 3) for (var k = 0; k < n; k++) { var key = (r + dr * k) * COLS + (c + dc * k); if (!mark[key]) { mark[key] = 1; out.push([r + dr * k, c + dc * k]); } }
      }
    }
    return out;
  }
  function applyGravity(g) {
    var moved = false;
    for (var c = 0; c < COLS; c++) { var w = ROWS - 1; for (var r = ROWS - 1; r >= 0; r--) if (g[r][c]) { if (w !== r) { g[w][c] = g[r][c]; g[r][c] = 0; moved = true; } w--; } }
    return moved;
  }
  function chainScore(cleared, chain, level) { return cleared * 10 * chain * Math.max(1, level); }

  // Time Run level table (15 escalating levels)
  var PATTERNS = ['flat', 'stairs', 'pillars', 'valley', 'checker'];
  function timeRunLevel(i) {
    return { level: i, colors: Math.min(MAX_COLORS, 3 + Math.ceil(i / 3)), interval: Math.max(0.16, +(0.8 * Math.pow(0.9, i - 1)).toFixed(3)),
      goal: 10 + i * 2, pattern: PATTERNS[(i - 1) % PATTERNS.length], height: Math.min(7, 1 + Math.ceil(i / 2.5)) };
  }
  function infiniteParams(level) {
    return { colors: Math.min(MAX_COLORS, 4 + Math.floor((level - 1) / 3)), interval: Math.max(0.14, 0.85 * Math.pow(0.93, level - 1)) };
  }
  // Deterministic starting layout with no pre-existing matches
  function buildLayout(def, seed) {
    var g = emptyGrid(), R = rng(seed || def.level * 7919), h = def.height;
    for (var c = 0; c < COLS; c++) {
      var ch;
      switch (def.pattern) {
        case 'stairs': ch = Math.round(h * (c + 1) / COLS); break;
        case 'pillars': ch = c % 2 ? h : Math.ceil(h / 3); break;
        case 'valley': ch = Math.round(h * Math.abs(c - 2.5) / 2.5); break;
        case 'checker': ch = h - (c % 3); break;
        default: ch = Math.max(1, h - 1);
      }
      ch = Math.max(0, Math.min(ROWS - 5, ch));
      for (var k = 0; k < ch; k++) {
        var r = ROWS - 1 - k, tries = 0;
        do { g[r][c] = 1 + Math.floor(R() * def.colors); tries++; } while (findMatches(g).length && tries < 30);
        if (findMatches(g).length) g[r][c] = 0;
      }
    }
    applyGravity(g);
    return g;
  }

  function Game(opts) {
    opts = opts || {};
    this.mode = opts.mode === 'timerun' ? 'timerun' : 'infinite';
    this.rand = rng(opts.seed || (Date.now() & 0xffffff));
    this.score = 0; this.level = 1; this.cleared = 0; this.levelCleared = 0; this.time = 0; this.levelTime = 0;
    this.maxChain = 0; this.over = false; this.won = false; this.events = []; this.bonus = 0;
    this.startLevel(opts.level || 1);
  }
  Game.prototype.startLevel = function (lv) {
    this.level = lv; this.levelCleared = 0; this.levelTime = 0; this.phase = 'fall'; this.clearing = null; this.chain = 0;
    if (this.mode === 'timerun') { this.def = timeRunLevel(lv); this.grid = buildLayout(this.def); }
    else { this.def = infiniteParams(lv); if (!this.grid) this.grid = emptyGrid(); }
    this.next = this.newTrio(); this.spawn();
  };
  Game.prototype.newTrio = function () { var n = this.def.colors, R = this.rand; return [1 + Math.floor(R() * n), 1 + Math.floor(R() * n), 1 + Math.floor(R() * n)]; };
  Game.prototype.spawn = function () {
    this.piece = { x: 2, y: -2, cells: this.next }; this.next = this.newTrio(); this.fallT = 0;
    if (this.grid[0][2]) this.end(false);
  };
  Game.prototype.cellFree = function (r, c) { return c >= 0 && c < COLS && r < ROWS && (r < 0 || !this.grid[r][c]); };
  Game.prototype.fits = function (x, y) { for (var i = 0; i < 3; i++) if (!this.cellFree(y + i, x)) return false; return true; };
  Game.prototype.move = function (dx) { if (this.phase !== 'fall' || this.over) return false; var p = this.piece; if (this.fits(p.x + dx, p.y)) { p.x += dx; return true; } return false; };
  Game.prototype.rotate = function () { if (this.phase !== 'fall' || this.over) return; var c = this.piece.cells; this.piece.cells = [c[2], c[0], c[1]]; };
  Game.prototype.softDrop = function () { if (this.phase !== 'fall' || this.over) return; if (this.fits(this.piece.x, this.piece.y + 1)) { this.piece.y++; this.score += 1; this.fallT = 0; } else this.lock(); };
  Game.prototype.hardDrop = function () { if (this.phase !== 'fall' || this.over) return; var n = 0; while (this.fits(this.piece.x, this.piece.y + 1)) { this.piece.y++; n++; } this.score += n * 2; this.lock(); };
  Game.prototype.lock = function () {
    var p = this.piece, top = false;
    for (var i = 0; i < 3; i++) { var r = p.y + i; if (r < 0) top = true; else this.grid[r][p.x] = p.cells[i]; }
    this.piece = null; this.chain = 0;
    if (!this.resolve() && top) return this.end(false);
    if (this.phase === 'fall') this.spawn();
  };
  // Start a clear step if matches exist; returns true when clearing began.
  Game.prototype.resolve = function () {
    var m = findMatches(this.grid);
    if (!m.length) { this.phase = 'fall'; return false; }
    this.chain++; this.maxChain = Math.max(this.maxChain, this.chain);
    var pts = chainScore(m.length, this.chain, this.level); this.score += pts;
    this.cleared += m.length; this.levelCleared += m.length;
    this.clearing = { cells: m.map(function (a) { return { r: a[0], c: a[1], v: this.grid[a[0]][a[1]] }; }, this), t: 0 };
    this.events.push({ type: 'clear', count: m.length, chain: this.chain, points: pts, cells: this.clearing.cells });
    if (this.chain === CHAIN_CABINET) this.events.push({ type: 'cabinet', chain: this.chain });
    this.phase = 'clearing'; return true;
  };
  Game.prototype.finishClear = function () {
    var g = this.grid; this.clearing.cells.forEach(function (o) { g[o.r][o.c] = 0; }); this.clearing = null;
    applyGravity(g);
    if (this.resolve()) return;
    this.afterSettle();
  };
  Game.prototype.afterSettle = function () {
    if (this.mode === 'infinite') {
      var lv = 1 + Math.floor(this.cleared / 30);
      if (lv > this.level) { this.level = lv; this.def = infiniteParams(lv); this.events.push({ type: 'level', level: lv }); }
      this.phase = 'fall'; this.spawn();
    } else if (this.levelCleared >= this.def.goal) {
      this.events.push({ type: 'levelDone', level: this.level, time: this.levelTime });
      if (this.level >= TIME_RUN_LEVELS) { this.won = true; this.end(true); }
      else this.startLevel(this.level + 1);
    } else { this.phase = 'fall'; this.spawn(); }
  };
  Game.prototype.end = function (won) { if (this.over) return; this.over = true; this.won = !!won; this.phase = 'over'; this.events.push({ type: won ? 'win' : 'gameover' }); };
  Game.prototype.addBonus = function (n) { n = Math.max(0, Math.floor(+n || 0)); this.score += n; this.bonus += n; };
  Game.prototype.update = function (dt, softHeld) {
    if (this.over) return;
    this.time += dt; this.levelTime += dt;
    if (this.phase === 'clearing') { this.clearing.t += dt; if (this.clearing.t >= Game.CLEAR_TIME) this.finishClear(); return; }
    this.fallT += dt; var iv = softHeld ? Math.min(0.05, this.def.interval) : this.def.interval;
    while (this.fallT >= iv && this.phase === 'fall' && !this.over) {
      this.fallT -= iv;
      if (this.fits(this.piece.x, this.piece.y + 1)) this.piece.y++; else { this.lock(); break; }
    }
  };
  Game.CLEAR_TIME = 0.45;

  root.SSCore = { COLS: COLS, ROWS: ROWS, MAX_COLORS: MAX_COLORS, CHAIN_CABINET: CHAIN_CABINET, TIME_RUN_LEVELS: TIME_RUN_LEVELS,
    rng: rng, emptyGrid: emptyGrid, findMatches: findMatches, applyGravity: applyGravity, chainScore: chainScore,
    timeRunLevel: timeRunLevel, infiniteParams: infiniteParams, buildLayout: buildLayout, Game: Game };
  if (typeof module !== 'undefined') module.exports = root.SSCore;
})(typeof window !== 'undefined' ? window : globalThis);
