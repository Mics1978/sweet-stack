/* Sweet Stack: original arcade audio, generated locally via Web Audio. */
(function () {
'use strict';
var ctx, musicBus, fxBus, timer, next=0, step=0, voices=[], lastMove=0;
var mode='menu', music=true, sound=true;
try { var p=JSON.parse(localStorage.getItem('ss-audio-v1')||'{}'); music=p.music!==false; sound=p.sound!==false; } catch(e){}
var themes={
menu:{bpm:116, chords:[60,57,65,67], lead:[72,76,79,76,74,72,69,67,72,76,81,79,76,74,72,0]},
infinite:{bpm:132,chords:[60,65,57,67],lead:[76,79,84,79,76,74,72,0,77,81,84,81,79,76,74,0]},
timerun:{bpm:150,chords:[62,58,65,60],lead:[77,81,86,84,81,77,74,77,77,82,86,82,81,79,77,0]},
secret:{bpm:144,chords:[69,65,62,67],lead:[81,84,88,84,79,81,76,0,77,81,84,81,79,74,76,0]}
};
function save(){try{localStorage.setItem('ss-audio-v1',JSON.stringify({music:music,sound:sound}));}catch(e){}}
function gain(bus,on,vol){if(ctx&&bus){bus.gain.cancelScheduledValues(ctx.currentTime);bus.gain.setTargetAtTime(on?vol:0,ctx.currentTime,.025);}}
function unlock(){
 if(!ctx){var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;try{ctx=new AC();musicBus=ctx.createGain();fxBus=ctx.createGain();musicBus.gain.value=music?.22:0;fxBus.gain.value=sound?.32:0;var limiter=ctx.createDynamicsCompressor();musicBus.connect(limiter);fxBus.connect(limiter);limiter.connect(ctx.destination);}catch(e){ctx=null;return;}}
 if(ctx.state==='suspended'||ctx.state==='interrupted'){try{var r=ctx.resume();if(r&&r.catch)r.catch(function(){});}catch(e){}}
 if(!timer){next=ctx.currentTime+.04;timer=setInterval(tick,45);}
}
function note(m,t,d,shape,v,bus,endMidi){
 if(!ctx||!bus||!m)return;
 var o=ctx.createOscillator(),g=ctx.createGain(),f=function(n){return 440*Math.pow(2,(n-69)/12);};
 o.type=shape;o.frequency.setValueAtTime(f(m),t);if(endMidi)o.frequency.exponentialRampToValueAtTime(f(endMidi),t+d*.8);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);
 o.connect(g);g.connect(bus);o.start(t);o.stop(t+d+.015);
 var rec={o:o,bus:bus};voices.push(rec);o.onended=function(){var i=voices.indexOf(rec);if(i>=0)voices.splice(i,1);o.disconnect();g.disconnect();};
}
function stopMusic(){voices.slice().forEach(function(v){if(v.bus===musicBus){try{v.o.stop();}catch(e){}}});}
function tick(){
 if(!ctx||ctx.state!=='running'||document.hidden)return;
 var th=themes[mode];if(!th||!music)return;
 var dur=60/th.bpm/4, now=ctx.currentTime;if(next<now)next=now+.025;
 while(next<now+.12){var s=step%64,b=s%16,root=th.chords[Math.floor(s/16)],minor=(root===57||root===62||root===69);
 var mel=th.lead[(b+Math.floor(s/16)*4)%16];
 if(mel)note(mel+(s>=32&&b===14?12:0),next,dur*.78,'square',.075,musicBus);
 if(b%4===0||b%4===3)note(root-24+(b%4===3?7:0),next,dur*1.6,'triangle',.21,musicBus);
 if(b%2===0)note(root+[0,minor?3:4,7,12][(b/2)%4],next,dur*.65,'sine',.09,musicBus);
 if(b%4===0)note(40,next,.085,'sine',.22,musicBus,25);
 if(b%4===2)note(98,next,.025,'triangle',.035,musicBus,84);
 if(b===4||b===12)note(56,next,.055,'triangle',.09,musicBus,43);
 step++;next+=dur;}
}
function setMode(m){if(m===mode)return;mode=m;step=0;stopMusic();if(ctx)next=ctx.currentTime+.035;}
function fx(k,n){
 if(!ctx||ctx.state!=='running'||!sound||document.hidden)return;
 var t=ctx.currentTime+.005;
 function a(m,offset,d,shape,v,end){note(m,t+offset,d,shape,v,fxBus,end);}
 switch(k){
 case 'move':if(t-lastMove<.075)return;lastMove=t;a(78,0,.035,'square',.065,75);break;
 case 'rotate':a(79,0,.045,'triangle',.17,86);break;
 case 'drop':a(55,0,.11,'triangle',.24,31);a(84,0,.04,'square',.07,63);break;
 case 'clear':var chain=Math.max(1,Math.min(6,n||1));[0,4,7,12].forEach(function(x,i){a(72+x+(chain-1)*2,i*.038,.13,'triangle',.20);});if(chain>1)a(96,0,.2,'sine',.11,108);break;
 case 'level':case 'win':case 'cabinet':(k==='win'?[72,76,79,84,88,91]:k==='cabinet'?[69,72,76,81,88]:[72,76,79,84]).forEach(function(m,i){a(m,i*.075,.22,'square',.10);a(m-12,i*.075,.18,'triangle',.13);});break;
 case 'gameover':[72,70,67,60].forEach(function(m,i){a(m,i*.11,.21,'triangle',.18);});break;
 default:a(84,0,.055,'triangle',.10,79);
 }
}
function labels(){document.querySelectorAll('[data-ss-audio]').forEach(function(b){var isMusic=b.dataset.ssAudio==='music',on=isMusic?music:sound;b.textContent=(isMusic?'Music':'SFX')+': '+(on?'ON':'OFF');b.setAttribute('aria-pressed',String(on));});}
function toggle(k){unlock();if(k==='music'){music=!music;gain(musicBus,music,.22);if(!music)stopMusic();else if(ctx){next=ctx.currentTime+.03;step=0;}}else{sound=!sound;gain(fxBus,sound,.32);}save();labels();if(sound)fx('click');}
document.addEventListener('pointerdown',unlock,{passive:true});
document.addEventListener('keydown',unlock);
document.addEventListener('visibilitychange',function(){if(document.hidden){stopMusic();if(ctx){var r=ctx.suspend();if(r&&r.catch)r.catch(function(){});}}else if(ctx){next=ctx.currentTime+.03;unlock();}});
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-ss-audio]');if(b){toggle(b.dataset.ssAudio);return;}if(e.target.closest&&e.target.closest('button'))fx('click');});
window.SSAudio={mode:setMode,fx:fx,labels:labels};labels();
})();