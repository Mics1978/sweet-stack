// Leaderboards + unlocks in localStorage, validated so corrupt data resets safely.
(function (root) {
  'use strict';
  var KEY = 'sweetstack.v1', SECRETS = ['brick', 'pong', 'ice'];
  function fresh() { return { v: 1, infinite: [], timerun: [], unlocks: { brick: 0, pong: 0, ice: 0 }, nextSecret: 0 }; }
  function num(x, min, max) { return typeof x === 'number' && isFinite(x) && x >= min && x <= max; }
  function sanitize(d) {
    var o = fresh();
    if (!d || typeof d !== 'object' || d.v !== 1) return o;
    if (Array.isArray(d.infinite)) o.infinite = d.infinite.filter(function (e) { return e && num(e.score, 0, 1e12) && num(e.level, 1, 1e6); })
      .map(function (e) { return { score: Math.floor(e.score), level: Math.floor(e.level), date: String(e.date || '').slice(0, 24) }; });
    if (Array.isArray(d.timerun)) o.timerun = d.timerun.filter(function (e) { return e && num(e.time, 1, 1e7); })
      .map(function (e) { return { time: +e.time, score: num(e.score, 0, 1e12) ? Math.floor(e.score) : 0, date: String(e.date || '').slice(0, 24) }; });
    if (d.unlocks && typeof d.unlocks === 'object') SECRETS.forEach(function (k) { if (num(d.unlocks[k], 0, 1e6)) o.unlocks[k] = Math.floor(d.unlocks[k]); });
    if (num(d.nextSecret, 0, 2)) o.nextSecret = Math.floor(d.nextSecret);
    sortAll(o); return o;
  }
  function sortAll(o) {
    o.infinite.sort(function (a, b) { return b.score - a.score || b.level - a.level; }); o.infinite = o.infinite.slice(0, 10);
    o.timerun.sort(function (a, b) { return a.time - b.time; }); o.timerun = o.timerun.slice(0, 10);
  }
  function Store(ls) { this.ls = ls || (typeof localStorage !== 'undefined' ? localStorage : null); this.data = this.load(); }
  Store.prototype.load = function () { try { var raw = this.ls && this.ls.getItem(KEY); return raw ? sanitize(JSON.parse(raw)) : fresh(); } catch (e) { return fresh(); } };
  Store.prototype.save = function () { try { this.ls && this.ls.setItem(KEY, JSON.stringify(this.data)); } catch (e) {} };
  Store.prototype.addInfinite = function (score, level) { this.data.infinite.push({ score: Math.floor(score), level: level, date: new Date().toISOString().slice(0, 10) }); sortAll(this.data); this.save(); };
  Store.prototype.addTimeRun = function (time, score) { this.data.timerun.push({ time: Math.round(time * 100) / 100, score: Math.floor(score), date: new Date().toISOString().slice(0, 10) }); sortAll(this.data); this.save(); };
  Store.prototype.takeSecret = function () { var k = SECRETS[this.data.nextSecret]; this.data.unlocks[k]++; this.data.nextSecret = (this.data.nextSecret + 1) % 3; this.save(); return k; };
  Store.prototype.reset = function () { this.data = fresh(); this.save(); };
  root.SSStore = { Store: Store, sanitize: sanitize, KEY: KEY, SECRETS: SECRETS };
  if (typeof module !== 'undefined') module.exports = root.SSStore;
})(typeof window !== 'undefined' ? window : globalThis);
