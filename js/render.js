// Candy sprites + board rendering (Canvas, hand-rasterised 16-bit arcade sprites).
(function (root) {
  'use strict';
  // GMOB palette (gmobai.in): flat cartoon fills with thick ink outlines.
  var COLORS = ['#FF3C00', '#f59e0b', '#a3e635', '#00e5a0', '#3b9eff', '#a855f7', '#ec4899'];
  var NAMES = ['Blaze Bean', 'Amber Bear', 'Lime Pop', 'Mint Bean', 'Sky Bear', 'Grape Pop', 'Bubblegum Bean'];
  var SHAPES = ['bean', 'bear', 'pop', 'bean', 'bear', 'pop', 'bean'];
  var INK = '#111', cache = {};
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  // Hand-rasterised 32px sprite art: seven colour ramps, distinct silhouettes.
  var RAMPS = [
    ['#35132c','#7b2038','#c83b35','#ff7240','#ffa85b','#fff0a3'],
    ['#352132','#815021','#c98724','#ffbc42','#ffe481','#fff5ca'],
    ['#173b31','#387235','#71ac36','#b8df55','#e6ff92','#f8ffe1'],
    ['#103541','#176e64','#1ab28b','#58e4a7','#a1ffcf','#effff4'],
    ['#192b55','#28539a','#368bd5','#67c9ff','#b0eeff','#f4fdff'],
    ['#321b57','#67349e','#9a52d6','#c68aff','#ebc2ff','#fff0ff'],
    ['#4c1e4b','#9b3769','#d85895','#ff89c3','#ffc1dc','#fff3f9']
  ];
  function sprite(v,s) {
    var key=v+':'+s; if(cache[key])return cache[key];
    var cv=document.createElement('canvas'); cv.width=cv.height=s;
    var c=cv.getContext('2d'), tile=document.createElement('canvas');tile.width=tile.height=32;
    var t=tile.getContext('2d'), ramp=RAMPS[(v-1)%7], kind=SHAPES[(v-1)%7];
    function ellipse(x,y,cx,cy,rx,ry){return ((x-cx)/rx)**2+((y-cy)/ry)**2<=1;}
    function candy(x,y){
      if(kind==='bean'){var a=(x-16)*.94-(y-15)*.342,b=(x-16)*.342+(y-15)*.94;
        return (a*a/172+b*b/84)<=1;}
      if(kind==='bear')return ellipse(x,y,9,6,4,4)||ellipse(x,y,23,6,4,4)||ellipse(x,y,16,12,9,8)||ellipse(x,y,16,22,10,8)||ellipse(x,y,8,26,4,4)||ellipse(x,y,24,26,4,4);
      return ellipse(x,y,16,12,11,11);
    }
    function px(x,y,col){t.fillStyle=col;t.fillRect(x,y,1,1);}
    if(kind==='pop'){
      t.fillStyle='#37274c';t.fillRect(13,18,6,13);
      t.fillStyle='#d5b9ad';t.fillRect(14,19,4,11);t.fillStyle='#fff2d0';t.fillRect(14,19,1,10);
    }
    for(var y=0;y<32;y++)for(var x=0;x<32;x++)if(candy(x,y)){
      if(!candy(x-1,y)||!candy(x+1,y)||!candy(x,y-1)||!candy(x,y+1)){px(x,y,ramp[0]);continue;}
      var light=0.8*(16-y)+0.44*(16-x);
      var shade=light>10?5:light>5?4:light>-1?3:light>-7?2:1;
      if((x+y)%2===0&&(Math.abs(light-5)<1||Math.abs(light+1)<1))shade=Math.min(5,shade+1);
      if(kind==='pop'){
        var dx=x-16,dy=y-12,rad=Math.hypot(dx,dy);
        if(rad<9&&Math.cos(Math.atan2(dy,dx)*2.2-rad*.74)>.64)px(x,y,shade>2?'#fff3d8':'#dcb7cf');
        else px(x,y,ramp[shade]);
      }else px(x,y,ramp[shade]);
    }
    // Crisp glints and surface details, never changing hitboxes.
    t.fillStyle=ramp[5];t.fillRect(9,9,4,2);t.fillRect(8,11,2,2);
    if(kind==='bean'){t.fillRect(13,7,3,1);t.fillStyle=ramp[2];t.fillRect(19,21,4,1);}
    if(kind==='bear'){
      t.fillStyle=ramp[0];t.fillRect(11,12,2,3);t.fillRect(19,12,2,3);t.fillRect(15,16,2,1);t.fillRect(14,18,4,1);
      t.fillStyle=ramp[4];t.fillRect(13,22,6,3);t.fillRect(14,21,4,1);
    }
    c.imageSmoothingEnabled=false;c.drawImage(tile,0,0,s,s);cache[key]=cv;return cv;
  }
  function Renderer(canvas) { this.cv = canvas; this.ctx = canvas.getContext('2d'); this.sparks = []; this.clock = 0; this.waves = []; }
  Renderer.prototype.resize = function (w, h) {
    var dpr = Math.min(2, root.devicePixelRatio || 1), C = SSCore;
    this.cell = Math.floor(Math.min(w / C.COLS, h / C.ROWS)); this.w = this.cell * C.COLS; this.h = this.cell * C.ROWS;
    this.cv.style.width = this.w + 'px'; this.cv.style.height = this.h + 'px';
    this.cv.width = this.w * dpr; this.cv.height = this.h * dpr; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.dpr = dpr; this.ctx.imageSmoothingEnabled = false; cache = {};
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
    var bg=c.createLinearGradient(0,0,0,this.h);bg.addColorStop(0,'#271644');bg.addColorStop(.55,'#111b3c');bg.addColorStop(1,'#090e24');
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
