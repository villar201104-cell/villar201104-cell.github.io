import {createImportedCar} from './shared-3d/index.js';

// Metres, +Y up, +Z forward. Host owns paving and lighting. Service owns z=17.
// Public corridors let the environment place paths without duplicating motion code.
export const AMBIENT_LAYOUT=Object.freeze({
 serviceLaneZ:17,
 traffic:Object.freeze([
  Object.freeze({id:'westbound',kind:'line',minX:-184,maxX:184,z:21.5,count:3,speed:7}),
  Object.freeze({id:'far-block',kind:'rounded',minX:-156.5,maxX:-87.5,minZ:-111.5,maxZ:-42.5,radius:5.5,count:3,speed:6.5})
 ]),
 walks:Object.freeze([
  Object.freeze({id:'south-sidewalk',minX:46.5,maxX:69,minZ:25,maxZ:26,radius:.45,count:2,speed:.85,groundY:.15}),
  Object.freeze({id:'west-front-sidewalk',minX:-80,maxX:-58,minZ:25,maxZ:26,radius:.45,count:2,speed:.85,groundY:.15}),
  Object.freeze({id:'west-sidewalk',minX:-33,maxX:-32,minZ:-70,maxZ:-52,radius:.45,count:2,speed:.85,groundY:.15}),
  Object.freeze({id:'east-sidewalk',minX:31,maxX:32,minZ:-25,maxZ:9,radius:.45,count:2,speed:.85,groundY:.15}),
  Object.freeze({id:'park-rear',minX:-5,maxX:11,minZ:59.5,maxZ:60.5,radius:.5,count:2,speed:.85,groundY:.18}),
  Object.freeze({id:'park-spine',minX:5.35,maxX:6.65,minZ:37,maxZ:57.5,radius:.65,count:2,speed:.85,groundY:.18}) ])
});
const TAU=Math.PI*2;
const mod=(x,n=1)=>((x%n)+n)%n;
const smooth=x=>x*x*(3-2*x);
const RIG_KEYS=['head','leftArm','rightArm','leftForearm','rightForearm','leftHand','rightHand','leftLeg','rightLeg','leftKnee','rightKnee','leftFoot','rightFoot'];
function protect(root){root.userData.dynamic=true;root.userData.excludeFromStaticBatch=true;root.userData.skipStaticBatch=true;}
function pathTo(root,node){const path=[];while(node!==root){if(!node.parent)throw Error('Rig joint outside root');path.unshift(node.parent.children.indexOf(node));node=node.parent;}return path;}
function atPath(root,path){return path.reduce((o,i)=>o.children[i],root);}
function routeFor(d){
 if(d.kind==='line')return {length:d.maxX-d.minX,sample(u){return {x:d.maxX-mod(u)*(d.maxX-d.minX),z:d.z,heading:-Math.PI/2};}};
 const {minX:a,maxX:b,minZ:c,maxZ:e,radius:r}=d,parts=[];
 function line(x,z,dx,dz,length){parts.push({length,sample:s=>({x:x+dx*s,z:z+dz*s,heading:Math.atan2(dx,dz)})});}
 function arc(x,z,start){parts.push({length:Math.PI*r/2,sample:s=>{const v=start+s/r;return {x:x+r*Math.cos(v),z:z+r*Math.sin(v),heading:Math.atan2(-Math.sin(v),Math.cos(v))};}});}
 line(a+r,c,1,0,b-a-2*r);arc(b-r,c+r,-Math.PI/2);
 line(b,c+r,0,1,e-c-2*r);arc(b-r,e-r,0);
 line(b-r,e,-1,0,b-a-2*r);arc(a+r,e-r,Math.PI/2);
 line(a,e-r,0,-1,e-c-2*r);arc(a+r,c+r,Math.PI);
 const length=parts.reduce((s,p)=>s+p.length,0);
 return {length,sample(u){let s=mod(u)*length;for(const p of parts){if(s<=p.length)return p.sample(s);s-=p.length;}return parts[0].sample(0);}};
}
/**
 * createAmbientLife(T,{models,createPerson,batchStaticMeshes,loopDuration})
 * batchStaticMeshes is the HOST wrapper (root,excluded=[]), not the raw library API.
 * Six cached model clones with seated occupants; twelve clones of the common rig.
 * update(seconds) is a pure time sample, including negative seeks and loop boundaries.
 * Main-road recycling occurs beyond |x|=174 (hidden); other paths are closed curves.
 * No resources owned by models are mutated/disposed. Missing car model => pedestrians
 * plus warnings, so a failed optional GLB does not prevent the scene from loading.
 */
export function createAmbientLife(T,{models={},createPerson,batchStaticMeshes,loopDuration=540}={}){
 if(typeof createPerson!=='function')throw new TypeError('createPerson callback required');
 if(!Number.isFinite(loopDuration)||loopDuration<=0)throw new RangeError('loopDuration must be positive');
 const group=new T.Group();group.name='ambient-life';
 const cars=[],pedestrians=[],warnings=[],ownedGeometries=new Set(),ownedMaterials=new Set();
 let disposed=false;
 const collect=root=>root.traverse(o=>{if(o.isMesh){ownedGeometries.add(o.geometry);for(const m of [].concat(o.material))ownedMaterials.add(m);}});
 const batch=(root,excluded=[])=>{if(batchStaticMeshes)batchStaticMeshes(root,excluded);};
 // Shared human fabrics have identical matte PBR settings. Bake their linear colors
 // into one mesh per rigid joint; garment palette variants only duplicate affected
 // color buffers. Shoulder/elbow/knee/ankle pivots and all foot transforms survive.
 const humanMaterial=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.86,metalness:0,flatShading:true});
 ownedMaterials.add(humanMaterial);
 const garmentVertices=new Map(),garmentVariants=new Map();
 function compactHuman(root,excluded=[],shirt=null){
  root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),items=[];
  root.traverse(o=>{if(!o.isMesh)return;for(let p=o;p&&p!==root;p=p.parent)if(excluded.includes(p))return;items.push(o);});
  if(!items.length)return;
  const parts=[],shirtRanges=[];let count=0;
  for(const o of items){
   if(Array.isArray(o.material)||o.material.map||o.material.transparent)throw Error('Ambient human compacting requires plain opaque shared fabrics');
   const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
   if(!g.attributes.normal)g.computeVertexNormals();const n=g.attributes.position.count;
   parts.push({g,material:o.material,offset:count});if(o.material===shirt)shirtRanges.push([count,n]);count+=n;
  }
  const positions=new Float32Array(count*3),normals=new Float32Array(count*3),colors=new Float32Array(count*3);
  for(const {g,material,offset}of parts){for(let i=0;i<g.attributes.position.count;i++)for(let axis=0;axis<3;axis++){
   positions[(offset+i)*3+axis]=g.attributes.position.getComponent(i,axis);normals[(offset+i)*3+axis]=g.attributes.normal.getComponent(i,axis);colors[(offset+i)*3+axis]=(axis===0?material.color.r:axis===1?material.color.g:material.color.b);
  }g.dispose();}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('normal',new T.BufferAttribute(normals,3));geometry.setAttribute('color',new T.BufferAttribute(colors,3));
  const mesh=new T.Mesh(geometry,humanMaterial);mesh.name='ambient-rigid-colors';mesh.castShadow=mesh.receiveShadow=true;
  items.forEach(o=>o.removeFromParent());root.add(mesh);ownedGeometries.add(geometry);if(shirtRanges.length)garmentVertices.set(geometry,shirtRanges);
 }
 function colorGarment(geometry,index){
  const ranges=garmentVertices.get(geometry);if(!ranges)return geometry;
  let variants=garmentVariants.get(geometry);if(!variants)garmentVariants.set(geometry,variants=[]);
  if(!variants[index]){const variant=geometry.clone(),color=new T.Color(shirtColors[index]),attribute=variant.attributes.color;
   for(const [start,count]of ranges)for(let i=start;i<start+count;i++)attribute.setXYZ(i,color.r,color.g,color.b);
   variants[index]=variant;ownedGeometries.add(variant);
  }return variants[index];
 }
 const paintPalette=[];
 const colors=[0xa4aaa5,0x7b929d,0xa46450];
 const shirtColors=[0x7c8e8c,0xc1b29b,0x777b94,0xa27b6b];
 const trafficRoutes=AMBIENT_LAYOUT.traffic.map(d=>({...d,route:routeFor(d)}));
 if(models.car){
  const prototype=createImportedCar(T,models.car,createPerson);
  collect(prototype.driver.group);
  // Ambient occupants never hand over props. Bake their fitted seated pose only.
  prototype.driver.group.traverse(o=>{delete o.userData.dynamic;delete o.userData.excludeFromStaticBatch;delete o.userData.skipStaticBatch;});
  compactHuman(prototype.driver.group);collect(prototype.driver.group);
  protect(prototype.driver.group);
  // Merge fixed body/steering once before cloning, then merge within each wheel.
  // Only newly generated geometry is owned here; cached GLB buffers stay untouched.
  const inputGeometry=new Set();prototype.model.traverse(o=>{if(o.isMesh)inputGeometry.add(o.geometry);});
  batch(prototype.model,prototype.wheels);
  for(const wheel of prototype.wheels){wheel.traverse(o=>{delete o.userData.dynamic;delete o.userData.excludeFromStaticBatch;delete o.userData.skipStaticBatch;});batch(wheel);protect(wheel);}
  prototype.model.traverse(o=>{if(o.isMesh&&!inputGeometry.has(o.geometry))ownedGeometries.add(o.geometry);});
  let paint;prototype.model.traverse(o=>{if(o.isMesh&&o.material.name==='body-paint')paint=o.material;});
  if(!paint)throw Error('Hatchback paint contract changed');
  ownedMaterials.add(paint);
  for(const color of colors){const material=paint.clone();material.color.set(color);material.map=null;paintPalette.push(material);ownedMaterials.add(material);}
  const driverPath=pathTo(prototype.group,prototype.driver.group);
  for(const d of trafficRoutes){
   const laps=Math.max(1,Math.round(loopDuration*d.speed/d.route.length));
   for(let i=0;i<d.count;i++){
    const carGroup=prototype.group.clone(true);carGroup.name=`ambient-car-${cars.length}`;
    const material=paintPalette[cars.length%paintPalette.length];
    carGroup.traverse(o=>{if(o.isMesh&&o.material.name==='body-paint')o.material=material;});
    const wheels=['FL','FR','RL','RR'].map(k=>carGroup.getObjectByName('wheel-'+k));
    const car={group:carGroup,wheels,driver:{group:atPath(carGroup,driverPath),static:true},routeId:d.id,
     route:d.route,laps,phase:(i+.21)/d.count,turnsPerLap:Math.round(d.route.length/(TAU*.333573)),
     speed:d.route.length*laps/loopDuration};
    if(d.id==='far-block')carGroup.traverse(o=>{if(o.isMesh)o.castShadow=false;});
    protect(carGroup);group.add(carGroup);cars.push(car);
   }
  }
 }
 else warnings.push('models.car unavailable: ambient traffic omitted');
 const proto=createPerson(T,{driver:true});
 if(proto.rig?.rootIsPelvis!==true)throw Error('Ambient walkers require the shared pelvis-root driver rig');
 for(const key of RIG_KEYS){if(!proto[key]?.isObject3D)throw Error('Missing pedestrian joint: '+key);proto[key].rotation.set(0,0,0);}
 proto.group.position.set(0,0,0);
 const shirt=proto.group.getObjectByName('Tailored shirt torso')?.material;
 if(!shirt)throw Error('Shared human torso material not found');
 collect(proto.group);
 // Optimize only rigid subtrees, retaining shoulder/elbow/hip/knee/ankle pivots.
 const pivots=RIG_KEYS.map(k=>proto[k]);
 for(const root of [proto.group,...pivots])compactHuman(root,pivots.filter(p=>p!==root),shirt);
 collect(proto.group);
 const paths=Object.fromEntries(RIG_KEYS.map(k=>[k,pathTo(proto.group,proto[k])]));

 for(const d of AMBIENT_LAYOUT.walks){
  const route=routeFor(d),laps=Math.max(1,Math.round(loopDuration*d.speed/route.length)),speed=route.length*laps/loopDuration;
  const gaitCycles=Math.max(1,Math.round(loopDuration*speed/.72)),stride=speed*loopDuration/(4*gaitCycles);
  for(let i=0;i<d.count;i++){
   const root=new T.Group();root.name=`ambient-pedestrian-${pedestrians.length}`;
   const body=proto.group.clone(true);body.name='civilian-common-rig';root.add(body);
   const rig={group:body,...Object.fromEntries(RIG_KEYS.map(k=>[k,atPath(body,paths[k])]))};
   body.traverse(o=>{if(o.isMesh)o.geometry=colorGarment(o.geometry,pedestrians.length%shirtColors.length);});
   const walker={group:root,rig,routeId:d.id,route,laps,speed,stride,gaitCycles,phase:(i+.37)/d.count,groundY:d.groundY};
   protect(root);group.add(root);pedestrians.push(walker);
  }
 }
 protect(group);
 function update(time){
  if(disposed)throw Error('Ambient life disposed');
  if(!Number.isFinite(time))throw new TypeError('Ambient time must be finite seconds');
  const clock=mod(time,loopDuration)/loopDuration;
  for(const car of cars){
   const u=clock*car.laps+car.phase,p=car.route.sample(u);
   car.group.position.set(p.x,0,p.z);car.group.rotation.set(0,p.heading,0);
   car.group.visible=car.routeId!=='westbound'||Math.abs(p.x)<174;
   for(const wheel of car.wheels)wheel.rotation.x=TAU*mod(u*car.turnsPerLap);
  }
  for(const w of pedestrians){
   const p=w.route.sample(clock*w.laps+w.phase),cycle=clock*w.gaitCycles+w.phase;
   w.group.position.set(p.x,w.groundY,p.z);w.group.rotation.set(0,p.heading,0);
   const hip=.85+.004*Math.cos(TAU*cycle*2);w.rig.group.position.y=hip;
   w.rig.head.rotation.set(0,.08*Math.sin(TAU*(clock*3+w.phase)),0);
   for(const [side,offset]of [['left',0],['right',.5]]){
    const u=mod(cycle+offset),v=(u-.5)*2;
    const z=u<.5?w.stride*(1-4*u):w.stride*(-1+2*smooth(v));
    const lift=u<.5?0:.055*Math.sin(Math.PI*v),y=.15-hip+lift;
    const a=.40,b=.33,d=Math.hypot(y,z),direction=Math.atan2(z,-y);
    const alpha=Math.acos(Math.max(-1,Math.min(1,(a*a+d*d-b*b)/(2*a*d))));
    const knee=Math.PI-Math.acos(Math.max(-1,Math.min(1,(a*a+b*b-d*d)/(2*a*b))));
    const thigh=-(direction+alpha);
    w.rig[side+'Leg'].rotation.set(thigh,0,0);w.rig[side+'Knee'].rotation.set(knee,0,0);w.rig[side+'Foot'].rotation.set(-thigh-knee,0,0);
    w.rig[side+'Arm'].rotation.set(.24*Math.cos(TAU*(cycle+offset)),0,side==='left'?.045:-.045);
    w.rig[side+'Forearm'].rotation.set(-.15,0,0);w.rig[side+'Hand'].rotation.set(0,0,0);
   }
  }
  return api;
 }
 const api={group,cars,pedestrians,layout:AMBIENT_LAYOUT,loopDuration,warnings,update,
  dispose(){if(disposed)return;disposed=true;group.removeFromParent();for(const g of ownedGeometries)g.dispose();for(const m of ownedMaterials)m.dispose();}};
 update(0);return api;
}




