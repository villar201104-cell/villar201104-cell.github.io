const cache=new WeakMap();
const urls={ypf:'./brand/ypf.svg','ypf-white':'./brand/ypf-white.svg',full:'./brand/full.svg',infinia:'./brand/infinia.webp'};
export function brandMark(T,parent,key,{width=1,height=.3,x=0,y=0,z=0,rotation=0}={}){
 let entries=cache.get(T);if(!entries){entries={};cache.set(T,entries);}let material=entries[key];
 if(!material){let map=null;if(typeof document!=='undefined'){map=new T.TextureLoader().load(urls[key]);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;}material=new T.MeshBasicMaterial({map,color:0xffffff,transparent:true,alphaTest:.04,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});entries[key]=material;}
 const mesh=new T.Mesh(new T.PlaneGeometry(width,height),material);mesh.position.set(x,y,z);mesh.rotation.y=rotation;mesh.name='brand-'+key;parent.add(mesh);return mesh;
}
