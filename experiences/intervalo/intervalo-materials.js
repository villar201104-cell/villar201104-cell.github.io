// Intervalo-only finish library. No network textures, geometry changes or shared overrides.
// Values are plausible dry, clean finishes in the existing metre/daylight scene,
// not measurements of the original manufactured products.
const cache=new WeakMap();
const presets={
 paint:{roughness:.36,metalness:0,bump:.00012},
 metal:{roughness:.29,metalness:1,bump:.00006},
 rubber:{roughness:.86,metalness:0,bump:.00035},
 plastic:{roughness:.48,metalness:0,bump:.00016},
 ground:{roughness:.94,metalness:0,bump:.0012}
};
function maps(T,kind){
 let library=cache.get(T);if(!library){library=new Map();cache.set(T,library);}
 if(library.has(kind))return library.get(kind);
 const size=128,height=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4);
 let seed=179+Object.keys(presets).indexOf(kind)*917;
 const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
 const rows=Array.from({length:size},()=>random());
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=(y*size+x)*4,n=random(),coarse=.5+.25*Math.sin(x*Math.PI/16)*Math.cos(y*Math.PI/16);
  const v=kind==='metal'?.72*rows[y]+.28*n:kind==='ground'?.65*n+.35*coarse:n;
  const h=Math.round(90+v*90),r=Math.round(220+v*35);
  height.set([h,h,h,255],i);rough.set([r,r,r,255],i);
 }
 const texture=(data,label)=>{const t=new T.DataTexture(data,size,size);t.name=`Intervalo ${kind} ${label}`;t.colorSpace=T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=4;t.needsUpdate=true;return t;};
 const result={bumpMap:texture(height,'micro-height'),roughnessMap:texture(rough,'roughness')};library.set(kind,result);return result;
}
export function calibrateFinish(T,material,kind,{textured=true}={}){
 if(!presets[kind])throw new Error(`Unknown Intervalo finish: ${kind}`);
 // Existing authored skins/PBR, glass, cutouts, emissive signage and custom shaders win.
 if(!material?.isMeshStandardMaterial||material.transparent||material.opacity<1||material.alphaTest>0||material.alphaMap||material.map||material.normalMap||material.bumpMap||material.roughnessMap||material.metalnessMap||material.emissiveMap||material.emissive?.getHex()>0)return material;
 const p=presets[kind];material.roughness=p.roughness;material.metalness=p.metalness;
 if(textured){Object.assign(material,maps(T,kind));material.bumpScale=p.bump;}
 material.userData.intervaloFinish=kind;material.needsUpdate=true;return material;
}
export function createFinish(T,kind,color,{textured=true,...options}={}){
 const m=new T.MeshStandardMaterial({color,...options});return calibrateFinish(T,m,kind,{textured});
}
export function createGroundFinish(T,{color=0xb8bdb8}={}){
 const m=createFinish(T,'ground',color);m.userData.tileSize=1;return m;
}
// Body paint is owned by createImportedCar, so setColor keeps its original reference.
export function finishVehicle(T,root){
 const seen=new Set();root.traverse(o=>{if(!o.isMesh)return;for(const m of [].concat(o.material)){
  if(seen.has(m))continue;seen.add(m);
  if(m.name==='body-paint')calibrateFinish(T,m,'paint',{textured:!!o.geometry.attributes.uv});
 }});
}
// Shared map lifetime is the page lifetime; call only after disposing ALL scene materials.
export function disposeFinishMaps(T){const library=cache.get(T);if(!library)return;for(const pair of library.values())for(const t of Object.values(pair))t.dispose();cache.delete(T);}
