// Sweet Stack UI: menus, input (touch + keys), loop, leaderboards, secret cabinet.
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var C = SSCore, store = new SSStore.Store(), params = new URLSearchParams(location.search), DEBUG = params.get('debug') === '1';
  var game = null, renderer = new SSRender.Renderer($('board')), paused = false, secretOn = null, cabinetT = 0, soft = false, last = 0, mode = 'infinite', toastT = 0;

  var T = window.SSTrack || { begin: function () { return null; }, end: function () {}, update: function () {} }, sess = null;
  function endSess() { if (sess && game) T.end(sess, { score: game.score, level: game.level, time: game.mode === 'timerun' ? game.time : 0 }); sess = null; }
  function show(id) { document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('active', s.id === id); }); }
  function fmt(t) { var m = Math.floor(t / 60), s = (t % 60).toFixed(2); return m + ':' + (s < 10 ? '0' : '') + s; }
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.style.opacity = 1; toastT = 1.4; }

  function start(m, lv) { endSess(); mode = m; game = new C.Game({ mode: m, level: lv || 1 }); paused = false; hideCabinet(); show('game'); layout(); hud(); sess = T.begin(m); if (m === 'timerun') toast('Level ' + game.level + ': clear ' + game.def.goal); }
  function layout() { var w = $('well'); renderer.resize(w.clientWidth - 8, w.clientHeight - 8); }
  function hud() {
    $('h-score').textContent = game.score; $('h-level').textContent = game.level;
    if (game.mode === 'timerun') { $('h-x-l').textContent = 'TIME'; $('h-x').textContent = fmt(game.time) + ' ' + Math.min(game.levelCleared, game.def.goal) + '/' + game.def.goal; }
    else { $('h-x-l').textContent = 'CLEARED'; $('h-x').textContent = game.cleared; }
    var n = $('next'), c = n.getContext('2d'); c.clearRect(0, 0, 40, 120); for (var i = 0; i < 3; i++) c.drawImage(SSRender.sprite(game.next[i], 40), 0, i * 40, 40, 40);
  }
  function handleEvents() {
    while (game.events.length) { var e = game.events.shift();
      if (e.type === 'clear') { renderer.burst(e.cells); if (e.chain > 1) toast(e.chain + 'x CHAIN! +' + e.points); }
      else if (e.type === 'cabinet') showCabinet();
      else if (e.type === 'level') toast('Level ' + e.level + '!');
      else if (e.type === 'levelDone') { toast('Level ' + e.level + ' clear! ' + fmt(e.time)); if (!game.won) setTimeout(function () { toast('Level ' + game.level + ': clear ' + game.def.goal); }, 1400); }
      else if (e.type === 'gameover' || e.type === 'win') setTimeout(finish, 600);
    }
  }
  function finish() {
    if (!game || $('game').className.indexOf('active') < 0) return;
    var g = game, txt;
    if (g.mode === 'infinite') { store.addInfinite(g.score, g.level); txt = 'Score ' + g.score + ' · Level ' + g.level + ' · Best chain ' + g.maxChain; $('o-title').textContent = 'Game Over'; }
    else if (g.won) { store.addTimeRun(g.time, g.score); txt = 'All 15 levels in ' + fmt(g.time) + ' · Score ' + g.score; $('o-title').textContent = 'Time Run Complete!'; }
    else { txt = 'Reached level ' + g.level + ' of 15 · ' + fmt(g.time); $('o-title').textContent = 'Stack Topped Out'; }
    endSess(); $('o-text').textContent = txt; show('over');
  }
  // --- secret cabinet ---
  function showCabinet() { cabinetT = 5; $('cabinet').hidden = false; }
  function hideCabinet() { cabinetT = 0; $('cabinet').hidden = true; }
  function launchSecret(key) {
    hideCabinet(); key = key || store.takeSecret(); var mod = window.SSSecret[key], cv = $('sec-cv');
    secretOn = { key: key, sess: T.begin(key) }; show('secret');
    var sc = Math.max(1, Math.floor(Math.min(innerWidth / 160, (innerHeight - 10) / 192))); cv.width = 160; cv.height = 192; cv.style.width = 160 * sc + 'px'; cv.style.height = 192 * sc + 'px';
    secretOn.quit = mod.start(cv, function (bonus) {
      if (!secretOn) return; T.end(secretOn.sess, { score: bonus }); secretOn = null; show(game ? 'game' : 'menu');
      if (game) { game.addBonus(bonus); toast(mod.title + ' bonus +' + Math.floor(bonus)); hud(); last = performance.now(); }
    });
  }
  window.__ss = { get game() { return game; }, start: start, launchSecret: launchSecret, showCabinet: showCabinet, store: store, get secret() { return secretOn; } };

  // --- loop ---
  function frame(t) {
    var dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
    if (game && !paused && !secretOn && $('game').classList.contains('active')) {
      game.update(dt, soft); handleEvents(); renderer.draw(game, dt); hud(); T.update(sess, { score: game.score, level: game.level, time: game.mode === 'timerun' ? game.time : 0 });
      if (cabinetT > 0 && (cabinetT -= dt) <= 0) hideCabinet();
      if (toastT > 0 && (toastT -= dt) <= 0) $('toast').style.opacity = 0;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // --- input ---
  function act(a) { if (!game || paused || secretOn) return; ({ left: function () { game.move(-1); }, right: function () { game.move(1); }, rot: function () { game.rotate(); }, down: function () { game.softDrop(); }, drop: function () { game.hardDrop(); } })[a](); }
  document.querySelectorAll('#pad button').forEach(function (b) {
    var rep; b.addEventListener('pointerdown', function (e) { e.preventDefault(); var a = b.dataset.a; act(a);
      if (a === 'left' || a === 'right' || a === 'down') rep = setInterval(function () { act(a); }, a === 'down' ? 60 : 140); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { clearInterval(rep); }); });
  });
  // One-thumb gestures on the whole play area: drag sideways = piece follows finger column by column;
  // tap = rotate; quick flick down = hard drop; slow drag down = soft drop (while held). Buttons stay as fallback.
  var sw = null, bd = $('well');
  function gx(e) { return e.clientX; }
  bd.addEventListener('pointerdown', function (e) { if (e.target.closest('#cabinet')) return; e.preventDefault(); try { bd.setPointerCapture(e.pointerId); } catch (_) {}
    sw = { id: e.pointerId, x0: gx(e), y0: e.clientY, cols: 0, t0: performance.now(), moved: false, axis: null, lastY: e.clientY, lastT: performance.now(), vy: 0 }; });
  bd.addEventListener('pointermove', function (e) { if (!sw || e.pointerId !== sw.id || !game) return; e.preventDefault();
    var cell = renderer.cell || 40, dx = gx(e) - sw.x0, dy = e.clientY - sw.y0, now = performance.now();
    if (!sw.axis && (Math.abs(dx) > 12 || Math.abs(dy) > 12)) { sw.axis = Math.abs(dx) >= Math.abs(dy) * 0.8 ? 'x' : 'y'; sw.moved = true; }
    if (sw.axis === 'x' || (sw.axis === 'y' && Math.abs(dx) > cell * 0.9)) { // sideways: follow finger; ~0.6 cell per column feels forgiving
      var want = Math.round(dx / (cell * 0.6)); while (sw.cols < want) { act('right'); sw.cols++; } while (sw.cols > want) { act('left'); sw.cols--; } }
    var dtm = Math.max(1, now - sw.lastT); sw.vy = 0.6 * sw.vy + 0.4 * ((e.clientY - sw.lastY) / dtm); sw.lastY = e.clientY; sw.lastT = now;
    soft = sw.axis === 'y' && dy > cell * 0.5 && sw.vy < 0.9; });
  function swEnd(e) { if (!sw || (e && e.pointerId !== sw.id)) return; var dy = (e ? e.clientY : sw.lastY) - sw.y0, dt = performance.now() - sw.t0;
    soft = false; var cell = renderer.cell || 40;
    if (e && e.type === 'pointerup') {
      if (sw.axis === 'y' && dy > cell * 0.8 && (sw.vy > 0.7 || (dy / dt) > 0.8)) act('drop');   // flick down
      else if (!sw.moved && dt < 450) act('rot');                                                // tap
    }
    sw = null; }
  bd.addEventListener('pointerup', swEnd); bd.addEventListener('pointercancel', swEnd);
  ['touchmove', 'gesturestart', 'dblclick'].forEach(function (ev) { document.addEventListener(ev, function (e) { if (e.target.closest && e.target.closest('#game,#secret')) e.preventDefault(); }, { passive: false }); });
  addEventListener('keydown', function (e) {
    if (secretOn) return; var k = e.key;
    if (k === 'p' || k === 'P' || k === 'Escape') { if (game && $('game').classList.contains('active')) pause(true); else if (paused) pause(false); return; }
    var map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'rot', ' ': 'rot', ArrowDown: 'down', Enter: 'drop' };
    if (map[k] && $('game').classList.contains('active')) { e.preventDefault(); if (k === 'ArrowDown') soft = true; else act(map[k]); }
  });
  addEventListener('keyup', function (e) { if (e.key === 'ArrowDown') soft = false; });
  function pause(on) { paused = on; show(on ? 'paused' : 'game'); last = performance.now(); }

  // --- menus ---
  function on(id, f) { $(id).addEventListener('click', f); }
  on('b-inf', function () { start('infinite'); }); on('b-tr', function () { start('timerun'); });
  on('b-lb', function () { renderLB(); show('lb'); }); on('b-help', function () { show('help'); });
  on('lb-back', function () { show('menu'); }); on('help-back', function () { show('menu'); });
  on('o-again', function () { start(mode); }); on('o-menu', function () { show('menu'); });
  on('b-pause', function () { pause(true); }); on('p-resume', function () { pause(false); }); on('p-quit', function () { endSess(); paused = false; game = null; show('menu'); });
  $('cabinet').addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); launchSecret(); });
  on('sec-exit', function () { if (secretOn && secretOn.quit) secretOn.quit(); });
  function renderLB() {
    var d = store.data;
    $('lb-inf').innerHTML = d.infinite.length ? d.infinite.map(function (e) { return '<li>' + e.score + ' pts · Lv ' + e.level + ' <small>' + e.date + '</small></li>'; }).join('') : '<li>No scores yet</li>';
    $('lb-tr').innerHTML = d.timerun.length ? d.timerun.map(function (e) { return '<li>' + fmt(e.time) + ' <small>' + e.score + ' pts · ' + e.date + '</small></li>'; }).join('') : '<li>No completed runs yet</li>';
    var u = d.unlocks, n = (u.brick > 0) + (u.pong > 0) + (u.ice > 0); $('lb-sec').textContent = n ? 'Secret arcade games found: ' + n + '/3' : '';
  }
  addEventListener('resize', function () { if (game && $('game').classList.contains('active')) layout(); });
  // menu candy strip
  (function () { var c = $('menu-candy').getContext('2d'); for (var i = 0; i < 7; i++) c.drawImage(SSRender.sprite(i + 1, 80), 4 + i * 42, 15, 40, 40); })();
  // --- debug hooks: ?debug=1 shows panel; ?debug=1&level=N starts Time Run at N; &secret=brick|pong|ice launches a secret ---
  if (DEBUG) {
    $('debug').hidden = false; var s = $('d-lvl'); for (var i = 1; i <= C.TIME_RUN_LEVELS; i++) s.add(new Option(i, i));
    on('d-go', function () { start('timerun', +s.value); }); on('d-cab', function () { if (!game) start('infinite'); showCabinet(); });
    ['brick', 'pong', 'ice'].forEach(function (k) { on('d-' + k, function () { if (!game) start('infinite'); launchSecret(k); }); });
    var lv = +params.get('level'); if (lv >= 1 && lv <= 15) start('timerun', lv);
    var sk = params.get('secret'); if (window.SSSecret[sk]) { if (!game) start('infinite'); launchSecret(sk); }
  }
})();
