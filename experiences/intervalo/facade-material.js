/** Running-bond brick tile: metric UVs are assigned by environment.box on every face. */
export function createBrickMaterial(T){
 const size=384,pixels=new Uint8Array(size*size*4);let state=941;
 const random=()=>((state=(state*1664525+1013904223)>>>0)/4294967296);
 const shades=Array.from({length:12},()=>Array.from({length:4},()=>.86+random()*.19));
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const row=Math.floor(y/32),xx=(x+(row%2)*48)%size,column=Math.floor(xx/96),joint=y%32<3||xx%96<3;
  const noise=(random()-.5)*8,c=joint?[121,116,105]:[158*shades[row][column],116*shades[row][column],89*shades[row][column]];
  const at=(y*size+x)*4;for(let k=0;k<3;k++)pixels[at+k]=Math.max(0,Math.min(255,Math.round(c[k]+noise)));pixels[at+3]=255;
 }
 const map=new T.DataTexture(pixels,size,size);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.generateMipmaps=true;map.minFilter=T.LinearMipmapLinearFilter;map.anisotropy=4;map.needsUpdate=true;
 const material=new T.MeshStandardMaterial({name:'Metric running-bond brick',map,roughness:.93,metalness:0,bumpMap:map,bumpScale:.003});material.userData.tileSize=.96;return material;
}
