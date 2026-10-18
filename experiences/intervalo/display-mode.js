// Clone per material; retain texture alpha so leaves stay leaves in neutral view.
export function createDisplayMode(T,scene,highlights=[]){
 const original=new Map(),neutral=new Map(),sky=scene.background.clone(),fog=scene.fog.color.clone();
 const highlighted=new Set();for(const root of highlights)root.traverse(o=>highlighted.add(o));
 scene.traverse(o=>{if(o.isMesh&&!highlighted.has(o))original.set(o,o.material);});
 function clay(material){
  if(neutral.has(material))return neutral.get(material);
  const m=material.clone();
  m.color?.setHex(material.transparent?0xbac2c5:0xe7e8e2);
  for(const key of ['normalMap','bumpMap','roughnessMap','metalnessMap','aoMap','emissiveMap'])if(key in m)m[key]=null;
  if('roughness'in m)m.roughness=.84;if('metalness'in m)m.metalness=.03;
  m.emissive?.setHex(0);m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb = vec3(0.55, 0.555, 0.53);');};
  m.customProgramCacheKey=()=> 'intervalo-neutral-alpha-v2';
  neutral.set(material,m);return m;
 }
 return {set(mode){const active=mode==='focus';for(const [object,material]of original)object.material=active?(Array.isArray(material)?material.map(clay):clay(material)):material;scene.background.copy(active?new T.Color(0xe9e8e2):sky);scene.fog.color.copy(active?new T.Color(0xe9e8e2):fog);},dispose(){for(const m of neutral.values())m.dispose();}};
}


