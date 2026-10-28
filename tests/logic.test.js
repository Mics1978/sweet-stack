// node tests/logic.test.js
const assert = require('assert'); const C = require('../js/core.js'); const St = require('../js/storage.js');
let pass = 0; function t(name, f) { f(); pass++; console.log('ok -', name); }
const G = () => C.emptyGrid(), B = C.ROWS - 1;
t('match detection: horizontal, vertical, both diagonals, none', () => {
  let g = G(); g[B][0] = g[B][1] = g[B][2] = 1; assert.equal(C.findMatches(g).length, 3);
  g = G(); g[B][0] = g[B - 1][0] = g[B - 2][0] = g[B - 3][0] = 2; assert.equal(C.findMatches(g).length, 4);
  g = G(); g[B][0] = g[B - 1][1] = g[B - 2][2] = 3; assert.equal(C.findMatches(g).length, 3);
  g = G(); g[B][3] = g[B - 1][2] = g[B - 2][1] = 4; assert.equal(C.findMatches(g).length, 3);
  g = G(); g[B][0] = g[B][1] = 1; g[B][2] = 2; assert.equal(C.findMatches(g).length, 0);
  g = G(); g[B][0] = g[B][1] = g[B][2] = 1; g[B - 1][1] = g[B - 2][1] = 1; assert.equal(C.findMatches(g).length, 5, 'T-shape dedup');
});
t('gravity compacts columns', () => { const g = G(); g[0][0] = 1; g[5][0] = 2; g[B][1] = 3; C.applyGravity(g); assert.equal(g[B][0], 2); assert.equal(g[B - 1][0], 1); assert.equal(g[0][0], 0); assert.equal(g[B][1], 3); });
function settle(g) { let n = 0; while (g.phase === 'clearing' && n++ < 100) g.update(C.Game.CLEAR_TIME + 0.01); }
t('drop + match + chain scoring', () => {
  const g = new C.Game({ seed: 1 }); g.grid = G(); g.grid[B][0] = g.grid[B][1] = 5;
  g.piece = { x: 2, y: 0, cells: [1, 2, 5] }; g.hardDrop();
  assert.equal(g.phase, 'clearing'); assert.equal(g.chain, 1); const ev = g.events.find(e => e.type === 'clear'); assert.equal(ev.points, C.chainScore(3, 1, 1));
  settle(g); assert.ok(!g.events.some(e => e.type === 'cabinet')); assert.equal(g.grid[B][2], 2); assert.equal(g.grid[B][0], 0);
  assert.ok(C.chainScore(3, 3, 1) === 3 * C.chainScore(3, 1, 1), 'multiplier grows with chain');
});
t('5-step cascade fires cabinet event', () => {
  const h = new C.Game({ seed: 3 });
  h.grid = [[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,1,0,1,0,0],[0,2,0,2,0,0],[1,3,0,2,0,0],[1,1,0,1,1,0],[3,2,2,3,3,0],[3,1,3,3,1,3],[1,2,1,1,3,1]];
  assert.equal(C.findMatches(h.grid).length, 0); h.piece = { x: 2, y: -3, cells: [3, 3, 2] }; h.hardDrop(); settle(h);
  assert.equal(h.maxChain, 5); assert.equal(h.events.filter(e => e.type === 'cabinet').length, 1);
  const pts = h.events.filter(e => e.type === 'clear').map(e => e.points / e.count); assert.deepEqual(pts, [10, 20, 30, 40, 50]);
});
t('game over when stack reaches top', () => {
  const g = new C.Game({ seed: 4 }); g.grid = G(); for (let r = 0; r < C.ROWS; r++) g.grid[r][2] = (r % 2) + 1 + (r % 4 > 1 ? 2 : 0);
  assert.equal(C.findMatches(g.grid).length, 0); g.piece = { x: 2, y: -3, cells: [6, 7, 6] }; g.lock(); assert.ok(g.over && !g.won);
  const h = new C.Game({ seed: 5 }); let steps = 0; while (!h.over && steps++ < 200000) h.update(0.05); assert.ok(h.over, 'idle game eventually tops out');
});
t('infinite ramp: speed creeps up, colours join, level-up', () => {
  const a = C.infiniteParams(1), b = C.infiniteParams(10); assert.ok(b.interval < a.interval && b.colors > a.colors && a.colors === 4 && C.infiniteParams(99).colors === 7 && C.infiniteParams(999).interval >= 0.14);
  const g = new C.Game({ seed: 6 }); g.cleared = 30; g.phase = 'fall'; g.afterSettle(); assert.equal(g.level, 2);
});
t('time run levels 1-15 escalate, layouts valid, progression to completion', () => {
  let prev = null;
  for (let i = 1; i <= 15; i++) { const d = C.timeRunLevel(i), L = C.buildLayout(d);
    assert.equal(C.findMatches(L).length, 0, 'no premade matches L' + i); assert.ok(L[4].every(v => v === 0), 'top clear L' + i);
    assert.ok(L.flat().filter(Boolean).every(v => v <= d.colors));
    if (prev) assert.ok(d.interval < prev.interval && d.colors >= prev.colors && d.goal > prev.goal); prev = d; }
  assert.equal(C.timeRunLevel(15).colors, 7);
  const g = new C.Game({ mode: 'timerun', seed: 7 }); assert.equal(g.level, 1);
  for (let i = 1; i <= 15; i++) { assert.equal(g.level, i); g.levelCleared = g.def.goal; g.phase = 'fall'; g.update(1); g.afterSettle(); }
  assert.ok(g.over && g.won); assert.ok(g.events.filter(e => e.type === 'levelDone').length === 15); assert.ok(g.time > 0);
});
t('bonus adds to score', () => { const g = new C.Game({ seed: 8 }); g.addBonus(1234.7); g.addBonus(-5); g.addBonus('x'); assert.equal(g.score, 1234); });
t('leaderboards save, sort, cap, corrupt handling', () => {
  const mem = { d: {}, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = v; } };
  let s = new St.Store(mem); for (let i = 0; i < 15; i++) s.addInfinite(i * 100, i + 1); s.addTimeRun(300, 5); s.addTimeRun(200.123, 9);
  s = new St.Store(mem); assert.equal(s.data.infinite.length, 10); assert.equal(s.data.infinite[0].score, 1400); assert.equal(s.data.timerun[0].time, 200.12);
  assert.equal(s.takeSecret(), 'brick'); assert.equal(s.takeSecret(), 'pong'); assert.equal(s.takeSecret(), 'ice'); assert.equal(s.takeSecret(), 'brick'); assert.equal(new St.Store(mem).data.unlocks.brick, 2);
  for (const bad of ['{nope', 'null', '42', '{"v":2}', '{"v":1,"infinite":"x","timerun":[{"time":-1},{"time":"9"}],"unlocks":{"brick":-3},"nextSecret":9}', '{"v":1,"infinite":[{"score":1e99,"level":1},{"score":5,"level":2}]}']) {
    mem.d[St.KEY] = bad; const x = new St.Store(mem).data; assert.ok(Array.isArray(x.infinite) && Array.isArray(x.timerun) && x.nextSecret >= 0 && x.nextSecret <= 2 && x.unlocks.brick >= 0); }
  assert.equal(new St.Store(mem).data.infinite.length, 1);
  const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); } }; const z = new St.Store(throwing); z.addInfinite(5, 1); assert.equal(z.data.infinite.length, 1);
});
console.log(`\n${pass} test groups passed`);
