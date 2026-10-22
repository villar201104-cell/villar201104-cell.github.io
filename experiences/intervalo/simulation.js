import {reachHuman,walkHuman} from './shared-3d/human-motion.js';
import {createCrewDialogue} from './crew-dialogue.js';
import {bindActivation} from './control-input.js';
import {createCameraMotion} from './camera-motion.js';
import {caption} from './storytelling.js';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createStation,createCar,createPerson,createProduct} from './assets.js';
import {upgradeEnvironment} from './environment.js';
import {applyDaylight,loadSharedModels,batchStaticMeshes,createImportedCar} from './shared-3d/index.js';
import {createVisit,sampleVisit,windowReachAmount} from './timeline.js';
import {LOOP_DURATION,INITIAL_TIME,sampleLoop,formatTime,SERVICE_CUES,SERVICE_LANE,LANE_DELAYS} from './sequence.js';
import {t,initLanguage,phaseKey,getLanguage} from './i18n.js';
import {createDisplayMode} from './display-mode.js';
import {createAmbientLife} from './ambient-life.js';

const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const setText=(element,text)=>{if(element&&element.textContent!==text)element.textContent=text;};
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),ease=t=>t*t*(3-2*t),lerp=THREE.MathUtils.lerp;
const canvas=$('#scene'),wrap=$('#scene-wrap'),loading=$('#loading');
const dialoguePreview=true;
const crewDialogue=dialoguePreview?createCrewDialogue(wrap,THREE):null;
let renderer,scene,camera,controls,station,modelTemplate,modelMetadata={},lanes=[],running=true,speed=1,selected=SERVICE_LANE,view='follow',time=0,lastTime=0,roofHidden=false,ready=false,cameraMove=null;
const cameraMotion=createCameraMotion(THREE);
let activeService=null;
let needsRender=true;
let lastSceneTime=-1,ambientLife,displayMode,appearance='focus',scrubbing=false,resumeAfterScrub=false;
let parentVisible=new URLSearchParams(location.search).get('embed')!=='1';let pageVisible=parentVisible;const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const colors=[0x903c37,0xe4dfd2,0x426474,0x333d49,0x7c8b82,0xaaa8a3];
const reusable=new THREE.Vector3();
const handheldMat=new THREE.MeshStandardMaterial({color:0xd7c6a7,roughness:.55});

function mesh(geo,mat){const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;return m;}
function card(){const g=new THREE.Group();g.add(mesh(new THREE.BoxGeometry(.086,.055,.006),new THREE.MeshStandardMaterial({color:0x2676af,metalness:.3,roughness:.5})));const chip=mesh(new THREE.BoxGeometry(.015,.012,.001),new THREE.MeshStandardMaterial({color:0xc0ab68,metalness:.7,roughness:.4}));chip.position.set(-.02,0,.004);g.add(chip);return g;}
function squeegee(){const g=new THREE.Group();const stick=mesh(new THREE.CylinderGeometry(.013,.013,.65,8),new THREE.MeshStandardMaterial({color:0x668294,metalness:.6,roughness:.3}));stick.position.y=.2;g.add(stick);const head=mesh(new THREE.BoxGeometry(.35,.04,.065),new THREE.MeshStandardMaterial({color:0x30363a,roughness:.6}));head.position.y=.54;g.add(head);g.userData.blade=head;return g;}
function nozzle(){const g=new THREE.Group();const base=mesh(new THREE.BoxGeometry(.07,.18,.10),new THREE.MeshStandardMaterial({color:0x287951,roughness:.5}));g.add(base);const tip=mesh(new THREE.CylinderGeometry(.015,.015,.18,8),new THREE.MeshStandardMaterial({color:0x9ba5aa,metalness:.8,roughness:.3}));tip.rotation.x=Math.PI/2;tip.position.set(0,.08,.11);g.add(tip);return g;}
function safeDispose(object){object.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){for(const m of [].concat(o.material))m.dispose();}});}
function batchStatic(root,excluded=[]){return batchStaticMeshes(THREE,root,excluded,mergeGeometries);}

function resetPose(p,seated=false){
 if(seated&&p.restPose){for(const [key,quaternion]of Object.entries(p.restPose))p[key]?.quaternion.copy(quaternion);return;}
 for(const n of ['leftArm','rightArm','leftForearm','rightForearm'])if(p[n])p[n].rotation.set(0,0,0);
 if(seated){for(const side of ['left','right']){p[side+'Arm'].rotation.x=-.75;p[side+'Forearm'].rotation.x=-.85;}}
 if(!seated){for(const side of ['left','right'])for(const part of ['Leg','Knee','Foot'])p[side+part]?.rotation.set(0,0,0);}
}
function crouch(p,drop){const angle=Math.acos(1-drop/.79);p.group.position.y-=drop;for(const side of ['left','right']){p[side+'Leg'].rotation.x=-angle;p[side+'Knee'].rotation.x=2*angle;p[side+'Foot'].rotation.x=-angle;}}
function face(p,target){const pos=p.group.position;p.group.rotation.y=Math.atan2(target.x-pos.x,target.z-pos.z);}
function walk(p,points,t){
 // Clear the raised kerb before crossing it; do not interpolate feet through it.
 const route=[points[0]];
 for(let n=1;n<points.length;n++){const a=points[n-1],b=points[n];if(Math.abs(a.y-b.y)>.1){const rising=b.y>a.y,outside=rising?a:b,edgeX=(p.group.userData.islandX||0)+Math.sign(outside.x-(p.group.userData.islandX||0))*1.42;const k=THREE.MathUtils.clamp((edgeX-a.x)/(b.x-a.x||1),0,1),edge=a.clone().lerp(b,k);edge.y=a.y;route.push(edge,edge.clone().setY(b.y));}route.push(b);}
 points=route;
 const distances=points.slice(1).map((pt,i)=>pt.distanceTo(points[i]));const length=distances.reduce((a,b)=>a+b,0);let along=ease(t)*length,i=0;
 while(i<distances.length-1&&along>distances[i]){along-=distances[i];i++;}
 p.group.position.lerpVectors(points[i],points[i+1],distances[i]?Math.min(1,along/distances[i]):1);face(p,points[i+1]);
 const travel=ease(t)*length,speed=6*t*(1-t)*length/4;
 p.group.position.y+=walkHuman(THREE,p,travel,speed);
 // Look a short distance along the path, so each corner becomes a gradual turn.
 const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+2)];
 const frac=distances[i]?Math.min(1,along/distances[i]):1;
 const a=points[i+1].clone().sub(points[i]).normalize(),before=points[i].clone().sub(prev).normalize(),after=next.clone().sub(points[i+1]).normalize();
 const heading=a.clone();if(i>0&&frac<.25)heading.lerp(before,.5*(1-ease(frac/.25)));if(i<distances.length-1&&frac>.75)heading.lerp(after,.5*ease((frac-.75)/.25));
 p.group.rotation.y=Math.atan2(heading.x,heading.z);

}
function reach(p,side,target){reachHuman(THREE,p,side,target);}
function handPos(p,side='right'){return p[side+'Hand']?.localToWorld(V(0,-.035,0))||p.group.localToWorld(V(.2,1,.3));}
function held(obj,p,side='right'){p.group.updateMatrixWorld(true);obj.position.copy(handPos(p,side));obj.quaternion.copy(p.group.getWorldQuaternion(new THREE.Quaternion()));obj.visible=true;}
function at(p,position,target){p.group.position.copy(position);if(target)face(p,target);}

async function loadModel(){
 const draco=new DRACOLoader();draco.setDecoderPath('./vendor/three/examples/jsm/libs/draco/gltf/');draco.setWorkerLimit(2);
 const loader=new GLTFLoader();loader.setDRACOLoader(draco);
 const gltf=await loader.loadAsync('./models/intervalo.glb');
 try{const r=await fetch('./models/metadata.json');if(r.ok)modelMetadata=await r.json();}catch{}
 modelTemplate=gltf.scene;
 modelTemplate.traverse(o=>{if(o.isMesh){o.castShadow=!o.material?.transparent;o.receiveShadow=true;}});
 batchStatic(modelTemplate,[modelTemplate.getObjectByName(modelMetadata.door?.nodeName||'fridge_hinge')].filter(Boolean));
 draco.dispose();
}
function createTotem(x){
 const outer=new THREE.Group(),model=modelTemplate.clone(true);outer.add(model);
 if(!modelMetadata.scenePlacement&&!modelMetadata.normalized){
  const b=new THREE.Box3().setFromObject(model),size=b.getSize(V()),center=b.getCenter(V());
  const k=2.6/size.y;model.scale.multiplyScalar(k);model.position.set(-center.x*k,-b.min.y*k,-center.z*k);
  if(modelMetadata.rotationY)outer.rotation.y=modelMetadata.rotationY;
 }
 outer.rotation.y=Math.PI/2;outer.position.set(x,.18,-1.3);scene.add(outer);outer.updateMatrixWorld(true);
 let hinge=null;
 if(modelMetadata.door?.nodeName){hinge=model.getObjectByName(modelMetadata.door.nodeName);}
 else hinge=model.getObjectByName('fridge_hinge');
 const added=modelMetadata.door?.suggestedAddedDoor;
 if(!hinge&&added){
  // Illustrative glass leaf: the supplied model contains an open fixed cabinet.
  hinge=new THREE.Group();hinge.name='simulation_glass_hinge';hinge.position.fromArray(added.localHinge);outer.add(hinge);
  const w=added.width,h=added.height,frameMat=new THREE.MeshStandardMaterial({color:0x252d30,metalness:.5,roughness:.35});
  const glass=mesh(new THREE.BoxGeometry(w-.035,h-.035,.012),new THREE.MeshStandardMaterial({color:0xa6c7ca,transparent:true,opacity:.16,roughness:.14,metalness:.1,depthWrite:false}));glass.castShadow=false;glass.position.set(-w/2,h/2,0);hinge.add(glass);
  for(const x of [0,-w]){const m=mesh(new THREE.BoxGeometry(.018,h,.025),frameMat);m.position.set(x,h/2,0);hinge.add(m);}
  for(const y of [0,h]){const m=mesh(new THREE.BoxGeometry(w,.018,.025),frameMat);m.position.set(-w/2,y,0);hinge.add(m);}
  const handle=mesh(new THREE.BoxGeometry(.022,.27,.05),frameMat);handle.position.set(-w+.07,h*.53,.035);hinge.add(handle);
 }
 batchStatic(outer,hinge?[hinge]:[]);return {group:outer,model,hinge,hingeRest:hinge?.rotation.y||0};
}
function point(l,x,y,z){return V(l.x+x,y,z);}
function localModelPoint(l,name,fallback){const raw=modelMetadata.points?.[name];const p=Array.isArray(raw)?raw:raw?.localInteraction;return p?l.totem.group.localToWorld(V(...p)):fallback;}
function createLaneRoutes(l){
 const arrive=(()=>{const route=new THREE.CurvePath();route.add(new THREE.LineCurve3(V(-24,0,-33),V(-24,0,-16.2)));route.add(new THREE.QuadraticBezierCurve3(V(-24,0,-16.2),V(-24,0,-12.2),V(-20,0,-12.2)));route.add(new THREE.LineCurve3(V(-20,0,-12.2),V(l.x+.8,0,-12.2)));route.add(new THREE.QuadraticBezierCurve3(V(l.x+.8,0,-12.2),V(l.x+3,0,-12.2),V(l.x+3,0,-9.8)));route.add(new THREE.LineCurve3(V(l.x+3,0,-9.8),V(l.x+3,0,.4)));return route;})();
 const depart=(()=>{const x=l.x+3,route=new THREE.CurvePath();route.add(new THREE.LineCurve3(V(x,0,.4),V(x,0,14)));route.add(new THREE.QuadraticBezierCurve3(V(x,0,14),V(x,0,17),V(x+3,0,17)));route.add(new THREE.LineCurve3(V(x+3,0,17),V(160,0,17)));return route;})();
 arrive.getLength();depart.getLength();return {arrive,depart};
}
function initLane(i,models={}){
 const x=[-10,0,10][i],person=createPerson(THREE),totem=createTotem(x);
 let car;try{car=models.car?createImportedCar(THREE,models.car,createPerson):createCar(THREE,colors[i]);}catch(error){console.warn('Using fallback car',error);car=createCar(THREE,colors[i]);}car.setColor?.(colors[i]);
 person.group.userData.islandX=x;
 batchStatic(car.group,[car.driver.group,...car.wheels]);for(const wheel of car.wheels)batchStatic(wheel);
 scene.add(car.group,person.group);car.group.position.set(x+3,0,-18);
 const l={i,x,car,person,totem,clock:0,delay:i*16,visit:createVisit(['coffee','drink','snack'][i],i!==1,i===1),visits:0};
 l.routes=createLaneRoutes(l);
 l.points={idle:point(l,1.55,0,-.3),window:point(l,1.67,0,.65),pump:point(l,1.0,.18,2.0),tank:point(l,1.78,0,-1.13),front:point(l,.94,.18,-1.58),coffee:point(l,.78,.18,-1.185),fridge:point(l,.80,.18,-1.90),terminal:point(l,.14,.18,.08),rack:point(l,-.88,.18,-1.12),glass:point(l,1.78,0,1.50),bin:point(l,-.90,.18,-.575)};
 l.points.doorOpen=doorPosition(l,1);l.points.doorClosed=doorPosition(l,0);
 l.targets={window:point(l,2.11,1.12,.65),tank:point(l,2.075,.839,-1.16),dock:point(l,.50,1.3,2.0),glass:point(l,2.55,1.32,1.17),coffee:localModelPoint(l,'coffee',point(l,.32,1.55,-1.185)),fridge:localModelPoint(l,'fridge',point(l,.355,1.525,-1.9)),terminal:localModelPoint(l,'terminal',point(l,.14,1.37,-.394)),rack:localModelPoint(l,'squeegee',point(l,-.555,.94,-1.12)),bin:localModelPoint(l,'bin',point(l,-.571,1.15,-.575))};
 l.targets.bin.add(V(.09,0,0));
 if(car.interactionPoints){l.targets.window.copy(car.interactionPoints.window).add(V(x+3,0,.4));l.targets.tank.copy(car.interactionPoints.fuel).add(V(x+3,0,.4));
  // Stand slightly forward of the receiving hand so the attendant's right arm
  // reaches across a short, open span instead of crossing behind the driver.
  l.points.window.set(l.targets.window.x-.44,0,l.targets.window.z+.20);
 }
 l.storage=car.productStorage||{coffee:V(.05,.66,.38),drink:V(.05,.71,.38),snack:V(.25,.64,.16)};
 l.products={};for(const type of ['coffee','drink','snack']){const raw=createProduct(THREE,type);const g=raw.group||raw;l.products[type]=g;scene.add(g);g.visible=false;}
 l.paymentLight=mesh(new THREE.SphereGeometry(.035,12,8),new THREE.MeshBasicMaterial({color:0x65c985}));l.paymentLight.position.copy(l.targets.terminal).add(V(.035,.065,.04));scene.add(l.paymentLight);l.paymentLight.visible=false;
 l.card=card();l.receipt=mesh(new THREE.BoxGeometry(.07,.13,.002),new THREE.MeshStandardMaterial({color:0xf8f6ec}));l.squeegee=squeegee();l.nozzle=nozzle();l.waste=mesh(new THREE.SphereGeometry(.047,7,5),handheldMat);l.waste.scale.set(1,1.5,.7);
 for(const prop of [l.card,l.receipt,l.squeegee,l.nozzle,l.waste]){scene.add(prop);prop.visible=false;}
 const geo=new THREE.BufferGeometry(),segments=30,ring=6;const positions=new Float32Array((segments+1)*ring*3),indices=[];
 for(let j=0;j<segments;j++)for(let k=0;k<ring;k++){const a=j*ring+k,b=j*ring+(k+1)%ring,c=(j+1)*ring+k,d=(j+1)*ring+(k+1)%ring;indices.push(a,c,b,b,c,d);}
 geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();l.hose=mesh(geo,new THREE.MeshStandardMaterial({color:0x20272a,roughness:.8}));l.hose.frustumCulled=false;scene.add(l.hose);
 lanes.push(l);return l;
}
function updateHose(l,end){
 // The dock and hose radius are fixed. Reuse the exact mesh while the nozzle is still.
 if(l.lastHoseEnd?.equals(end))return;
 if(!l.lastHoseEnd)l.lastHoseEnd=new THREE.Vector3();l.lastHoseEnd.copy(end);
 const start=l.targets.dock,low=Math.max(.12,Math.min(start.y,end.y)-1.1);
 const curve=new THREE.CatmullRomCurve3([start,start.clone().add(V(.45,-.5,0)),V((start.x+end.x)/2,low,(start.z+end.z)/2),end.clone().add(V(-.12,-.12,0)),end]);
 const pos=l.hose.geometry.attributes.position;for(let j=0;j<=30;j++){const p=curve.getPoint(j/30),t=curve.getTangent(j/30),n=V(0,1,0).cross(t).normalize(),bn=t.clone().cross(n).normalize();for(let k=0;k<6;k++){const a=k/6*Math.PI*2;pos.setXYZ(j*6+k,p.x+.022*(n.x*Math.cos(a)+bn.x*Math.sin(a)),p.y+.022*(n.y*Math.cos(a)+bn.y*Math.sin(a)),p.z+.022*(n.z*Math.cos(a)+bn.z*Math.sin(a)));}}pos.needsUpdate=true;l.hose.geometry.computeVertexNormals();
}
function setDoor(l,amount){if(l.totem.hinge)l.totem.hinge.rotation.y=l.totem.hingeRest+amount*(modelMetadata.door?.suggestedAddedDoor?.openRadians??1.4);}
function doorHandle(l){const spec=modelMetadata.door?.suggestedAddedDoor;return l.totem.hinge.localToWorld(V(-(spec?.width||.769)+.07,(spec?.height||1.587)*.53,.035));}
function doorPosition(l,amount){return point(l,.91+.30*amount+.22*Math.sin(Math.PI*amount),.18,-1.58-.20*amount);}
function doorPose(l,amount,side='left'){
 setDoor(l,amount);l.totem.hinge.updateWorldMatrix(true,false);
 const pos=doorPosition(l,amount),handle=doorHandle(l);at(l.person,pos,handle);reach(l.person,side,handle);return pos;
}
function carryTarget(p,side='right'){p.group.updateMatrixWorld(true);return p.group.localToWorld(V(side==='right'?.22:-.22,1.14,.30));}
function handover(l,obj,p,receiving=false){
 const actor=l.person,driver=l.car.driver;
 at(actor,l.points.window,l.targets.window);actor.group.updateMatrixWorld(true);
 const contact=driver?.group?handPos(driver,'left'):l.targets.window;
 const rest=carryTarget(actor),u=p<.4?ease(p/.4):p>.7?1-ease((p-.7)/.3):1;
 reach(actor,'right',rest.clone().lerp(contact,u));
 held(obj,(receiving?p<.55:p>=.55)&&driver?.group?driver:actor,(receiving?p<.55:p>=.55)&&driver?.group?'left':'right');
}
function driverReach(l,target){const d=l.car.driver;if(d?.group&&!d.setWindowReach)reach(d,'left',target);}
function transfer(obj,from,to,p){obj.visible=true;obj.position.lerpVectors(from,to,ease(p));}

function idleMotion(l,elapsed,duration){
 const p=l.person,P=l.points,phase=Math.max(0,Math.min(1,elapsed/duration));
 const end=point(l,1.58,0,-3.8);
 if(phase<.43)walk(p,[P.idle,end],phase/.43);
 else if(phase<.64){at(p,end,point(l,3,1,-5));p.rightForearm.rotation.x=-.25-.09*Math.sin(elapsed*1.4+l.i);}
 else walk(p,[end,P.idle],(phase-.64)/.36);
}

function animateLane(l,dt){
 const sample=sampleLoop(time,l.i);l.visit=sample.visit;l.clock=sample.clock;l.visits=sample.index;l.offsite=sample.offsite;
 const color=colors[(l.i+sample.index)%colors.length];if(l.paint!==color){l.car.setColor?.(color);l.paint=color;}
 const s=sampleVisit(l.visit,l.clock),p=s.p,id=s.id,P=l.points,T=l.targets,actor=l.person;
 if(l.visit.order==='coffee')P.front.copy(P.coffee);else P.front.copy(P.doorClosed);
 l.car.group.visible=!sample.offsite&&id!=='wait';l.car.group.position.set(l.x+3,0,.4);l.car.group.rotation.y=0;
 resetPose(actor);if(l.car.driver?.group){resetPose(l.car.driver,true);l.car.driver.setWindowReach?.(windowReachAmount(l.visit,l.clock));}
 at(actor,P.window,T.window);setDoor(l,0);
 for(const prop of [l.card,l.receipt,l.squeegee,l.waste,...Object.values(l.products)]){prop.visible=false;prop.rotation.set(0,0,0);}
 l.nozzle.visible=true;l.nozzle.position.copy(T.dock);l.nozzle.rotation.set(0,0,0);
 l.paymentLight.visible=false;l.squeegee.userData.blade.quaternion.identity();
 const product=l.products[l.visit.order];const prepTarget=l.visit.order==='coffee'?T.coffee:T.fridge;
 const carryingProduct=['toWindow'].includes(id),carryingCard=['toTerminal','pay','backWithCard'].includes(id);
 const carryingSqueegee=['toGlass','clean','backSqueegee'].includes(id);
 switch(id){
 case 'arrive': {
  const route=l.routes.arrive;
  l.car.group.position.copy(route.getPoint(ease(p)));const tangent=route.getTangent(ease(p));l.car.group.rotation.y=Math.atan2(tangent.x,tangent.z);at(actor,P.idle,T.window);if(p<.72)idleMotion(l,l.clock,s.duration*.72);else actor.rightForearm.rotation.x=-.08-.04*Math.sin(time*1.5+l.i);break;}
 case 'greet':if(p<.6)walk(actor,[P.idle,P.window],p/.6);else reach(actor,'right',T.window.clone().add(V(-.18,.15,0)));break;
 case 'toPump':walk(actor,[P.window,P.pump],p);break;
 case 'takeNozzle':at(actor,P.pump,T.dock);reach(actor,'right',T.dock);if(p>.5)held(l.nozzle,actor);break;
 case 'toTank':walk(actor,[P.pump,P.tank],p);reach(actor,'right',actor.group.position.clone().add(V(.3,1.05,.2)));held(l.nozzle,actor);break;
 case 'insert':at(actor,P.tank,T.tank);reach(actor,'right',T.tank);l.nozzle.position.copy(T.tank);l.nozzle.rotation.y=Math.PI/2;break;
 case 'fuel':at(actor,P.tank,T.tank);reach(actor,'right',T.tank);l.nozzle.position.copy(T.tank);l.nozzle.rotation.y=Math.PI/2;break;
 case 'remove':at(actor,P.tank,T.tank);reach(actor,'right',T.tank.clone().add(V(-.2*ease(p),0,0)));held(l.nozzle,actor);break;
 case 'returnNozzle':walk(actor,[P.tank,P.pump],p);reach(actor,'right',actor.group.position.clone().add(V(.2,1.05,.15)));held(l.nozzle,actor);break;
 case 'dock':at(actor,P.pump,T.dock);reach(actor,'right',T.dock);if(p<.5)held(l.nozzle,actor);break;
 case 'toTotem':walk(actor,[P.pump,point(l,1.4,.18,-.05),P.front],p);break;
 case 'openFridge':doorPose(l,ease(p),'left');break;
 case 'prepare':{
  const coffee=l.visit.order==='coffee';setDoor(l,coffee?0:1);
  if(!coffee&&p<.22)walk(actor,[P.doorOpen,P.fridge],p/.22);else at(actor,coffee?P.coffee:P.fridge,prepTarget);
  actor.group.updateMatrixWorld(true);const rest=carryTarget(actor);
  const approach=ease(Math.min(1,p/.22)),withdraw=ease(Math.max(0,(p-.72)/.28));
  reach(actor,'right',rest.clone().lerp(prepTarget,approach*(1-withdraw)));
  product.visible=true;product.position.copy(prepTarget).add(V(0,-.025,0));
  if(p>=.72)held(product,actor);
  // The left hand stays beside the body while the machine dispenses.
  reach(actor,'left',carryTarget(actor,'left').add(V(0,-.12,-.08)));break;}
 case 'closeFridge':{
  if(p<.25){setDoor(l,1);walk(actor,[P.fridge,P.doorOpen],p/.25);}else doorPose(l,1-ease((p-.25)/.75),'left');
  reach(actor,'right',carryTarget(actor));held(product,actor);break;}
 case 'toWindow':walk(actor,[P.front,point(l,1.35,.18,-.05),P.window],p);break;
 case 'deliver':handover(l,product,p);break;
 case 'stowProduct':{
  at(actor,P.window,T.window);const driver=l.car.driver;
  driver?.setWindowReach?.(1-ease(Math.min(1,p/.4)));
  const left=driver?.group?handPos(driver,'left'):T.window,storage=l.car.group.localToWorld(l.storage[l.visit.order].clone());
  product.visible=true;product.position.copy(left);
  if(p>.4){const u=ease(Math.min(1,(p-.4)/.35)),grip=left.clone().lerp(storage,u);reach(driver,'right',grip);product.position.copy(p<.75?handPos(driver,'right'):storage);if(l.visit.order==='snack')product.rotation.x=-Math.PI/2*u;}
  if(p>.8)driver?.setWindowReach?.(ease((p-.8)/.2));
  break;}
 case 'takeCard':handover(l,l.card,p,true);break;
 case 'toTerminal':walk(actor,[P.window,point(l,1.1,.18,.55),P.terminal],p);break;
 case 'pay':{
  at(actor,P.terminal,T.terminal);actor.group.updateMatrixWorld(true);
  const tap=p<.25?ease(p/.25):p>.8?1-ease((p-.8)/.2):1;
  reach(actor,'right',carryTarget(actor).lerp(T.terminal.clone().add(V(0,0,.025)),tap));
  l.paymentLight.visible=p>.3&&p<.85;l.paymentLight.material.color.set(p>.55?0x65c985:0xf4bf55);
  break;}
 case 'backWithCard':walk(actor,[P.terminal,point(l,1.1,.18,.55),P.window],p);break;
 case 'returnCard':handover(l,l.card,p);l.receipt.visible=true;l.receipt.position.copy(l.card.position).add(V(0,-.04,.015));break;
 case 'toSqueegee':walk(actor,[P.window,point(l,-1.12,.18,.50),P.rack],p);break;
 case 'takeSqueegee':at(actor,P.rack,T.rack);crouch(actor,.24*Math.sin(Math.PI*p));reach(actor,'right',p<.5?T.rack:T.rack.clone().add(V(0,.24*ease((p-.5)*2),0)));l.squeegee.visible=true;l.squeegee.position.copy(T.rack);if(p>.5)held(l.squeegee,actor);break;
 case 'toGlass':walk(actor,[P.rack,point(l,-1.12,.18,.50),P.window,P.glass],p);break;
 case 'clean':{
  at(actor,P.glass,T.glass);crouch(actor,.12);actor.group.updateMatrixWorld(true);
  // Three diagonal strokes along the windscreen plane. The rubber head is the contact anchor.
  const stroke=.5-.5*Math.cos(p*Math.PI*6);
  const contact=point(l,2.36+.20*stroke,1.1456+.1752*stroke,1.38-.32*stroke);
  const direction=V(.70,.48,-.15).normalize(),grip=contact.clone().addScaledVector(direction,-.54);
  reach(actor,'right',grip);l.squeegee.visible=true;l.squeegee.position.copy(grip);
  l.squeegee.quaternion.setFromUnitVectors(V(0,1,0),direction);
  l.squeegee.userData.blade.quaternion.copy(l.squeegee.quaternion).invert().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(.50,0,0)));
  reach(actor,'left',point(l,2.14,1.02,1.69));break;}
 case 'backSqueegee':walk(actor,[P.glass,P.window,point(l,-1.12,.18,.50),P.rack],p);break;
 case 'rackSqueegee':at(actor,P.rack,T.rack);crouch(actor,.24*Math.sin(Math.PI*p));reach(actor,'right',T.rack);l.squeegee.visible=true;l.squeegee.position.copy(T.rack);if(p<.5)held(l.squeegee,actor);break;
 case 'toWasteWindow':walk(actor,l.visit.clean?[P.rack,point(l,-1.12,.18,.50),P.window]:[P.window,P.window],p);break;
 case 'takeWaste':handover(l,l.waste,p,true);break;
 case 'toBin':walk(actor,[P.window,point(l,-1.12,.18,.50),P.bin],p);reach(actor,'right',carryTarget(actor));held(l.waste,actor);break;
 case 'dispose':{
  at(actor,P.bin,T.bin);actor.group.updateMatrixWorld(true);
  const release=T.bin.clone().add(V(.015,.045,0)),u=ease(Math.min(1,p/.45));
  reach(actor,'right',carryTarget(actor).lerp(release,u));
  if(p<.45)held(l.waste,actor);else{l.waste.visible=p<.94;l.waste.position.copy(release).add(V(.025*ease((p-.45)/.55),-.34*Math.pow((p-.45)/.55,2),0));}
  break;}
 case 'standClear':walk(actor,l.visit.waste||l.visit.clean?[l.visit.waste?P.bin:P.rack,point(l,-1.12,.18,.50),P.window,P.idle]:[P.window,P.idle],p);break;
 case 'depart':{at(actor,P.idle,T.window);const route=l.routes.depart;l.car.group.position.copy(route.getPoint(ease(p)));const tangent=route.getTangent(ease(p));l.car.group.rotation.y=Math.atan2(tangent.x,tangent.z);break;}
 case 'wait':at(actor,P.idle,T.window);break;
 }
 if(sample.offsite)idleMotion(l,Math.max(0,((time-LANE_DELAYS[l.i])%LOOP_DURATION+LOOP_DURATION)%180-l.visit.duration),180-l.visit.duration);
 if(carryingProduct){reach(actor,'right',carryTarget(actor));held(product,actor);}
 if(carryingCard){if(id!=='pay')reach(actor,'right',carryTarget(actor));held(l.card,actor);}
 if(carryingSqueegee&&id!=='clean'){reach(actor,'right',carryTarget(actor));held(l.squeegee,actor);l.squeegee.rotation.z=-.3;}
 // The product stays inside the vehicle after the handoff.
 const delivered=s.index>l.visit.steps.findIndex(x=>x.id==='deliver');
 if(delivered&&id!=='stowProduct'&&!sample.offsite&&id!=='wait'){product.visible=true;product.position.copy(l.car.group.localToWorld(l.storage[l.visit.order].clone()));product.rotation.set(l.visit.order==='snack'?-Math.PI/2:0,0,0);}
 if(l.car.wheels)for(const w of l.car.wheels)w.rotation.x=(id==='arrive'||id==='depart')?-l.car.group.position.z/.32:0;
 updateHose(l,l.nozzle.position);
 l.currentPhase=sample.offsite?'idle':phaseKey(id);l.currentStep=sample.offsite?'idle':id;l.stepProgress=p;

}

function followView(){
 const lane=lanes[selected],step=lane?.currentStep||'idle';
 let target=V(1,1,-1),pos=V(7,3.8,7);
 if(lane){
  if(step==='arrive'||step==='depart'){
   target.copy(lane.car.group.position);target.y=.9;
   // Track the actual vehicle from street level, without clamping its position.
   pos=target.clone().add(V(8,2.7,10));
   if(step==='arrive'){
    const u=THREE.MathUtils.smoothstep(lane.stepProgress,.65,1);
    pos.lerp(V(lane.x+7.2,3.35,6.8),u);target.lerp(V(lane.x+2,1.1,.3),u);
   }
  }else{
   const actor=lane.person.group.position;target.set(actor.x,1.1,actor.z);
   const rear=['toTotem','openFridge','prepare','closeFridge','toTerminal','pay','toBin','dispose'].includes(step);
   // Every service view stays below the 5.3 m soffit, outside the car and product.
   const side=rear?-1:1;pos.set(lane.x+6.5,3.35,actor.z+side*6.8);
  }
 }
 return {target,pos};
}
function changeCamera(which,instant=false){
 needsRender=true;cameraMotion.reset();
 view=['general','service','follow'].includes(which)?which:'service';which=view;selected=SERVICE_LANE;const x=[-10,0,10][selected];let pos,target;
 // The canopy stays present. Visibility changes only through the explicit user control.
 refreshLabels();
 if(which==='general'){pos=V(36,25,49);target=V(0,2.8,3);}
 else if(which==='service'){pos=V(x+7.2,3.5,7.4);target=V(x+1.1,1.05,-1.1);}
 else {const shot=followView();pos=shot.pos;target=shot.target;}
 const crossing=(camera.position.y>5)!==(pos.y>5);
 cameraMove={from:camera.position.clone(),to:pos,fromTarget:controls.target.clone(),toTarget:target,t:instant?1:0,crossing};
 if(instant){camera.position.copy(pos);controls.target.copy(target);cameraMove=null;controls.update();}
 all('[data-view]').forEach(b=>{b.classList.toggle('selected',b.dataset.view===which);b.setAttribute('aria-pressed',b.dataset.view===which);});
}
function refreshLabels(){
 setText($('#camera-description'),t(view+'Description'));
 setText($('#play'),running?'Ⅱ':'▷');$('#play').setAttribute('aria-label',t(running?'pause':'play'));$('#play').title=t(running?'pause':'play');
 setText($('#roof'),t(roofHidden?'showRoof':'roof'));
 setText($('#fullscreen'),t(document.fullscreenElement?'exitFullscreen':'fullscreen'));
}
function setRunning(value){running=value;refreshLabels();updatePlayback();}
function restart(){activeService=null;time=0;lastTime=0;lastSceneTime=-1;selected=SERVICE_LANE;for(const lane of lanes)animateLane(lane,0);changeCamera('follow',true);updatePlayback();setRunning(!reduced);}
function updatePlayback(){
 $('#story').hidden=!ready||!running||!pageVisible||document.hidden||$('#captions').getAttribute('aria-pressed')!=='true';
 const value=Math.min(time,LOOP_DURATION);$('#timeline').value=value;$('#timeline').style.setProperty('--progress',value/LOOP_DURATION*100+'%');
 $('#timecode').value=formatTime(value)+' / '+formatTime(LOOP_DURATION);
 $('#timeline').setAttribute('aria-valuetext',formatTime(value)+' / '+formatTime(LOOP_DURATION));
 const lane=lanes[selected];
 const text=caption(getLanguage(),lane?.currentStep||'idle',lane?.visit.order||'coffee');
 const subtitle=$('#subtitle');if(subtitle.textContent!==text)subtitle.textContent=text;
 const label=t('island')+' '+String(selected+1).padStart(2,'0');if($('#subtitle-island').textContent!==label)$('#subtitle-island').textContent=label;setText($('#activity'),view==='general'?'':t(lane?.currentPhase||'idle'));
 if(activeService&&(time<SERVICE_CUES[activeService].start||time>=SERVICE_CUES[activeService].end))activeService=null;
 all('[data-service]').forEach(b=>{const on=b.dataset.service===activeService;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on);});
}
function bindUI(){
 const dialogueButton=$('#dialogues');dialogueButton.hidden=!dialoguePreview;dialogueButton.classList.toggle('selected',dialogueButton.getAttribute('aria-pressed')==='true');
 bindActivation(dialogueButton,()=>{const on=dialogueButton.getAttribute('aria-pressed')!=='true';dialogueButton.setAttribute('aria-pressed',String(on));dialogueButton.classList.toggle('selected',on);});
 $('#captions').onclick=()=>{const on=$('#captions').getAttribute('aria-pressed')!=='true';$('#captions').setAttribute('aria-pressed',String(on));updatePlayback();};
 bindActivation($('#play'),()=>setRunning(!running));bindActivation($('#restart'),restart);
 $('#speed').onchange=e=>speed=Number(e.target.value);
 $('#timeline').max=LOOP_DURATION;
 $('#timeline').addEventListener('pointerdown',()=>{scrubbing=true;resumeAfterScrub=running;setRunning(false);});
 $('#timeline').addEventListener('input',e=>{activeService=null;time=Number(e.target.value);updatePlayback();});
 const finishScrub=()=>{if(scrubbing){scrubbing=false;setRunning(resumeAfterScrub);}};
 window.addEventListener('pointerup',finishScrub);window.addEventListener('pointercancel',finishScrub);
 $('#timeline').addEventListener('keydown',()=>setRunning(false));
 all('[data-view]').forEach(b=>b.onclick=()=>changeCamera(b.dataset.view));
 all('[data-mode]').forEach(b=>b.onclick=()=>{appearance=b.dataset.mode;displayMode.set(appearance);needsRender=true;all('[data-mode]').forEach(el=>{el.classList.toggle('selected',el===b);el.setAttribute('aria-pressed',el===b);});});
 all('[data-service]').forEach(b=>bindActivation(b,()=>{activeService=b.dataset.service;time=SERVICE_CUES[activeService].start;lastSceneTime=-1;selected=SERVICE_LANE;for(const lane of lanes)animateLane(lane,0);changeCamera('follow');setRunning(true);updatePlayback();}));
 $('#roof').onclick=()=>{needsRender=true;roofHidden=!roofHidden;station.roof.visible=!roofHidden;$('#roof').setAttribute('aria-pressed',roofHidden);refreshLabels();};
 $('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('.experience').requestFullscreen();}catch{}};
 document.addEventListener('fullscreenchange',()=>{refreshLabels();resize();});
 document.addEventListener('intervalo-language',()=>{refreshLabels();updatePlayback();});
 canvas.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();setRunning(!running);}if(e.key==='Home')changeCamera('general');});
 let inViewport=true;
 addEventListener('message',e=>{if(e.source===parent&&e.origin===location.origin&&e.data?.type==='portfolio-visibility'){parentVisible=e.data.visible===true;pageVisible=inViewport&&parentVisible&&!document.hidden;lastTime=0;}});
 document.addEventListener('visibilitychange',()=>{pageVisible=inViewport&&parentVisible&&!document.hidden;lastTime=0;});
 new IntersectionObserver(entries=>{inViewport=entries[0].isIntersecting;pageVisible=inViewport&&parentVisible&&!document.hidden;lastTime=0;},{threshold:.05}).observe(wrap);
 controls.addEventListener('start',()=>{cameraMotion.reset();cameraMove=null;if(view==='follow'){view='manual';all('[data-view]').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');});refreshLabels();}});
}
function resize(){if(!renderer)return;needsRender=true;const w=wrap.clientWidth,h=wrap.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=Math.min(68,THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(20))*Math.max(1,1.25/camera.aspect))));camera.updateProjectionMatrix();}
// Keep the station inspectable through the whole orbit: cut away only nearby
// buildings that intersect the camera or the sight line to the current subject.
const cityRay=new THREE.Ray(),cityHit=new THREE.Vector3(),cityAim=new THREE.Vector3(),cityBox=new THREE.Box3();
function updateCityCutaway(){
 for(const {object,bounds} of station.cityOccluders||[]){
  cityBox.copy(bounds).expandByScalar(object.visible?.2:.6);
  let blocked=cityBox.containsPoint(camera.position);
  for(const [dx,dz] of [[0,0],[-3,0],[3,0],[0,-3],[0,3]]){
   if(blocked)break;
   cityAim.copy(controls.target).add(V(dx,0,dz));const distance=camera.position.distanceTo(cityAim);
   cityRay.set(camera.position,cityAim.sub(camera.position).normalize());
   blocked=!!cityRay.intersectBox(cityBox,cityHit)&&cityHit.distanceTo(camera.position)<distance-1;
  }
  object.visible=!blocked;
 }
}
let lastUiTime=-Infinity;
function frame(now){requestAnimationFrame(frame);if(!ready||!pageVisible){$('#story').hidden=true;crewDialogue?.update(lanes[selected],camera,getLanguage(),false);lastTime=0;return;}const delta=lastTime?Math.min((now-lastTime)/1000,.25):0;lastTime=now;const dt=running?delta*speed*(time<28?2:1):0;time=(time+dt)%LOOP_DURATION;
 const sceneChanged=time!==lastSceneTime;if(sceneChanged){for(const l of lanes)animateLane(l,dt);ambientLife?.update(time);lastSceneTime=time;}if(view==='follow'&&!activeService&&['idle','wait'].includes(lanes[selected]?.currentStep)){const next=lanes.find(l=>!['idle','wait'].includes(l.currentStep));if(next)selected=next.i;}if(now-lastUiTime>=100){updatePlayback();lastUiTime=now;}
 if(cameraMove){cameraMove.t=Math.min(1,cameraMove.t+delta*(cameraMove.crossing?.28:.7));const k=ease(cameraMove.t);if(cameraMove.crossing){const a=cameraMove.from,b=cameraMove.to,edgeA=V(22,a.y,16),edgeB=V(22,b.y,16);if(k<.35)camera.position.lerpVectors(a,edgeA,ease(k/.35));else if(k<.65)camera.position.lerpVectors(edgeA,edgeB,ease((k-.35)/.3));else camera.position.lerpVectors(edgeB,b,ease((k-.65)/.35));}else camera.position.lerpVectors(cameraMove.from,cameraMove.to,k);controls.target.lerpVectors(cameraMove.fromTarget,cameraMove.toTarget,k);if(k===1)cameraMove=null;}
 if(view==='follow'&&!cameraMove){const shot=followView();cameraMotion.update(camera.position,controls.target,{p:shot.pos.toArray(),t:shot.target.toArray()},delta);}
 const cameraChanged=controls.update();
 crewDialogue?.update(lanes[selected],camera,getLanguage(),ready&&running&&pageVisible&&!document.hidden&&$('#dialogues').getAttribute('aria-pressed')==='true');
 if(sceneChanged||cameraChanged||needsRender){updateCityCutaway();renderer.render(scene,camera);canvas.dataset.drawCalls=renderer.info.render.calls;canvas.dataset.triangles=renderer.info.render.triangles;needsRender=false;}
}
async function init(){
 try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1.05;
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(40,1,.1,3000);controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=3;controls.maxDistance=65;controls.enablePan=false;controls.maxPolarAngle=Math.PI*.48;controls.target.set(0,1,0);
  // Same neutral colour response and daylight palette as Crown; a low-intensity
  // reflection environment keeps the imported metal/glass legible under the roof.
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();scene.environmentIntensity=.48;
  const {sun,hemisphere}=applyDaylight(THREE,renderer,scene,{fogNear:180,fogFar:1250});hemisphere.intensity=1.6;sun.intensity=2.1;sun.position.set(-18,28,16);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:.5,far:90});sun.shadow.bias=-.00035;sun.shadow.normalBias=.035;scene.add(sun);
  const fill=new THREE.DirectionalLight(0xeaf2ff,.45);fill.position.set(12,10,-14);scene.add(fill);
  for(const x of [-8,0,8]){const lamp=new THREE.SpotLight(0xfff7e7,32,13,1.1,.9,1.5);lamp.position.set(x,5.25,0);lamp.target.position.set(x,0,0);scene.add(lamp,lamp.target);}
  const [sharedModels]=await Promise.all([loadSharedModels(new GLTFLoader()),loadModel()]);
  station=upgradeEnvironment(THREE,createStation(THREE),{models:sharedModels});for(const p of station.pumps){p.group.rotation.y=Math.PI/2;p.dock.position.set(.2,1.12,.5);}batchStatic(station.group,[station.roof,...station.cityBuildings]);batchStatic(station.roof);for(const building of station.cityBuildings)batchStatic(building);scene.add(station.group);station.cityOccluders=station.cityBuildings.map(object=>({object,bounds:new THREE.Box3().setFromObject(object)}));
  for(let i=0;i<3;i++)initLane(i,sharedModels);
  ambientLife=createAmbientLife(THREE,{models:sharedModels,createPerson,batchStaticMeshes:batchStatic,loopDuration:LOOP_DURATION});scene.add(ambientLife.group);
  const highlights=lanes.flatMap(l=>[l.totem.group,l.person.group,l.car.driver.group,l.paymentLight,l.card,l.receipt,l.squeegee,l.nozzle,l.waste,...Object.values(l.products)]);
  displayMode=createDisplayMode(THREE,scene,highlights);displayMode.set(appearance);

  resize();new ResizeObserver(resize).observe(wrap);time=INITIAL_TIME;for(const lane of lanes)animateLane(lane,0);changeCamera('follow',true);bindUI();setRunning(!reduced);
 if(parent!==window)parent.postMessage({type:'intervalo-ready'},location.origin);
  const params=new URLSearchParams(location.search);if(params.has('reviewTime')){time=Math.max(0,Number(params.get('reviewTime'))||0)%LOOP_DURATION;setRunning(false);}

  for(const lane of lanes)animateLane(lane,0);changeCamera(params.get('view')||'follow',true);
  updatePlayback();
  ready=true;loading.hidden=true;document.body.dataset.ready='true';requestAnimationFrame(frame);
 }catch(error){console.error(error);loading.innerHTML='<strong>'+t('error')+'</strong><span>'+t('errorDetail')+'</span><button class="error-action" id="retry">'+t('retry')+'</button>';$('#retry').onclick=()=>location.reload();}
}
initLanguage();init();
















