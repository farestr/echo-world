import * as THREE from 'three';
import './style.css';

const app = document.querySelector('#app');
app.innerHTML = `
<div id="menu" class="screen"><div class="grain"></div><div class="brand"><span class="sigil">◇</span><div><b>ECHO WORLD</b><small>CO-OP ADVENTURE PROTOCOL</small></div></div><div class="hero"><div class="eyebrow">CHAPTER I · THE WILDS</div><h1>Two hearts.<br><em>One journey.</em></h1><p>A cinematic co-op adventure built around movement, trust and impossible places.</p><div class="card"><label>YOUR CALLSIGN</label><input id="name" maxlength="16" placeholder="PLAYER" value="PLAYER"><div class="actions"><button id="create">CREATE JOURNEY</button><button id="join">JOIN JOURNEY</button></div><div id="joinBox" class="joinbox hidden"><input id="room" maxlength="6" placeholder="ROOM CODE"><button id="joinConfirm">ENTER</button></div><div id="status" class="status">Choose your path.</div></div></div><div class="side-art"><div class="orb orb1"></div><div class="orb orb2"></div><div class="mountain"></div><div class="spark s1"></div><div class="spark s2"></div><div class="spark s3"></div></div><div class="controls-note">WASD MOVE · SPACE JUMP · SHIFT DASH · Q ABILITY · E INTERACT</div></div>
<div id="hud" class="hidden"><div class="top"><div class="brand mini"><span class="sigil">◇</span><div><b>ECHO WORLD</b><small>THE WILDS</small></div></div><div class="objective"><span>OBJECTIVE</span><b id="objective">REACH THE ANCIENT GATE</b></div><div class="roomtag">ROOM <b id="roomCode">------</b></div></div><div class="bottom"><div class="ability"><span id="roleName">FORCE</span><b id="abilityName">GROUND PULSE</b><small>Q</small></div><div class="hint">Stay close. Your partner changes the world.</div></div><div id="toast"></div></div>
<div id="startOverlay" class="hidden"><div><span>THE WILDS</span><h2>SYNCED.</h2><p>Your partner has entered the world.</p><button id="begin">BEGIN CHAPTER</button></div></div>
<div id="fade"></div>`;

const $=s=>document.querySelector(s); const menu=$('#menu'), hud=$('#hud'), startOverlay=$('#startOverlay');
let ws, myId, role, roomCode, started=false, peer=null;
const keys=new Set(); window.addEventListener('keydown',e=>{ if(['Space','ShiftLeft','ShiftRight'].includes(e.code)) e.preventDefault(); keys.add(e.code); if(e.code==='KeyQ') ability(); if(e.code==='KeyE') interact(); }); window.addEventListener('keyup',e=>keys.delete(e.code));
function socket(){ ws=new WebSocket(location.origin.replace(/^http/,'ws')); ws.onopen=()=>setStatus('Link established.'); ws.onclose=()=>setStatus('Connection lost — refresh to reconnect.'); ws.onerror=()=>setStatus('Network error.'); ws.onmessage=e=>handle(JSON.parse(e.data)); }
function send(o){ if(ws?.readyState===1) ws.send(JSON.stringify(o)); }
function setStatus(t){ $('#status').textContent=t; }
function create(){ if(!ws||ws.readyState!==1) socket(); setTimeout(()=>send({type:'create',name:$('#name').value||'PLAYER'}),180); }
function join(){ $('#joinBox').classList.remove('hidden'); $('#room').focus(); }
function confirmJoin(){ if(!ws||ws.readyState!==1) socket(); const r=$('#room').value.trim(); if(r) setTimeout(()=>send({type:'join',room:r,name:$('#name').value||'PLAYER'}),180); }
$('#create').onclick=create; $('#join').onclick=join; $('#joinConfirm').onclick=confirmJoin;
function handle(m){
 if(m.type==='joined'){ myId=m.id; role=m.role; roomCode=m.room; $('#roomCode').textContent=roomCode; menu.classList.add('hidden'); hud.classList.remove('hidden'); roleUI(); toast(`ROOM ${roomCode} · Share the code with your partner`); }
 if(m.type==='state'){ for(const p of m.players){ if(p.id!==myId){ peer=p; } } if(m.players.length===2) { startOverlay.classList.remove('hidden'); } }
 if(m.type==='started'){ started=true; startOverlay.classList.add('hidden'); toast('Chapter started. Reach the Ancient Gate.'); }
 if(m.type==='peer'){ peer=m; }
 if(m.type==='left'){ peer=null; toast('Your partner left the journey.'); }
 if(m.type==='error') setStatus(m.message);
 if(m.type==='event' && m.event==='gate') objectiveDone=true;
}
function roleUI(){ const force=role==='force'; $('#roleName').textContent=force?'FORCE':'FLOW'; $('#abilityName').textContent=force?'GROUND PULSE':'AIRSTREAM'; }
$('#begin').onclick=()=>send({type:'start'});
function toast(t){ const el=$('#toast'); el.textContent=t; el.classList.add('show'); clearTimeout(window.__t); window.__t=setTimeout(()=>el.classList.remove('show'),2600); }
let objectiveDone=false; function ability(){ if(!started) return; send({type:'event',event:role==='force'?'pulse':'gust'}); toast(role==='force'?'GROUND PULSE — the world trembles.':'AIRSTREAM — ride the current.'); }
function interact(){ if(!started) return; const d=player.position.distanceTo(new THREE.Vector3(0,0,-44)); if(d<7){ send({type:'event',event:'gate'}); objectiveDone=true; toast('The Ancient Gate responds. Keep moving.'); } }

// --- World ---
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x061017); scene.fog=new THREE.FogExp2(0x061017,.018);
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,500); camera.position.set(0,5,12);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.2; renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.domElement.id='game'; document.body.appendChild(renderer.domElement);
const hemi=new THREE.HemisphereLight(0x91b7c7,0x07100b,2.0); scene.add(hemi); const moon=new THREE.DirectionalLight(0xd9ecff,3.2); moon.position.set(-30,40,15); moon.castShadow=true; moon.shadow.mapSize.set(2048,2048); moon.shadow.camera.left=-60;moon.shadow.camera.right=60;moon.shadow.camera.top=60;moon.shadow.camera.bottom=-60;scene.add(moon);
const fill=new THREE.PointLight(0x54d7c8,10,28); fill.position.set(0,5,-22); scene.add(fill);
const matGround=new THREE.MeshStandardMaterial({color:0x14241f,roughness:.96}); const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180),matGround); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
function box(w,h,d,c,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c,roughness:.75,metalness:.1}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;scene.add(m);return m;}
function tree(x,z,s=1){const trunk=box(.8*s,4*s,.8*s,0x3c2920,x,2*s,z); const crown=new THREE.Mesh(new THREE.DodecahedronGeometry(2.8*s,1),new THREE.MeshStandardMaterial({color:0x173c34,roughness:1})); crown.position.set(x,5*s,z); crown.castShadow=true; scene.add(crown); const crown2=crown.clone(); crown2.scale.set(.72,.7,.72); crown2.position.y+=2*s; crown2.material=crown.material.clone(); crown2.material.color.set(0x245448);scene.add(crown2);}
for(let i=0;i<80;i++){const x=(Math.random()-.5)*120,z= -Math.random()*130+30; if(Math.abs(x)<10 && z<5) continue; tree(x,z,.65+Math.random()*.8);}
// ancient gate
box(2,10,2,0x28333a,-6,5,-46); box(2,10,2,0x28333a,6,5,-46); box(14,2,2,0x36464b,0,10,-46); const gateGlow=new THREE.Mesh(new THREE.TorusGeometry(3,0.22,16,64),new THREE.MeshStandardMaterial({color:0x66e8d1,emissive:0x1cc7a8,emissiveIntensity:4}));gateGlow.rotation.x=Math.PI/2;gateGlow.position.set(0,5,-45);scene.add(gateGlow);
// crystals
for(let i=0;i<18;i++){const c=new THREE.Mesh(new THREE.ConeGeometry(.35+Math.random()*.4,1.5+Math.random()*2,6),new THREE.MeshStandardMaterial({color:0x4a8e9a,emissive:0x143f46,emissiveIntensity:2,roughness:.25}));c.position.set((Math.random()-.5)*45,1, -10-Math.random()*55);c.rotation.z=Math.random();scene.add(c);}
function makePlayer(color,accent){const g=new THREE.Group(); const body=new THREE.Mesh(new THREE.CapsuleGeometry(.62,1.35,8,16),new THREE.MeshStandardMaterial({color,roughness:.42,metalness:.1}));body.position.y=1.25;body.castShadow=true;g.add(body);const core=new THREE.Mesh(new THREE.SphereGeometry(.25,24,24),new THREE.MeshStandardMaterial({color:accent,emissive:accent,emissiveIntensity:5}));core.position.set(0,1.45,.55);g.add(core);const ring=new THREE.Mesh(new THREE.TorusGeometry(.9,.055,8,32),new THREE.MeshStandardMaterial({color:accent,emissive:accent,emissiveIntensity:3}));ring.rotation.x=Math.PI/2;ring.position.y=.1;g.add(ring);scene.add(g);return g;}
const player=makePlayer(0xdda95a,0x74f3d3); player.position.set(-2,0,2);
let peerObj=makePlayer(0x5e9fe8,0xd8f07b); peerObj.visible=false;
const vel=new THREE.Vector3(); let grounded=true; let last=performance.now(); let lastNet=0; let dash=0;
function physics(dt){const speed=7.2; const dir=new THREE.Vector3((keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),0,(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0)); if(dir.lengthSq())dir.normalize(); const boost=keys.has('ShiftLeft')||keys.has('ShiftRight'); const target=speed*(boost?1.75:1); vel.x=THREE.MathUtils.damp(vel.x,dir.x*target,12,dt);vel.z=THREE.MathUtils.damp(vel.z,dir.z*target,12,dt); if(dir.lengthSq())player.rotation.y=Math.atan2(dir.x,dir.z); if(keys.has('Space')&&grounded){vel.y=9.5;grounded=false;} vel.y-=24*dt; player.position.addScaledVector(vel,dt); if(player.position.y<0){player.position.y=0;vel.y=0;grounded=true;} player.position.x=THREE.MathUtils.clamp(player.position.x,-35,35); player.position.z=THREE.MathUtils.clamp(player.position.z,-105,10); dash=Math.max(0,dash-dt); }
function updatePeer(){if(!peer)return;peerObj.visible=true;peerObj.position.lerp(new THREE.Vector3(peer.x,peer.y,peer.z),.35);peerObj.rotation.y=peer.ry||0;}
function animate(){requestAnimationFrame(animate);const now=performance.now();const dt=Math.min(.033,(now-last)/1000);last=now;if(started){physics(dt);updatePeer();if(now-lastNet>50){send({type:'move',x:player.position.x,y:player.position.y,z:player.position.z,ry:player.rotation.y});lastNet=now;} camera.position.lerp(new THREE.Vector3(player.position.x,player.position.y+6.5,player.position.z+11),.06);camera.lookAt(player.position.x,player.position.y+1,player.position.z-4);} else {camera.position.lerp(new THREE.Vector3(0,4,14),.025);camera.lookAt(0,3,-12);} gateGlow.rotation.z+=dt*.6; renderer.render(scene,camera);}
animate();
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
