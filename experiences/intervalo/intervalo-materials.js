// Intervalo base finishes. R44 optimized finishes are installed once after batching.
// Values are plausible dry, clean finishes in the existing metre/daylight scene,
// not measurements of the original manufactured products.

const presets={
 paint:{roughness:.36,metalness:0},
 metal:{roughness:.29,metalness:1},
 rubber:{roughness:.86,metalness:0},
 plastic:{roughness:.48,metalness:0},
 ground:{roughness:.94,metalness:0}
};
export function calibrateFinish(T,material,kind,{textured=true}={}){
 if(!presets[kind])throw new Error(`Unknown Intervalo finish: ${kind}`);
 // Existing authored skins/PBR, glass, cutouts, emissive signage and custom shaders win.
 if(!material?.isMeshStandardMaterial||material.transparent||material.opacity<1||material.alphaTest>0||material.alphaMap||material.map||material.normalMap||material.bumpMap||material.roughnessMap||material.metalnessMap||material.emissiveMap||material.emissive?.getHex()>0)return material;
 const p=presets[kind];material.roughness=p.roughness;material.metalness=p.metalness;
 // R32: generic micro-height maps added cost without legible surface detail.
 // Keep scalar PBR calibration; authored asphalt/skins retain their original maps.
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
export function disposeFinishMaps(T){}
