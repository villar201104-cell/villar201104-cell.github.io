import {installIndustrialFinishLibrary} from './industrial-materials-v1/install.js';

// Exact, audited families only. Neither ancestors nor generic frame/body names
// may turn a person, tree, graphic, food or painted enclosure into exposed metal.
const localFamilies={paint:'paint',metal:'steel',rubber:'rubber',plastic:'polymer'};
const importedFamilies=new Map([
 ['body-paint','paint'],['chrome','steel'],['steel.001','steel'],
 ['rubber.001','rubber'],['black.001','polymer'],
 ['Paint Metallic Dark Grey #1','paint'],['Paint Metallic Dark Grey #2','paint'],
 ['Paint Metallic Dark Grey #3','paint'],['Hard Textured Plastic Green #1','polymer'],
 ['Hard Rough Plastic Black #24','polymer'],['Hard Rough Plastic Blue #1','polymer'],
 ['Hard Shiny Plastic Grey #2','polymer'],['Hard Shiny Plastic Black #1','polymer']
]);
export function intervaloFinishFamily(object,material){
 if(!material?.isMeshStandardMaterial||object.isSkinnedMesh||material.transparent||material.opacity<1||material.transmission>0||material.alphaTest>0||material.alphaMap||material.vertexColors||material.emissive?.getHex()>0)return null;
 // Authored art/PBR and shader surfaces retain their original response and UVs.
 if(['map','normalMap','bumpMap','roughnessMap','metalnessMap','emissiveMap','aoMap','lightMap'].some(key=>material[key]))return null;
 if(material.onBeforeCompile!==Object.getPrototypeOf(material).onBeforeCompile)return null;
 return localFamilies[material.userData.intervaloFinish]||material.userData.finishFamily||importedFamilies.get(material.name)||null;
}
export async function installIntervaloFinishes(T,{renderer,roots}){
 const originals=new Map();for(const root of roots)root?.traverse(o=>{if(o.isMesh)originals.set(o,[].concat(o.material));});
 // Keep existing daylight/RoomEnvironment. No studio HDR download or extra PMREM.
 const finishes=await installIndustrialFinishLibrary(T,{renderer,roots,quality:'optimized',reflection:'existing',classifyMaterial:intervaloFinishFamily});
 // Cars' setColor closures own the original Color objects, even after batching.
 // Sharing references preserves timed palette changes without a per-frame scan.
 for(const [object,materials]of originals)[].concat(object.material).forEach((material,i)=>{
  if(material!==materials[i]&&material.userData.industrialFinish==='paint')material.color=materials[i].color;
 });
 return finishes;
}
