import * as T from 'three';
const $=s=>document.querySelector(s);
export function seasonForMonth(month){return month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter'}

// Visual settings stay in memory: the original adventurer save is untouched.
export class Experience {
 constructor(world,data,beforeTour){
  this.world=world;this.data=data;this.beforeTour=beforeTour;this.season=seasonForMonth(new Date().getMonth()+1);this.weather='sunny';this.wind=1;this.lightFactor=1;
  this.seaMaterials=new Map();for(const cloud of world.clouds.filter(c=>c.sea))cloud.g.traverse(o=>{if(o.material?.color)this.seaMaterials.set(o.material,o.material.color.clone())});
  this.makeParticles();this.tour=new IslandTour(world,data,beforeTour);
  $('#season-select').value=this.season;$('#season-select').onchange=e=>this.setSeason(e.target.value);
  $('#weather-select').onchange=e=>this.setWeather(e.target.value);
  $('#tour-start').onclick=()=>this.tour.start();
  this.setSeason(this.season);this.setWeather('sunny');
 }
 makeTexture(kind){
  const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.translate(32,32);
  if(kind==='spring'){x.fillStyle='#ffc3d8';x.beginPath();x.moveTo(0,24);x.bezierCurveTo(-34,0,-17,-31,0,-16);x.bezierCurveTo(17,-31,34,0,0,24);x.fill()}
  if(kind==='autumn'){x.fillStyle='#de8a35';x.beginPath();x.moveTo(0,-29);x.bezierCurveTo(36,-6,25,20,0,27);x.bezierCurveTo(-25,20,-36,-6,0,-29);x.fill();x.strokeStyle='#995427';x.lineWidth=3;x.beginPath();x.moveTo(0,-20);x.lineTo(0,29);x.stroke()}
  if(kind==='winter'){x.strokeStyle='#ffffff';x.lineWidth=4;x.lineCap='round';for(let i=0;i<6;i++){x.save();x.rotate(i*Math.PI/3);x.beginPath();x.moveTo(0,0);x.lineTo(0,-26);x.moveTo(0,-15);x.lineTo(-7,-21);x.moveTo(0,-15);x.lineTo(7,-21);x.stroke();x.restore()}}
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
 }
 makeParticles(){
  this.maps=Object.fromEntries(['spring','autumn','winter'].map(k=>[k,this.makeTexture(k)]));
  this.fallPositions=new Float32Array(180*3);for(let i=0;i<180;i++){this.fallPositions[i*3]=(Math.random()-.5)*110;this.fallPositions[i*3+1]=Math.random()*50-10;this.fallPositions[i*3+2]=(Math.random()-.5)*110}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(this.fallPositions,3));
  this.fall=new T.Points(geo,new T.PointsMaterial({map:this.maps.autumn,size:.8,transparent:true,opacity:.9,alphaTest:.1,depthWrite:false}));this.fall.frustumCulled=false;this.world.scene.add(this.fall);
  this.rainPositions=new Float32Array(640*6);this.rainHeads=new Float32Array(640*3);
  for(let i=0;i<640;i++){this.rainHeads[i*3]=(Math.random()-.5)*120;this.rainHeads[i*3+1]=Math.random()*65-15;this.rainHeads[i*3+2]=(Math.random()-.5)*120}
  const rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.BufferAttribute(this.rainPositions,3));
  this.rain=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:0xc6e5ed,transparent:true,opacity:.42,depthWrite:false}));this.rain.frustumCulled=false;this.world.scene.add(this.rain);
  this.resize=()=>this.syncMotion();window.addEventListener('resize',this.resize);
 }
 setSeason(value){if(!['spring','summer','autumn','winter'].includes(value))return;this.season=value;$('#season-select').value=value;this.fall.material.map=this.maps[value]||null;this.fall.material.needsUpdate=true;this.fall.material.size=value==='winter'?.65:.8;this.updateClimate();this.syncMotion()}
 setWeather(value){if(!['sunny','rain','typhoon'].includes(value))return;this.weather=value;$('#weather-select').value=value;this.wind=value==='typhoon'?4:value==='rain'?1.6:1;
  $('#typhoon-banner').hidden=value!=='typhoon';document.body.classList.toggle('typhoon',value==='typhoon');
  for(const m of this.world.moving.filter(m=>m.type==='balloon')){m.mesh.visible=value!=='typhoon';if(value==='typhoon')m.mesh.position.y=m.base}
  for(const [mat,base]of this.seaMaterials)mat.color.copy(base).multiplyScalar(value==='typhoon'?.42:value==='rain'?.68:1);
  this.updateClimate();this.syncMotion();
 }
 updateClimate(){this.lightFactor=(this.season==='summer'?1.18:1)*(this.weather==='typhoon'?.5:this.weather==='rain'?.74:1);this.skyFactor=this.weather==='typhoon'?.58:this.weather==='rain'?.8:1}
 syncMotion(){const half=innerWidth<600?2:1;this.fallCount=this.season==='summer'?0:180/half;this.rainCount=this.weather==='sunny'?0:(this.weather==='typhoon'?640:320)/half;
  this.fall.geometry.setDrawRange(0,this.fallCount);this.rain.geometry.setDrawRange(0,this.rainCount*2);
  this.fall.visible=!this.world.reduced&&this.fallCount>0;this.rain.visible=!this.world.reduced&&this.rainCount>0;
 }
 tick(dt){
  if(this.world.reduced)return;
  const center=this.world.controls.target;this.fall.position.set(center.x,0,center.z);this.rain.position.set(center.x,0,center.z);
  if(this.fall.visible){for(let i=0;i<this.fallCount;i++){const j=i*3;this.fallPositions[j]+=dt*(Math.sin(this.world.time+i)*.7+this.wind*.65);this.fallPositions[j+1]-=dt*(this.season==='winter'?1.6:2.4);if(this.fallPositions[j+1]<-15)this.fallPositions[j+1]=40;if(this.fallPositions[j]>55)this.fallPositions[j]=-55}this.fall.geometry.attributes.position.needsUpdate=true}
  if(this.rain.visible){const storm=this.weather==='typhoon',speed=storm?38:23,slant=storm?2.4:.25,length=storm?2.4:1.3;for(let i=0;i<this.rainCount;i++){const j=i*3,k=i*6;this.rainHeads[j]+=dt*(storm?19:3);this.rainHeads[j+1]-=dt*speed;if(this.rainHeads[j+1]<-18)this.rainHeads[j+1]=47;if(this.rainHeads[j]>60)this.rainHeads[j]=-60;this.rainPositions[k]=this.rainHeads[j];this.rainPositions[k+1]=this.rainHeads[j+1];this.rainPositions[k+2]=this.rainHeads[j+2];this.rainPositions[k+3]=this.rainHeads[j]-slant;this.rainPositions[k+4]=this.rainHeads[j+1]+length;this.rainPositions[k+5]=this.rainHeads[j+2]}this.rain.geometry.attributes.position.needsUpdate=true}
 }
 diagnostics(){return {season:this.season,weather:this.weather,fallCount:this.fallCount,rainCount:this.rainCount,fallVisible:this.fall.visible,rainVisible:this.rain.visible,wind:this.wind,lightFactor:this.lightFactor,balloonsFlying:this.world.moving.filter(m=>m.type==='balloon'&&m.mesh.visible).length,tour:this.tour.status()}}
}

class IslandTour {
 constructor(world,data,beforeTour){this.world=world;this.beforeTour=beforeTour;this.stops=[{id:'center',name:data.centerIsland.name,intro:data.centerIsland.description},...data.islands];this.active=false;this.paused=false;this.index=0;this.ticket=0;
  $('#tour-pause').onclick=()=>this.togglePause();$('#tour-prev').onclick=()=>this.step(-1);$('#tour-next').onclick=()=>this.step(1);$('#tour-close').onclick=()=>this.close();
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.pause()});
  document.addEventListener('keydown',e=>{if(this.active&&e.key==='Escape'){e.preventDefault();this.close()}});
 }
 status(){return {active:this.active,paused:this.paused,index:this.index,total:this.stops.length,traveling:!!this.world.film?.tour}}
 start(){if(this.active)return;this.beforeTour();this.active=true;this.paused=false;this.savedFocus=this.world.focused;this.savedCamera=this.world.camera.position.clone();this.savedTarget=this.world.controls.target.clone();this.savedPlayerPath=this.world.playerPath;this.world.playerPath=null;this.world.keys.clear();document.body.classList.add('touring');$('#tour-card').hidden=false;$('#skip-film').hidden=true;this.index=0;this.visit();$('#tour-pause').focus()}
 clearFlight(){clearTimeout(this.timer);this.timer=null;if(this.world.film?.tour){const film=this.world.film;this.world.film=null;this.world.controls.enabled=true;this.world.hooks.onFilm(false);film.resolve()}}
 render(){const s=this.stops[this.index];$('#tour-station').textContent=`第 ${this.index+1} 站／共 ${this.stops.length} 站`;$('#tour-name').textContent=s.name;$('#tour-intro').textContent=s.intro;$('#tour-pause').textContent=this.paused?'繼續導覽':'暫停';$('#tour-pause').setAttribute('aria-pressed',String(this.paused));$('#tour-prev').disabled=this.index===0;$('#tour-next').disabled=this.index===this.stops.length-1}
 async visit(){const ticket=++this.ticket;this.clearFlight();this.render();const island=this.world.islands.find(s=>s.id===this.stops[this.index].id);this.world.skip();this.world.focused=island.id;const target=island.pos.clone(),end=target.clone().add(new T.Vector3(12,13,17));
  if(this.world.reduced){this.world.camera.position.copy(end);this.world.controls.target.copy(target);this.world.controls.update()}
  else{const promise=this.world.animateCamera([this.world.camera.position.clone(),this.world.camera.position.clone().lerp(end,.5).add(new T.Vector3(0,8,0)),end],this.world.controls.target.clone(),target,.8);this.world.film.tour=true;this.world.film.paused=this.paused;$('#skip-film').hidden=true;await promise}
  if(!this.active||ticket!==this.ticket)return;this.remaining=4500;if(!this.paused)this.schedule();
 }
 schedule(){if(!this.active||this.paused)return;if(this.index===this.stops.length-1){this.paused=true;this.render();return}this.due=performance.now()+this.remaining;this.timer=setTimeout(()=>{this.index++;this.visit()},this.remaining)}
 pause(){if(!this.active||this.paused)return;this.paused=true;if(this.world.film?.tour)this.world.film.paused=true;if(this.timer){this.remaining=Math.max(0,this.due-performance.now());clearTimeout(this.timer);this.timer=null}this.render()}
 togglePause(){if(!this.active)return;if(!this.paused){this.pause();return}this.paused=false;this.render();if(this.world.film?.tour)this.world.film.paused=false;else if(this.index===this.stops.length-1){this.index=0;this.visit()}else this.schedule()}
 step(direction){if(!this.active)return;this.index=Math.max(0,Math.min(this.stops.length-1,this.index+direction));this.visit()}
 close(restore=true){if(!this.active)return;this.ticket++;this.clearFlight();this.active=false;this.paused=false;this.world.focused=this.savedFocus;this.world.playerPath=this.savedPlayerPath;$('#tour-card').hidden=true;document.body.classList.remove('touring');if(restore){this.world.camera.position.copy(this.savedCamera);this.world.controls.target.copy(this.savedTarget);this.world.controls.update();$('#tour-start').focus()}}
}
