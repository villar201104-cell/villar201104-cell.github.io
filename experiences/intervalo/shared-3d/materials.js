import {PALETTE} from './palette.js';
export function seededRandom(seed=9123){return ()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);}
export function createMaterial(T,color=PALETTE.ivory,options={}){return new T.MeshStandardMaterial({color,roughness:.65,metalness:.12,flatShading:true,...options});}
export function createSurfaceMaterial(T,{color=PALETTE.concrete,seed=9123,grain=.007,repeat=20,roughness=.94}={}){const random=seededRandom(seed),pixels=new Uint8Array(128*128*4);for(let i=0;i<128*128;i++){const v=224+Math.floor(random()*32);pixels.set([v,v,v,255],i*4);}const texture=new T.DataTexture(pixels,128,128);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(repeat,repeat);texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.needsUpdate=true;return createMaterial(T,color,{roughness,metalness:0,bumpMap:texture,bumpScale:grain});}

export function createAsphaltMaterial(T){
 const loader=new T.TextureLoader();
 const load=(file,color=false)=>{const t=loader.load(new URL('./textures/asphalt/'+file+'.jpg',import.meta.url).href);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;if(color)t.colorSpace=T.SRGBColorSpace;return t;};
 const m=new T.MeshStandardMaterial({color:0xc8cccd,map:load('color',true),normalMap:load('normal'),roughnessMap:load('roughness'),roughness:.95,metalness:0,normalScale:new T.Vector2(.28,.28)});
 m.userData.tileSize=2;return m;
}
