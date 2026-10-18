import {createMaterial} from './materials.js';
export async function loadSharedModels(loader){
 const entries=[['bench','street-bench.glb'],['tree','tree-urban.glb'],['treeJacaranda','tree-jacaranda.glb'],['car','car-hatchback.glb']];
 const results=await Promise.allSettled(entries.map(async([key,file])=>[key,(await loader.loadAsync(new URL('./models/'+file,import.meta.url).href)).scene]));
 const models={};for(let i=0;i<results.length;i++){const result=results[i];if(result.status==='fulfilled'){const[key,scene]=result.value;const seen=new Set();scene.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;for(const m of [].concat(o.material)){if(seen.has(m))continue;seen.add(m);if(key!=='car'){m.roughness=Math.max(.6,m.roughness);if(m.normalScale)m.normalScale.multiplyScalar(.55);}}}});models[key]=scene;}else console.warn('Shared asset unavailable: '+entries[i][0],result.reason);}
 return models;
}
export function createBench(T,model){const group=new T.Group();group.name='shared-street-bench';if(model){group.add(model.clone(true));return group;}const wood=createMaterial(T,0x9b8668),metal=createMaterial(T,0x616c70);for(let i=0;i<4;i++){const m=new T.Mesh(new T.BoxGeometry(2.3,.05,.11),wood);m.position.set(0,.45,-.18+i*.12);group.add(m);}for(const x of [-.95,.95]){const m=new T.Mesh(new T.BoxGeometry(.08,.45,.45),metal);m.position.set(x,.225,0);group.add(m);}return group;}


