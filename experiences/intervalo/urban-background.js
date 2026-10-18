import {seededRandom,createMaterial} from './shared-3d/index.js';

export const CITY_GRID={spacing:64,roadWidth:10,min:-5,max:5,extent:760};
// The foreground remains authored around Intervalo. Background blocks start beyond
// the complete camera orbit, and each parcel stays clear of its surrounding streets.
export function cityParcels(){
 const rng=seededRandom(7819),parcels=[];
 for(let i=-5;i<=5;i++)for(let j=-5;j<=5;j++)for(const dx of [-13,13])for(const dz of [-13,13]){
  const x=6+i*64+dx,z=-13+j*64+dz;
  if(Math.hypot(x,z)<88)continue;
  const w=17+rng()*6,d=17+rng()*6,floors=2+Math.floor(rng()*7);
  parcels.push({x,z,w,d,floors,h:3+floors*2.9,color:[0xc4beb0,0xd3d0c5,0xb3b9b6,0xc3b8a7,0xd8d4c8,0xaeb6b7][Math.floor(rng()*6)]});
 }
 return parcels;
}
// Small planted courtyards use only the leftover space between actual parcels.
// One instanced draw for groundcover and one for low shrubs; no extra detailed trees.
export function cityGreens(){
 const parcels=cityParcels(),greens=[];
 for(let i=CITY_GRID.min;i<=CITY_GRID.max;i++)for(let j=CITY_GRID.min;j<=CITY_GRID.max;j++){
  const x=6+i*64,z=-13+j*64;if(Math.hypot(x,z)<100)continue;
  const nearby=parcels.filter(p=>Math.abs(p.x-x)<30&&Math.abs(p.z-z)<30);
  const overlaps=(cx,cz,w,d,p)=>Math.abs(cx-p.x)<(w+p.w)/2+.16&&Math.abs(cz-p.z)<(d+p.d)/2+.16;
  const core={x,z,w:2.6,d:2.6};if(!nearby.some(p=>overlaps(x,z,2.6,2.6,p)))greens.push(core);
  for(let dx=-23;dx<=23;dx+=2)for(let dz=-23;dz<=23;dz+=2){const cx=x+dx,cz=z+dz;if(Math.abs(dx)<2.3&&Math.abs(dz)<2.3)continue;if(!nearby.some(p=>overlaps(cx,cz,1.88,1.88,p)))greens.push({x:cx,z:cz,w:1.88,d:1.88});}
 }
 return greens;
}
export function addUrbanBackground(T,parent){
 const g=new T.Group();g.name='extended-city-blocks';parent.add(g);
 const body=[],roofs=[],windows=[],shops=[],details=[],greens=[],shrubs=[],dummy=new T.Object3D();
 for(const b of cityParcels()){
  const {x,z,w,d,h,floors,color}=b;
  body.push([x,h/2,z,w,h,d,color]);roofs.push([x,h+.11,z,w+.25,.22,d+.25,0xd7d6cc]);
  body.push([x-w*.22,h+.9,z-d*.15,w*.3,1.8,d*.3,color]);
  // Vary solid party walls, corner setbacks and the skyline without extra draw calls.
  if(floors>4){body.push([x+w*.25,h+1.7,z-d*.2,w*.27,3.4,d*.38,color]);roofs.push([x+w*.25,h+3.45,z-d*.2,w*.28,.10,d*.39,0xaaa99f]);}
  for(const side of [-1,1])details.push([x,3.10,z+side*(d/2+.06),w,.16,.12,0xd0ccc0]);
  for(let f=0;f<floors;f++)for(let bay=0;bay<4;bay++){
   const y=4.5+f*2.9,u=(bay-1.5)/4;
   for(const side of [-1,1]){
    windows.push([x+u*w,y,z+side*(d/2+.025),1.5,1.65,.04,(bay+f)%4===0?0x89928b:0x58696c]);
    if(bay%2===0&&floors>3)details.push([x+u*w,y-.95,z+side*(d/2+.31),2.1,.12,.65,0xb9b9af]);
    windows.push([x+side*(w/2+.025),y,z+u*d,.04,1.65,1.5,0x65757a]);
   }
  }
  for(const side of [-1,1]){shops.push([x,1.4,z+side*(d/2+.025),w*.76,2.4,.04,0x535e60]);shops.push([x+side*(w/2+.025),1.4,z,.04,2.4,d*.76,0x535e60]);}
 }
 function instances(name,items,roughness,geometry=new T.BoxGeometry(1,1,1)){
  const mesh=new T.InstancedMesh(geometry,createMaterial(T,0xffffff,{roughness,metalness:0}),items.length);mesh.name=name;
  items.forEach(([x,y,z,w,h,d,c],i)=>{dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new T.Color(c));});
  mesh.castShadow=false;mesh.receiveShadow=false;mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();g.add(mesh);
 }
 for(const [i,p]of cityGreens().entries()){greens.push([p.x,.035,p.z,p.w,.05,p.d,i%3?0x7a8b70:0x697e62]);if(i%13===0)shrubs.push([p.x,.27,p.z,Math.min(1.15,p.w-.3),.43,Math.min(.9,p.d-.3),0x586f52]);}
 instances('background-courtyard-green',greens,1,new T.PlaneGeometry(1,1).rotateX(-Math.PI/2));instances('background-courtyard-shrubs',shrubs,1);
 instances('background-facade-details',details,.85);instances('background-building-walls',body,.9);instances('background-roof-caps',roofs,.9);instances('background-windows',windows,.6);instances('background-shopfronts',shops,.7);
 return g;
}
