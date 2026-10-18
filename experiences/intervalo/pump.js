import {PUMP_PARTS} from './pump-source-data.js';
import {brandMark} from './brand.js';
import {createTextPlane} from './assets.js';
const cache=new WeakMap();
function typed(base64,Type){const raw=atob(base64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return new Type(bytes.buffer);}
/** Original source geometry. Parent pose and dock remain owned by simulation.js. */
export function installSourcePumps(T,station){
 let entries=cache.get(T);if(!entries){
  const white=new T.MeshStandardMaterial({color:0xe3e6e2,roughness:.42,metalness:.28}),blue=new T.MeshStandardMaterial({color:0x0064be,roughness:.35,metalness:.3}),black=new T.MeshStandardMaterial({color:0x252c31,roughness:.62,metalness:.12});
  entries=PUMP_PARTS.map(part=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(typed(part.position,Float32Array),3));g.setAttribute('normal',new T.BufferAttribute(typed(part.normal,Float32Array),3));g.setIndex(new T.BufferAttribute(typed(part.index,Uint32Array),1));
   if(part.role==='housing'){const a=g.attributes.position,idx=g.index,buckets=[[],[],[]];for(let i=0;i<idx.count;i+=3){const tri=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)],y=tri.reduce((sum,k)=>sum+a.getY(k),0)/3,mi=y<.16?2:y<.72||y>2.04?1:0;buckets[mi].push(...tri);}g.setIndex(new T.BufferAttribute(new Uint32Array(buckets.flat()),1));let offset=0;for(let i=0;i<3;i++){g.addGroup(offset,buckets[i].length,i);offset+=buckets[i].length;}}
   return {geometry:g,material:part.role==='housing'?[white,blue,black]:black,id:part.sourceNode};});cache.set(T,entries);
 }
 for(const pump of station.pumps){
  for(const c of [...pump.group.children])if(![pump.dock,pump.hose,pump.nozzle].includes(c))pump.group.remove(c);
  const housing=new T.Group();housing.name='original-ypf-pump';pump.group.add(housing);
  // This port is served by the simulation's movable nozzle. Keep the other three source nozzles.
  for(const part of entries){if(part.id===46812||part.id===46815)continue;const mesh=new T.Mesh(part.geometry,part.material);mesh.name='ypf-source-'+part.id;mesh.castShadow=mesh.receiveShadow=true;housing.add(mesh);}
  // Retrofit the selected source port to the existing interaction target. The dock
  // object stays intact; main applies its (.2,1.12,.5) position and parent yaw PI/2.
  // At that yaw the animated nozzle occupies dock x +/- .05, y +/- .09,
  // z +/- .035. Leave an open seat instead of the old solid overlapping block.
  pump.dock.clear();
  const cradle=new T.Group();cradle.name='active-nozzle-cradle';pump.dock.add(cradle);
  const hardware=entries.find(p=>p.id===46812).material;
  const bracket=(name,size,position)=>{const m=new T.Mesh(new T.BoxGeometry(...size),hardware);m.name=name;m.position.set(...position);m.castShadow=m.receiveShadow=true;cradle.add(m);return m;};
  bracket('port-cover',[.19,.70,.035],[-.025,-.22,-.083]);
  bracket('lower-mount',[.14,.045,.15],[-.025,-.50,-.165]);
  bracket('upper-mount',[.14,.045,.15],[-.025,-.03,-.165]);
  bracket('seat-spacer',[.115,.16,.025],[0,0,-.06]);
  bracket('seat-back',[.115,.21,.018],[0,0,-.044]);
  bracket('seat-left',[.02,.13,.09],[-.065,-.025,-.005]);
  bracket('seat-right',[.02,.13,.09],[.065,-.025,-.005]);
  bracket('seat-shelf',[.15,.018,.10],[0,-.099,-.003]);
  bracket('seat-lip',[.15,.035,.012],[0,-.073,.045]);
  cradle.userData={replacesSourceNodes:[46812,46815],dockLocal:[.2,1.12,.5],parentYaw:Math.PI/2,animatedNozzleOwnedBy:'simulation.js'};
  const header=new T.Mesh(new T.BoxGeometry(1.06,.31,.89),new T.MeshStandardMaterial({color:0x0064be,roughness:.42,metalness:.2}));header.name='integrated-dispenser-header';header.position.y=2.07;header.castShadow=header.receiveShadow=true;housing.add(header);
  for(const side of [-1,1]){
   const face=new T.Group();face.rotation.y=side<0?Math.PI:0;face.position.z=side*.437;housing.add(face);
   const panel=new T.Mesh(new T.BoxGeometry(.82,.40,.012),new T.MeshStandardMaterial({color:0x1c2629,roughness:.3}));panel.position.y=1.62;face.add(panel);
   for(const [label,y,w,h]of [['IMPORTE $',1.75,.34,.055],['00000.00',1.64,.57,.13],['LITROS',1.53,.25,.05],['000.00',1.45,.40,.09]]){const t=createTextPlane(T,label,{width:w,height:h,color:'#d7e5c7',font:'500 60px monospace',resolution:512});t.position.set(0,y,.012);face.add(t);}
   const badge=new T.Mesh(new T.BoxGeometry(1.02,.30,.055),new T.MeshStandardMaterial({color:0x0064be,roughness:.4,metalness:.25}));badge.name='attached-brand-header';badge.position.set(0,2.07,-.025);face.add(badge);
   brandMark(T,face,'ypf-white',{width:.53,height:.134,y:2.07,z:.016});
   const num=createTextPlane(T,String(pump.index+1).padStart(2,'0'),{width:.16,height:.15,color:'#ffffff',resolution:256});num.position.set(.40,2.07,.016);face.add(num);
   brandMark(T,face,'infinia',{width:.45,height:.09,y:.46,z:.013});
  }
  pump.group.userData.sourcePump={sourceNode:46830,height:2.239844,baseY:0,front:'+Z',longAxis:'X before parent yaw'};
 }
}

