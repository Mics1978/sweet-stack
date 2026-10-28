// Secret game 2: PADDLE DUEL - blocky 2600-style Pong vs CPU. Self-contained.
(function () {
  var S = window.SSSecret = window.SSSecret || {};
  S.pong = { title: 'Paddle Duel', start: function (cv, done) {
    var c = cv.getContext('2d'), W = 160, H = 192, raf, ended = 0, keys = {}, me = 0, cpu = 0, WIN = 7;
    var py = 80, cy = 80, PH = 24, ball, wait = 60;
    function serve(d) { ball = { x: 78, y: 94, vx: 1.7 * d, vy: (Math.random() - .5) * 2 }; wait = 50; }
    serve(1);
    function pt(e) { var b = cv.getBoundingClientRect(); return (e.clientY - b.top) / b.height * H; }
    function pm(e) { py = Math.max(12, Math.min(H - PH, pt(e) - PH / 2)); }
    function kd(e) { keys[e.key] = 1; } function ku(e) { keys[e.key] = 0; }
    cv.addEventListener('pointerdown', pm); cv.addEventListener('pointermove', pm); addEventListener('keydown', kd); addEventListener('keyup', ku);
    function finish() { if (ended === 2) return; ended = 2; cancelAnimationFrame(raf); cv.removeEventListener('pointerdown', pm); cv.removeEventListener('pointermove', pm);
      removeEventListener('keydown', kd); removeEventListener('keyup', ku); done(me * 300 + (me >= WIN ? 2000 : 0)); }
    function hit(px, y, dir) { if (ball.y + 3 > y && ball.y < y + PH) { var h = (ball.y + 1.5 - y) / PH - .5; ball.vx = dir * Math.min(4, Math.abs(ball.vx) * 1.06); ball.vy = h * 4; ball.x = px; return 1; } }
    function step() {
      if (keys.ArrowUp) py = Math.max(12, py - 3); if (keys.ArrowDown) py = Math.min(H - PH, py + 3);
      var t = ball.y - PH / 2, sp = 1.5 + me * .12; cy += Math.max(-sp, Math.min(sp, t - cy)); cy = Math.max(12, Math.min(H - PH, cy));
      if (wait > 0) { wait--; return; }
      ball.x += ball.vx; ball.y += ball.vy;
      if (ball.y < 12 || ball.y > H - 3) { ball.vy *= -1; ball.y = Math.max(12, Math.min(H - 3, ball.y)); }
      if (ball.vx < 0 && ball.x <= 10 && ball.x > 4) hit(10, cy, 1);
      if (ball.vx > 0 && ball.x >= 147 && ball.x < 153) hit(147, py, -1);
      if (ball.x < -4) { me++; serve(-1); } else if (ball.x > W + 4) { cpu++; serve(1); }
      if (me >= WIN || cpu >= WIN) { ended = 1; setTimeout(finish, 1800); }
    }
    function draw() {
      c.fillStyle = '#5c4a00'; c.fillRect(0, 0, W, H); c.fillStyle = '#d8d8d8'; c.fillRect(0, 10, W, 2); for (var y = 14; y < H; y += 8) c.fillRect(79, y, 2, 4);
      c.fillStyle = '#fc7460'; c.fillRect(6, cy, 4, PH); c.fillStyle = '#84e0fc'; c.fillRect(150, py, 4, PH);
      c.fillStyle = '#fff'; c.fillRect(ball.x | 0, ball.y | 0, 3, 3);
      c.font = '8px monospace'; c.fillStyle = '#fc7460'; c.fillText('CPU ' + cpu, 20, 8); c.fillStyle = '#84e0fc'; c.fillText('YOU ' + me, 110, 8);
      if (ended) { c.fillStyle = '#fff'; c.fillText(me >= WIN ? 'YOU WIN!' : 'CPU WINS', 58, 100); }
    }
    (function loop() { if (ended < 2) { if (!ended) step(); draw(); raf = requestAnimationFrame(loop); } })();
    return finish;
  } };
})();
