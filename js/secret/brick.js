// Secret game 1: BRICK BLITZ - blocky 2600-style brick breaker. Self-contained.
(function () {
  var S = window.SSSecret = window.SSSecret || {};
  S.brick = { title: 'Brick Blitz', start: function (cv, done) {
    var c = cv.getContext('2d'), W = 160, H = 192, raf, ended = 0, keys = {}, score = 0, lives = 3, round = 1;
    var pad = { x: 68, w: 24 }, ball, bricks, COL = ['#d82800', '#fc7460', '#fc9838', '#fcbc74', '#d8d800', '#50b818'];
    function reset() { ball = { x: 80, y: 120, vx: 0, vy: 0, live: 0 }; }
    function fill() { bricks = []; for (var r = 0; r < 6; r++) for (var i = 0; i < 8; i++) bricks.push({ x: i * 20, y: 28 + r * 7, r: r, on: 1 }); }
    function serve() { if (ball.live || ended) return; var sp = 1.6 + round * 0.25; ball.live = 1; ball.vx = (Math.random() < .5 ? -1 : 1) * sp * .6; ball.vy = -sp; }
    fill(); reset();
    function pt(e) { var b = cv.getBoundingClientRect(); return (e.clientX - b.left) / b.width * W; }
    function pm(e) { pad.x = Math.max(0, Math.min(W - pad.w, pt(e) - pad.w / 2)); }
    function pd(e) { pm(e); serve(); }
    function kd(e) { keys[e.key] = 1; if (e.key === ' ') serve(); } function ku(e) { keys[e.key] = 0; }
    cv.addEventListener('pointerdown', pd); cv.addEventListener('pointermove', pm); addEventListener('keydown', kd); addEventListener('keyup', ku);
    function finish() { if (ended === 2) return; ended = 2; cancelAnimationFrame(raf); cv.removeEventListener('pointerdown', pd); cv.removeEventListener('pointermove', pm);
      removeEventListener('keydown', kd); removeEventListener('keyup', ku); done(score * 5); }
    function step() {
      if (keys.ArrowLeft) pad.x = Math.max(0, pad.x - 3); if (keys.ArrowRight) pad.x = Math.min(W - pad.w, pad.x + 3);
      if (!ball.live) { ball.x = pad.x + pad.w / 2; ball.y = 176; return; }
      ball.x += ball.vx; ball.y += ball.vy;
      if (ball.x < 0 || ball.x > W - 3) { ball.vx *= -1; ball.x = Math.max(0, Math.min(W - 3, ball.x)); }
      if (ball.y < 12) { ball.vy = Math.abs(ball.vy); }
      if (ball.vy > 0 && ball.y + 3 >= 180 && ball.y < 184 && ball.x + 3 > pad.x && ball.x < pad.x + pad.w) {
        var h = (ball.x + 1.5 - pad.x) / pad.w - .5, sp = Math.hypot(ball.vx, ball.vy); ball.vx = h * sp * 1.6; ball.vy = -Math.sqrt(Math.max(.5, sp * sp - ball.vx * ball.vx)); }
      for (var i = 0; i < bricks.length; i++) { var b = bricks[i];
        if (b.on && ball.x + 3 > b.x && ball.x < b.x + 19 && ball.y + 3 > b.y && ball.y < b.y + 6) { b.on = 0; ball.vy *= -1; score += (6 - b.r) * 10; break; } }
      if (!bricks.some(function (b) { return b.on; })) { round++; fill(); reset(); }
      if (ball.y > H) { lives--; reset(); if (lives <= 0) { ended = 1; setTimeout(finish, 1800); } }
    }
    function draw() {
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H); c.fillStyle = '#8e8e8e'; c.fillRect(0, 10, W, 2);
      bricks.forEach(function (b) { if (b.on) { c.fillStyle = COL[b.r]; c.fillRect(b.x, b.y, 19, 6); } });
      c.fillStyle = '#d82800'; c.fillRect(pad.x, 180, pad.w, 4); c.fillStyle = '#fff'; c.fillRect(ball.x | 0, ball.y | 0, 3, 3);
      c.font = '8px monospace'; c.fillStyle = '#fc9838'; c.fillText('BRICK BLITZ ' + score + '  LIVES ' + lives, 4, 8);
      if (!ball.live && !ended) c.fillText('TAP / SPACE TO SERVE', 32, 150); if (ended) c.fillText('GAME OVER', 58, 120);
    }
    (function loop() { if (ended < 2) { if (!ended) step(); draw(); raf = requestAnimationFrame(loop); } })();
    return finish;
  } };
})();
