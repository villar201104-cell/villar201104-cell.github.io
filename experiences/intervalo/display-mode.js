import {createNeutralMaterial} from './shared-3d/materials.js';
import {NEUTRAL} from './shared-3d/palette.js';
// Clone per material; retain texture alpha so leaves stay leaves in neutral view.
export function createDisplayMode(T,scene,highlights=[]){
 const original=new Map(),neutral=new Map(),sky=scene.background.clone(),fog=scene.fog.color.clone();
 const highlighted=new Set();for(const root of highlights)root.traverse(o=>highlighted.add(o));
 scene.traverse(o=>{if(o.isMesh&&!highlighted.has(o))original.set(o,o.material);});
 function clay(material){
  if(neutral.has(material))return neutral.get(material);
  const m=createNeutralMaterial(T,material);
  neutral.set(material,m);return m;
 }
 return {set(mode){const active=mode==='focus';for(const [object,material]of original)object.material=active?(Array.isArray(material)?material.map(clay):clay(material)):material;scene.background.copy(active?new T.Color(NEUTRAL.sky):sky);scene.fog.color.copy(active?new T.Color(NEUTRAL.sky):fog);},dispose(){for(const m of neutral.values())m.dispose();}};
}


