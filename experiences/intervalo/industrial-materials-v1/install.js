import {createIndustrialFinishes} from './industrial-finishes.js';
import {createHDRLoader} from './hdr-loader-factory.js';
export async function installIndustrialFinishLibrary(T,{renderer,roots,quality='optimized',reflection='studio',classifyMaterial=null,assetBase=new URL('./textures/',import.meta.url)}={}){
 let target=null;
 if(reflection==='studio'&&quality!=='original'){
  try{const HDRLoader=createHDRLoader(T),hdr=await new HDRLoader().loadAsync(new URL('studio_small_08_1k.hdr',assetBase).href);const pm=new T.PMREMGenerator(renderer);target=pm.fromEquirectangular(hdr);hdr.dispose();pm.dispose();}
  catch(error){console.warn('Industrial finishes: using existing scene reflections.',error);}
 }
 // Initialize one owner before optional maps, so a failed request cannot orphan clones.
 const result=await createIndustrialFinishes(T,{renderer,roots,reflectionMap:target?.texture,assetBase,quality:quality==='original'?'original':'balanced',classifyMaterial});
 if(quality!=='original'&&quality!=='balanced'){
  try{await result.setQuality(quality);}
  catch(error){console.warn('Industrial finishes: detail textures unavailable; balanced fallback.',error);await result.setQuality('balanced');}
 }
 const dispose=result.dispose;result.dispose=()=>{dispose();target?.dispose();};return result;
}
