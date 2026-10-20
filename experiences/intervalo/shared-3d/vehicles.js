/**
 * Shared imported hatchback adapter. No Three import, loader, brand or human asset.
 * Load ./models/car-hatchback.glb with the host GLTFLoader, then call:
 *   createImportedCar(THREE, gltf.scene, (T, opts) => createHuman(T, opts))
 * Existing procedural createCar remains the caller's fallback on load/validation errors.
 * Metres; +Y up, +Z forward. Wheel list: FL, FR, RL, RR, spin local X.
 * Template geometry is shared; body paint is cloned per car. dispose() releases only
 * adapter-owned paint and generated driver resources, never cached template geometry.
 */
import {refineCarMirrors} from './car-mirrors.js';
export const HATCHBACK_MODEL_URL = new URL('./models/car-hatchback.glb', import.meta.url);
export const HATCHBACK_METADATA_URL = new URL('./models/car-hatchback.json', import.meta.url);
const WHEELS=['wheel-FL','wheel-FR','wheel-RL','wheel-RR'];
function aimDriverArm(T,driver,side,target,pole=new T.Vector3(0,-1,0)){
 const arm=driver[side+'Arm'],forearm=driver[side+'Forearm'];
 const shoulder=arm.position.clone(),end=new T.Vector3(...target),direction=end.clone().sub(shoulder);
 const a=Math.abs(forearm.position.y),b=Math.abs(driver[side+'Hand'].position.y),length=direction.length();
 if(length>=a+b||length<Math.abs(a-b)+1e-6)throw new Error('Driver rig cannot reach hatchback steering wheel');
 direction.normalize();const along=(a*a+length*length-b*b)/(2*length),height=Math.sqrt(Math.max(0,a*a-along*along));
 const bend=pole.clone().addScaledVector(direction,-pole.dot(direction)).normalize();
 const elbow=shoulder.clone().addScaledVector(direction,along).addScaledVector(bend,height);
 arm.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),elbow.clone().sub(shoulder).normalize());
 const distal=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,-1,0),end.sub(elbow).normalize());
 forearm.quaternion.copy(arm.quaternion).invert().multiply(distal);
}
// Receive forward of the shoulder, with the elbow forward and wrist neutral.
// The old raised-elbow route cleared the shell but visibly folded the wrist.
const WINDOW_WRIST=[-.49,.62,.28];
function installWindowReach(T,driver){
 const joints=[driver.leftArm,driver.leftForearm,driver.leftHand];
 const rest=joints.map(o=>o.quaternion.clone());
 aimDriverArm(T,driver,'left',WINDOW_WRIST,new T.Vector3(0,0,1));
 driver.leftHand.quaternion.identity();
 const receiving=joints.map(o=>o.quaternion.clone());
 driver.windowReachDuration=.9;
 driver.setWindowReach=function(progress){
  const p=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
  const eased=p*p*(3-2*p);
  for(let i=0;i<joints.length;i++)joints[i].quaternion.copy(rest[i]).slerp(receiving[i],eased);
  driver.windowReachProgress=p;
  return driver;
 };
 driver.setWindowReach(0);
}


// Keep the imported shell/dashboard; replace the rounded seat volumes with upholstery.
function refineInterior(T,model){
 const interior=model.getObjectByName('body-static__interior');if(!interior?.geometry)return null;
 const source=interior.geometry,positions=source.attributes.position,index=source.index;
 const kept=[];for(let i=0;i<(index?.count||positions.count);i+=3){const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k);
  const seat=ids.every(v=>Math.abs(positions.getX(v))>.15&&positions.getY(v)>.39&&positions.getZ(v)<.65);
  if(!seat)kept.push(...ids);
 }
 interior.geometry=source.clone();interior.geometry.setIndex(kept);interior.geometry.computeBoundingBox();interior.geometry.computeBoundingSphere();
 const seats=new T.Group();seats.name='Upholstery and console';model.add(seats);
 const cloth=new T.MeshStandardMaterial({color:0x313a40,roughness:.96,metalness:0}),insert=new T.MeshStandardMaterial({color:0x495258,roughness:1}),metal=new T.MeshStandardMaterial({color:0x737c80,roughness:.4,metalness:.65});
 function panel(w,h,d,x,y,z,mat=cloth){const r=Math.min(.035,w/5,h/5),shape=new T.Shape();shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);shape.lineTo(-w/2+r,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);const geo=new T.ExtrudeGeometry(shape,{depth:d-.012,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:2,curveSegments:5,steps:1});geo.translate(0,0,-d/2+.006);const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;seats.add(m);return m;}
 for(const x of [-.4,.4]){panel(.47,.095,.48,x,.485,.28);panel(.46,.51,.13,x,.80,.01);panel(.30,.36,.014,x,.80,.084,insert);
  // Wide, low head restraint with visible posts; no rounded head/torso silhouette.
  for(const dx of [-.07,.07])panel(.012,.10,.012,x+dx,1.095,.005,metal);
  panel(.27,.135,.10,x,1.19,.005);for(const y of [.70,.80,.90])panel(.29,.006,.008,x,y,.095,cloth);
 }
 panel(1.30,.12,.50,0,.66,-1.12);panel(1.30,.48,.13,0,.96,-1.37);panel(1.12,.32,.014,0,.96,-1.292,insert);
 const tray=panel(.27,.045,.42,.045,.55,.30);tray.name='Console tray supporting delivered products';
 for(const x of [-.09,.18])panel(.012,.055,.42,x,.575,.30);for(const z of [.09,.51])panel(.27,.055,.012,.045,.575,z);
 return {seats,geometry:interior.geometry,materials:[cloth,insert,metal]};
}

export function createImportedCar(T,template,createPerson){
 const source=template?.scene||template;
 if(!source?.isObject3D)throw new TypeError('Expected a loaded hatchback scene or GLTF result');
 if(typeof createPerson!=='function')throw new TypeError('A createPerson(THREE, {driver:true}) callback is required');
 const model=source.clone(true);model.name='shared-hatchback-model';
 const wheels=WHEELS.map(name=>{const node=model.getObjectByName(name);if(!node)throw new Error('Missing hatchback pivot: '+name);return node;});
 const staticGroup=model.getObjectByName('body-static'),steeringWheel=model.getObjectByName('steering-wheel');
 if(!staticGroup||!steeringWheel)throw new Error('Hatchback static/steering groups are missing');
 const paints=new Map();
 model.traverse(o=>{
  if(!o.isMesh)return;
  const replace=material=>{if(material.name!=='body-paint')return material;if(!paints.has(material)){const paint=material.clone();paint.map=null;paint.needsUpdate=true;paints.set(material,paint);}return paints.get(material);};
  o.material=Array.isArray(o.material)?o.material.map(replace):replace(o.material);
  o.castShadow=![].concat(o.material).every(m=>m.transparent);o.receiveShadow=true;
 });
 if(!paints.size)throw new Error('Hatchback body-paint material is missing');
 const interiorRefinement=refineInterior(T,model),mirrorRefinement=refineCarMirrors(T,model,interiorRefinement?.materials);
 const group=new T.Group();group.name='shared-imported-hatchback';group.add(model);
 let driver;
 try{
  driver=createPerson(T,{driver:true});
  for(const key of ['group','head','leftArm','rightArm','leftForearm','rightForearm','leftHand','rightHand','leftLeg','rightLeg','leftKnee','rightKnee'])if(!driver?.[key]?.isObject3D)throw new Error('Driver rig missing '+key);
  driver.group.position.set(-.4,.60,.25);
  for(const side of ['left','right']){driver[side+'Leg'].rotation.x=-Math.PI/2;driver[side+'Knee'].rotation.x=Math.PI/2;}
  aimDriverArm(T,driver,'left',[-.14,.435,.392]);aimDriverArm(T,driver,'right',[.14,.435,.392]);
 }catch(error){for(const m of paints.values())m.dispose();throw error;}
 driver.group.userData.dynamic=true;
 driver.group.traverse(o=>{o.userData.excludeFromStaticBatch=true;o.userData.skipStaticBatch=true;});
 for(const wheel of wheels)wheel.traverse(o=>{o.userData.excludeFromStaticBatch=true;o.userData.skipStaticBatch=true;});
 group.add(driver.group);driver.restPose={};
 for(const side of ['left','right'])for(const part of ['Arm','Forearm','Hand','Leg','Knee'])driver.restPose[side+part]=driver[side+part].quaternion.clone();
 installWindowReach(T,driver);
 const interactionPoints={window:new T.Vector3(...WINDOW_WRIST).add(driver.group.position),fuel:new T.Vector3(-.925,.94,-1.56)};
 group.userData.dimensions={length:4.5,width:1.88,mirrorsWidth:2.233635,height:1.672539};
 group.userData.interactionPoints=interactionPoints;
 let disposed=false;
 return {group,model,staticGroup,wheels,driver,steeringWheel,interactionPoints,
  productStorage:{coffee:new T.Vector3(.045,.598,.36),drink:new T.Vector3(.045,.648,.36),snack:new T.Vector3(.045,.598,.22)},
  setColor(value){for(const material of paints.values())material.color.set(value);},
  dispose(){
   if(disposed)return;disposed=true;
   for(const material of paints.values())material.dispose();
   const geometries=new Set(mirrorRefinement.geometries),materials=new Set(mirrorRefinement.materials),textures=new Set();
   if(interiorRefinement){geometries.add(interiorRefinement.geometry);interiorRefinement.seats.traverse(o=>{if(o.geometry)geometries.add(o.geometry);});for(const m of interiorRefinement.materials)materials.add(m);}
   driver.group.traverse(o=>{if(!o.isMesh)return;geometries.add(o.geometry);for(const m of [].concat(o.material)){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});
   for(const x of textures)x.dispose();for(const x of materials)x.dispose();for(const x of geometries)x.dispose();group.removeFromParent();
  }
 };
}

