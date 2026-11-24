// Candy sprites + board rendering (Canvas, native-resolution Amiga Plus arcade sprites).
(function (root) {
  'use strict';
  // GMOB palette (gmobai.in): flat cartoon fills with thick ink outlines.
  var COLORS = ['#FF3C00', '#f59e0b', '#a3e635', '#00e5a0', '#3b9eff', '#a855f7', '#ec4899'];
  var NAMES = ['Blaze Bean', 'Amber Bear', 'Lime Pop', 'Mint Bean', 'Sky Bear', 'Grape Pop', 'Bubblegum Bean'];
  var SHAPES = ['bean', 'bear', 'pop', 'bean', 'bear', 'pop', 'bean'];
  var INK = '#111', cache = {};
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  var ramps=[['#fff3ad','#ff481e','#a61e32'],['#fff5aa','#ffb519','#a65b10'],['#f7ffb1','#a7ed27','#3b821b'],['#e0fff1','#00e5a0','#087d60'],['#e3faff','#329fff','#1946a2'],['#fce4ff','#ac59ff','#54239c'],['#fff1fa','#ff4da9','#ab2168']];
  function sprite(v,s){
    s=Math.max(1,Math.round(s));var key=v+':'+s;if(cache[key])return cache[key];
    var cv=document.createElement('canvas');cv.width=cv.height=s;
    var c=cv.getContext('2d'),kind=SHAPES[(v-1)%7],r=ramps[(v-1)%7];
    c.scale(s/100,s/100);c.lineJoin='round';c.lineCap='round';
    var paint=c.createLinearGradient(17,5,82,92);paint.addColorStop(0,r[0]);paint.addColorStop(.35,r[1]);paint.addColorStop(.72,r[1]);paint.addColorStop(1,r[2]);
    function ell(x,y,rx,ry,angle){c.moveTo(x+rx*Math.cos(angle||0),y+rx*Math.sin(angle||0));c.ellipse(x,y,rx,ry,angle||0,0,Math.PI*2);}
    function finish(){c.fillStyle=paint;c.fill();c.lineWidth=4;c.strokeStyle='#261938';c.stroke();}
    function gloss(x,y,rx,ry,angle){c.beginPath();ell(x,y,rx,ry,angle);c.fillStyle='rgba(255,255,255,.85)';c.fill();}
    if(kind==='bean'){
      c.beginPath();ell(50,50,43,32,-.35);finish();c.beginPath();c.moveTo(25,60);c.quadraticCurveTo(46,78,76,53);c.strokeStyle=r[2];c.lineWidth=4;c.stroke();gloss(33,33,15,5,-.45);gloss(18,44,4,3);
    }else if(kind==='bear'){
      c.beginPath();c.moveTo(29,29);c.bezierCurveTo(6,32,5,4,24,4);c.bezierCurveTo(34,4,38,10,38,14);c.quadraticCurveTo(50,8,62,14);c.bezierCurveTo(64,0,88,0,90,18);c.quadraticCurveTo(91,31,72,30);c.bezierCurveTo(89,42,73,51,72,51);c.bezierCurveTo(96,63,96,89,76,89);c.quadraticCurveTo(64,99,50,89);c.quadraticCurveTo(36,99,24,89);c.bezierCurveTo(3,89,5,63,28,51);c.bezierCurveTo(11,43,16,32,29,29);c.closePath();finish();
      c.beginPath();ell(50,71,15,13);c.fillStyle='rgba(255,255,255,.28)';c.fill();c.fillStyle='#34213f';c.beginPath();ell(39,35,3.6,4.8);ell(61,35,3.6,4.8);ell(50,44,4,2.5);c.fill();c.beginPath();c.arc(50,44,8,.25,Math.PI-.25);c.strokeStyle='#34213f';c.lineWidth=2.5;c.stroke();gloss(28,19,8,3,-.35);
    }else{
      rr(c,45,55,10,40,4);c.fillStyle='#fff1ce';c.fill();c.lineWidth=3;c.strokeStyle='#43324a';c.stroke();c.beginPath();ell(50,38,35,35);finish();
      c.save();c.beginPath();ell(50,38,31,31);c.clip();c.beginPath();for(var i=0;i<=125;i++){var a=i*.09,rad=i*.235,x=50+Math.cos(a)*rad,y=38+Math.sin(a)*rad;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}c.strokeStyle='rgba(255,250,228,.88)';c.lineWidth=6;c.stroke();c.restore();gloss(31,20,10,4,-.5);
    }
    if(Object.keys(cache).length>=35)cache={};cache[key]=cv;return cv;
  }
  function Renderer(canvas) { this.cv = canvas; this.ctx = canvas.getContext('2d'); this.sparks = []; this.clock = 0; this.waves = []; }
  Renderer.prototype.resize = function (w, h) {
    var dpr = Math.min(2, root.devicePixelRatio || 1), C = SSCore;
    this.cell = Math.floor(Math.min(w / C.COLS, h / C.ROWS)); this.w = this.cell * C.COLS; this.h = this.cell * C.ROWS;
    this.cv.style.width = this.w + 'px'; this.cv.style.height = this.h + 'px';
    this.cv.width = this.w * dpr; this.cv.height = this.h * dpr; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.dpr = dpr; this.ctx.imageSmoothingEnabled = true; cache = {};
  };
  Renderer.prototype.burst = function (cells) {
    var s = this.cell;
    for(var j=0;j<cells.length;j++) this.waves.push({x:(cells[j].c+.5)*s,y:(cells[j].r+.5)*s,t:0,col:COLORS[(cells[j].v-1)%7]});
    if(this.waves.length>96)this.waves.splice(0,this.waves.length-96);
    for (var i = 0; i < cells.length; i++) for (var k = 0; k < 12; k++) { var a = Math.random() * 6.28, sp = 40 + Math.random() * 160;
      this.sparks.push({ x: (cells[i].c + 0.5) * s, y: (cells[i].r + 0.5) * s, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: 0.5 + Math.random() * 0.4, col: COLORS[(cells[i].v - 1) % 7] }); }
    if (this.sparks.length > 600) this.sparks.splice(0, this.sparks.length - 600);
  };
  Renderer.prototype.draw = function (g, dt) {
    var c = this.ctx, s = this.cell, C = SSCore, spr = Math.round(s * this.dpr);
    this.clock += Math.min(dt || 0,.1);
    var bg=c.createLinearGradient(0,0,0,this.h);bg.addColorStop(0,'#233966');bg.addColorStop(.55,'#142b52');bg.addColorStop(1,'#101d40');
    c.fillStyle=bg;c.fillRect(0,0,this.w,this.h);
    for(var yy=0;yy<C.ROWS;yy++)for(var xx=0;xx<C.COLS;xx++){
      c.fillStyle=(xx+yy)%2?'#ffffff08':'#00000012';c.fillRect(xx*s+1,yy*s+1,s-2,s-2);
      c.fillStyle='#9b84e51a';c.fillRect(xx*s+1,yy*s+1,s-2,1);
      c.fillStyle='#05081970';c.fillRect(xx*s,yy*s+s-1,s,1);
    }
    for(var a=0;a<18;a++){var px=(a*73+17)%this.w,py=(a*113+Math.floor(this.clock*(4+a%3)))%this.h;
      c.fillStyle=a%3?'#a69cf52b':'#f9cc8e45';c.fillRect(px,py,2,2);}

    var clearing = {}, ct = 0; if (g.clearing) { ct = g.clearing.t / C.Game.CLEAR_TIME; g.clearing.cells.forEach(function (o) { clearing[o.r * C.COLS + o.c] = 1; }); }
    for (var r = 0; r < C.ROWS; r++) for (var col = 0; col < C.COLS; col++) { var v = g.grid[r][col]; if (!v) continue;
      if (clearing[r * C.COLS + col]) { var k = 1 + ct * 0.4; c.globalAlpha = 1 - ct; c.drawImage(sprite(v, spr), col * s + s * (1 - k) / 2, r * s + s * (1 - k) / 2, s * k, s * k); c.globalAlpha = 1;
        c.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - ct)) + ')'; c.beginPath(); c.arc((col + 0.5) * s, (r + 0.5) * s, s * 0.5 * ct + 2, 0, 7); c.fill(); }
      else c.drawImage(sprite(v, spr), col * s, r * s, s, s); }
    if (g.piece) { var p = g.piece, gy = p.y; while (g.fits(p.x, gy + 1)) gy++;
      c.fillStyle = 'rgba(255,221,135,0.12)'; c.fillRect(p.x * s, Math.max(0, gy) * s, s, (gy + 3 - Math.max(0, gy)) * s); c.strokeStyle = '#ffd789'; c.lineWidth = 2; c.setLineDash([6, 5]); c.strokeRect(p.x * s + 2, Math.max(0, gy) * s + 2, s - 4, (gy + 3 - Math.max(0, gy)) * s - 4); c.setLineDash([]);
      for (var i = 0; i < 3; i++) if (p.y + i >= 0) c.drawImage(sprite(p.cells[i], spr), p.x * s, (p.y + i) * s, s, s); }
    for(var wi=this.waves.length-1;wi>=0;wi--){var wv=this.waves[wi];wv.t+=dt;if(wv.t>.32){this.waves.splice(wi,1);continue;}
      c.globalAlpha=1-wv.t/.32;c.strokeStyle=wv.col;c.lineWidth=2;c.beginPath();c.arc(wv.x,wv.y,s*(.18+wv.t*2.6),0,Math.PI*2);c.stroke();}
    c.globalAlpha=1;
    for (var j = this.sparks.length - 1; j >= 0; j--) { var q = this.sparks[j]; q.t += dt; if (q.t > q.life) { this.sparks.splice(j, 1); continue; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 200 * dt; var a2 = 1 - q.t / q.life, z = Math.ceil(2 + 4 * a2);
      c.globalAlpha = a2; c.fillStyle = j % 3 ? q.col : '#fff'; c.fillRect(Math.round(q.x-z/2),Math.round(q.y),z,2); c.fillRect(Math.round(q.x),Math.round(q.y-z/2),2,z); }
    c.globalAlpha = 1;
  };
  root.SSRender = { Renderer: Renderer, sprite: sprite, COLORS: COLORS, NAMES: NAMES };
})(window);
