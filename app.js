"use strict";

/* -----------------------------
   Canvas Setup
----------------------------- */

const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");

let width, height;
let dpr = window.devicePixelRatio || 1;

function resize() {
width = window.innerWidth;
height = window.innerHeight;

canvas.width = width * dpr;
canvas.height = height * dpr;

canvas.style.width = width + "px";
canvas.style.height = height + "px";

ctx.setTransform(dpr,0,0,dpr,0,0);
}

window.addEventListener("resize", resize);
resize();


/* -----------------------------
   Global State
----------------------------- */

const state = {
particles:[],
glyphs:[],
theme:"space",
sound:true,
lastInput:performance.now(),
idle:true
};


/* -----------------------------
   Themes
----------------------------- */

const THEMES = {

space:{
bg:"#070d1a",
colors:["#b4c9ff","#8fb0ff","#d7e2ff","#8ce2ff","#f0ddff"],
gravity:5
},

confetti:{
bg:"#1d293a",
colors:["#ffd166","#06d6a0","#4cc9f0","#f28482","#f7b267"],
gravity:70
},

bubbles:{
bg:"#13344b",
colors:["#8ad9ff","#6ec7ff","#d0f0ff","#a8dcff","#7bc8f6"],
gravity:-8
}

};


/* -----------------------------
   Utility
----------------------------- */

function rand(min,max){
return Math.random()*(max-min)+min;
}

function pick(arr){
return arr[Math.floor(Math.random()*arr.length)];
}


/* -----------------------------
   Audio Engine
----------------------------- */

let audioCtx;

function ensureAudio(){
if(!state.sound) return;

if(!audioCtx)
audioCtx = new AudioContext();
}

function playTone(){

if(!state.sound) return;

ensureAudio();

const osc = audioCtx.createOscillator();
const gain = audioCtx.createGain();

osc.type="sine";
osc.frequency.value = 200 + Math.random()*800;

gain.gain.value = 0.04;

osc.connect(gain);
gain.connect(audioCtx.destination);

osc.start();
osc.stop(audioCtx.currentTime + 0.2);
}


/* -----------------------------
   Particle System
----------------------------- */

function spawnBurst(x,y){

const theme = THEMES[state.theme];

for(let i=0;i<20;i++){

state.particles.push({

x:x,
y:y,

vx:rand(-150,150),
vy:rand(-150,150),

size:rand(3,8),

life:rand(0.6,1.5),
age:0,

color:pick(theme.colors)

});

}

playTone();
}


/* -----------------------------
   Emoji / Letter Glyphs
----------------------------- */

const EMOJIS=["⭐","🎈","🚀","🐳","🌈","✨","🫧"];

function spawnGlyph(x,y,key){

let text;

if(/^[a-z0-9]$/i.test(key))
text = key.toUpperCase();
else
text = pick(EMOJIS);

state.glyphs.push({

x:x,
y:y,

vx:rand(-40,40),
vy:rand(-80,-40),

life:1.2,
age:0,

size:rand(50,90),

text:text

});

}


/* -----------------------------
   Input Handlers
----------------------------- */

function pointerSpawn(x,y){

spawnBurst(x,y);
spawnGlyph(x,y,"");

state.lastInput = performance.now();

}

canvas.addEventListener("pointerdown",e=>{

pointerSpawn(e.clientX,e.clientY);

});


document.addEventListener("keydown",e=>{

const x = rand(0,width);
const y = rand(0,height);

spawnBurst(x,y);
spawnGlyph(x,y,e.key);

state.lastInput = performance.now();

});


/* -----------------------------
   Fullscreen
----------------------------- */

function enterFullscreen(){

const el = document.documentElement;

if(!document.fullscreenElement){
el.requestFullscreen?.();
}

}

document.addEventListener("pointerdown",enterFullscreen);


/* -----------------------------
   Idle Demo
----------------------------- */

const IDLE_START = 3000;

function updateIdle(){

if(!state.idle) return;

if(performance.now() - state.lastInput > IDLE_START){

spawnBurst(rand(0,width),rand(0,height));

}

}


/* -----------------------------
   Update Physics
----------------------------- */

function updateObjects(dt){

const gravity = THEMES[state.theme].gravity;

for(let i=state.particles.length-1;i>=0;i--){

const p = state.particles[i];

p.age+=dt;

p.vy+=gravity*dt;

p.x+=p.vx*dt;
p.y+=p.vy*dt;

if(p.age>p.life)
state.particles.splice(i,1);

}

for(let i=state.glyphs.length-1;i>=0;i--){

const g = state.glyphs[i];

g.age+=dt;

g.x+=g.vx*dt;
g.y+=g.vy*dt;

g.vy+=20*dt;

if(g.age>g.life)
state.glyphs.splice(i,1);

}

}


/* -----------------------------
   Render
----------------------------- */

function drawBackground(){

ctx.fillStyle = THEMES[state.theme].bg;
ctx.fillRect(0,0,width,height);

}


function drawParticles(){

for(const p of state.particles){

const fade = 1-(p.age/p.life);

ctx.beginPath();

ctx.fillStyle = p.color;
ctx.globalAlpha = fade;

ctx.arc(p.x,p.y,p.size,0,Math.PI*2);

ctx.fill();

ctx.globalAlpha = 1;

}

}


function drawGlyphs(){

for(const g of state.glyphs){

const fade = 1-(g.age/g.life);

ctx.globalAlpha = fade;

ctx.font = g.size+"px serif";

ctx.fillStyle="#ffffff";

ctx.fillText(g.text,g.x,g.y);

ctx.globalAlpha=1;

}

}


/* -----------------------------
   Main Loop
----------------------------- */

let last = performance.now();

function tick(now){

const dt = (now-last)/1000;
last = now;

updateIdle();

updateObjects(dt);

drawBackground();
drawParticles();
drawGlyphs();

requestAnimationFrame(tick);

}

requestAnimationFrame(tick);


/* -----------------------------
   UI Controls
----------------------------- */

const themeSelect = document.getElementById("theme");
const soundToggle = document.getElementById("soundToggle");

if(themeSelect){

themeSelect.value = state.theme;

themeSelect.onchange = e=>{
state.theme = e.target.value;
};

}

if(soundToggle){

soundToggle.onclick = ()=>{
state.sound = !state.sound;
};

}
