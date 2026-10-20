import {WORLD_STYLE} from './world-style.js';
import {PALETTE,NEUTRAL} from './palette.js';
export function createNeutralMaterial(T,material){
 const m=material.clone(),color=new T.Color(NEUTRAL.surface);m.color?.copy(color);
 for(const key of ['normalMap','bumpMap','roughnessMap','metalnessMap','aoMap','emissiveMap'])if(key in m)m[key]=null;
 if('roughness'in m)m.roughness=NEUTRAL.roughness;if('metalness'in m)m.metalness=NEUTRAL.metalness;
 m.emissive?.setHex(0);
 // Preserve mapped opacity (leaves/glass), while replacing albedo/vertex tint.
 m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb = vec3('+color.toArray().map(v=>v.toFixed(6)).join(',')+');');};
 m.customProgramCacheKey=()=> 'portfolio-neutral-alpha-0.2';return m;
}
export function seededRandom(seed=9123){return ()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);}
export function createMaterial(T,color=PALETTE.ivory,options={}){return new T.MeshStandardMaterial({color,...WORLD_STYLE.materials.product,flatShading:false,...options});}
export function createSurfaceMaterial(T,{color=PALETTE.concrete,seed=9123,grain=.007,repeat=20,roughness=.94}={}){const random=seededRandom(seed),pixels=new Uint8Array(128*128*4);for(let i=0;i<128*128;i++){const v=224+Math.floor(random()*32);pixels.set([v,v,v,255],i*4);}const texture=new T.DataTexture(pixels,128,128);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(repeat,repeat);texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.needsUpdate=true;return createMaterial(T,color,{roughness,metalness:0,bumpMap:texture,bumpScale:grain});}

export function createAsphaltMaterial(T){
 const loader=new T.TextureLoader();
 const load=(file,color=false)=>{const t=loader.load(new URL('./textures/asphalt/'+file+'.jpg',import.meta.url).href);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;if(color)t.colorSpace=T.SRGBColorSpace;return t;};
 const m=new T.MeshStandardMaterial({color:0xc8cccd,map:load('color',true),normalMap:load('normal'),roughnessMap:load('roughness'),roughness:.95,metalness:0,normalScale:new T.Vector2(.28,.28)});
 m.userData.tileSize=2;return m;
}
