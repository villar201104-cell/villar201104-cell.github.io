/**
 * Shared imported hatchback adapter. No Three import, loader, brand or human asset.
 * Load ./models/car-hatchback.glb with the host GLTFLoader, then call:
 *   createImportedCar(THREE, gltf.scene, (T, opts) => createHuman(T, opts))
 * Existing procedural createCar remains the caller's fallback on load/validation errors.
 * Metres; +Y up, +Z forward. Wheel list: FL, FR, RL, RR, spin local X.
 * Template geometry is shared; body paint is cloned per car. dispose() releases only
 * adapter-owned paint and generated driver resources, never cached template geometry.
 */
export const HATCHBACK_MODEL_URL = new URL('./models/car-hatchback.glb', import.meta.url);
export const HATCHBACK_METADATA_URL = new URL('./models/car-hatchback.json', import.meta.url);
const WHEELS=['wheel-FL','wheel-FR','wheel-RL','wheel-RR'];
function aimDriverArm(T,driver,side,target){
 const arm=driver[side+'Arm'],forearm=driver[side+'Forearm'];
 const shoulder=arm.position.clone(),end=new T.Vector3(...target),direction=end.clone().sub(shoulder);
 const a=Math.abs(forearm.position.y),b=Math.abs(driver[side+'Hand'].position.y),length=direction.length();
 if(length>=a+b||length<Math.abs(a-b)+1e-6)throw new Error('Driver rig cannot reach hatchback steering wheel');
 direction.normalize();const along=(a*a+length*length-b*b)/(2*length),height=Math.sqrt(Math.max(0,a*a-along*along));
 const bend=new T.Vector3(0,-1,0).addScaledVector(direction,direction.y).normalize();
 const elbow=shoulder.clone().addScaledVector(direction,along).addScaledVector(bend,height);
 arm.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),elbow.clone().sub(shoulder).normalize());
 const distal=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,-1,0),end.sub(elbow).normalize());
 forearm.quaternion.copy(arm.quaternion).invert().multiply(distal);
}
// Validated for the shared .29 m + .29 m seated arm rig. Joint-local XYZW.
// Retract forward/up, raise elbow beside the head, then extend through the window.
const WINDOW_REACH_FRAMES = [[[-0.7534167372596247,0,0.04735556870535883,0.6558358560872176],[0.9311455051587363,-0.19757499164082426,0.11345890609077025,-0.2847090576878362],[-0.5901085077417165,-0.5901085077417165,-0.5085720240351673,0.2118924126779007]],[[0.06449919417330321,0,-0.9750883113364017,0.21223251175566607],[-0.11822255675019375,-0.2772244131389023,0.8750713931604471,0.3787084745651626],[0.19161360830349866,0.19161360830349866,-0.5231423730434174,0.8080164031455851]],[[0,0,-0.970834386382726,0.23975110889602955],[0,0,0.8850388115662481,0.4655172413793103],[0,0,-0.5169539431229291,0.8560132129176834]]];
function installWindowReach(T,driver){
 const joints=[driver.leftArm,driver.leftForearm,driver.leftHand];
 const frames=[joints.map(o=>o.quaternion.clone()),...WINDOW_REACH_FRAMES.map(f=>f.map(q=>new T.Quaternion().fromArray(q)))];
 const stops=[0,.36,.76,1];
 driver.windowReachDuration=.9;
 driver.setWindowReach=function(progress){
  const p=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
  const segment=p<stops[1]?0:p<stops[2]?1:2;
  const t=(p-stops[segment])/(stops[segment+1]-stops[segment]);
  const eased=t*t*(3-2*t);
  for(let i=0;i<joints.length;i++)joints[i].quaternion.copy(frames[segment][i]).slerp(frames[segment+1][i],eased);
  driver.windowReachProgress=p;
  return driver;
 };
 driver.setWindowReach(0);
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
 const interactionPoints={window:new T.Vector3(-.89,1.12,.25),fuel:new T.Vector3(-.925,.94,-1.56)};
 group.userData.dimensions={length:4.5,width:1.88,mirrorsWidth:2.233635,height:1.672539};
 group.userData.interactionPoints=interactionPoints;
 let disposed=false;
 return {group,model,staticGroup,wheels,driver,steeringWheel,interactionPoints,
  setColor(value){for(const material of paints.values())material.color.set(value);},
  dispose(){
   if(disposed)return;disposed=true;
   for(const material of paints.values())material.dispose();
   const geometries=new Set(),materials=new Set(),textures=new Set();
   driver.group.traverse(o=>{if(!o.isMesh)return;geometries.add(o.geometry);for(const m of [].concat(o.material)){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});
   for(const x of textures)x.dispose();for(const x of materials)x.dispose();for(const x of geometries)x.dispose();group.removeFromParent();
  }
 };
}

