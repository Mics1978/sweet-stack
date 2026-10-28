// Sweet Stack UI: menus, input (touch + keys), loop, leaderboards, secret cabinet.
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var C = SSCore, store = new SSStore.Store(), params = new URLSearchParams(location.search), DEBUG = params.get('debug') === '1';
  var game = null, renderer = new SSRender.Renderer($('board')), paused = false, secretOn = null, cabinetT = 0, soft = false, last = 0, mode = 'infinite', toastT = 0;

  function show(id) { document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('active', s.id === id); }); }
  function fmt(t) { var m = Math.floor(t / 60), s = (t % 60).toFixed(2); return m + ':' + (s < 10 ? '0' : '') + s; }
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.style.opacity = 1; toastT = 1.4; }

  function start(m, lv) { mode = m; game = new C.Game({ mode: m, level: lv || 1 }); paused = false; hideCabinet(); show('game'); layout(); hud(); if (m === 'timerun') toast('Level ' + game.level + ': clear ' + game.def.goal); }
  function layout() { var w = $('well'); renderer.resize(w.clientWidth - 8, w.clientHeight - 8); }
  function hud() {
    $('h-score').textContent = game.score; $('h-level').textContent = game.level;
    if (game.mode === 'timerun') { $('h-x-l').textContent = 'TIME'; $('h-x').textContent = fmt(game.time) + ' ' + Math.min(game.levelCleared, game.def.goal) + '/' + game.def.goal; }
    else { $('h-x-l').textContent = 'CLEARED'; $('h-x').textContent = game.cleared; }
    var n = $('next'), c = n.getContext('2d'); c.clearRect(0, 0, 40, 120); for (var i = 0; i < 3; i++) c.drawImage(SSRender.sprite(game.next[i], 40), 0, i * 40, 40, 40);
  }
  function handleEvents() {
    while (game.events.length) { var e = game.events.shift();
      if (e.type === 'clear') { renderer.burst(e.cells); if (e.chain > 1) toast(e.chain + '× CHAIN! +' + e.points); }
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
    $('o-text').textContent = txt; show('over');
  }
  // --- secret cabinet ---
  function showCabinet() { cabinetT = 5; $('cabinet').hidden = false; }
  function hideCabinet() { cabinetT = 0; $('cabinet').hidden = true; }
  function launchSecret(key) {
    hideCabinet(); key = key || store.takeSecret(); var mod = window.SSSecret[key], cv = $('sec-cv');
    secretOn = { key: key }; show('secret');
    var sc = Math.max(1, Math.floor(Math.min(innerWidth / 160, (innerHeight - 10) / 192))); cv.width = 160; cv.height = 192; cv.style.width = 160 * sc + 'px'; cv.style.height = 192 * sc + 'px';
    secretOn.quit = mod.start(cv, function (bonus) {
      if (!secretOn) return; secretOn = null; show(game ? 'game' : 'menu');
      if (game) { game.addBonus(bonus); toast(mod.title + ' bonus +' + Math.floor(bonus)); hud(); last = performance.now(); }
    });
  }
  window.__ss = { get game() { return game; }, start: start, launchSecret: launchSecret, showCabinet: showCabinet, store: store, get secret() { return secretOn; } };

  // --- loop ---
  function frame(t) {
    var dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
    if (game && !paused && !secretOn && $('game').classList.contains('active')) {
      game.update(dt, soft); handleEvents(); renderer.draw(game, dt); hud();
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
  var sw = null, bd = $('board');
  bd.addEventListener('pointerdown', function (e) { sw = { x: e.clientX, y: e.clientY, moved: 0, t: performance.now() }; });
  bd.addEventListener('pointermove', function (e) { if (!sw || !game) return; var step = renderer.cell, dx = e.clientX - sw.x;
    while (Math.abs(dx) >= step) { var d = dx > 0 ? 1 : -1; act(d > 0 ? 'right' : 'left'); sw.x += d * step; dx -= d * step; sw.moved = 1; } });
  bd.addEventListener('pointerup', function (e) { if (!sw) return; var dy = e.clientY - sw.y;
    if (dy > renderer.cell * 1.5) act('drop'); else if (dy < -renderer.cell * 1.5 || !sw.moved) act('rot'); sw = null; });
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
  on('b-pause', function () { pause(true); }); on('p-resume', function () { pause(false); }); on('p-quit', function () { paused = false; game = null; show('menu'); });
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
