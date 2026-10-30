// Portable PBR finishes. THREE is injected: do not bundle a second engine copy.
// Assets: ambientCG Metal032 + Poly Haven Studio Small 08, CC0.
export async function createIndustrialFinishes(T,{renderer,roots,reflectionMap=null,assetBase=new URL('./textures/',import.meta.url),quality='optimized',anisotropy=4,classifyMaterial=null}={}){
 const loader=new T.TextureLoader(),ownedMaterials=new Set(),ownedGeometry=new Set(),materialCache=new Map(),geometryCache=new Map(),records=[];
 const report={version:'1.1.0',meshes:0,mappedMeshes:0,byFamily:{},textureBytes:33456,loadedTextureBytes:0,quality,skippedAuthoredMaps:0};
 const textures=[],promises=[];let detailReady=false,optimizedReady=false;
 async function loadDetail(normal){
  const files=['metal-rough-512.jpg','metal-normal-512.jpg'];
  for(const i of normal?[0,1]:[0]){promises[i]??=loader.loadAsync(new URL(files[i],assetBase).href);textures[i]=await promises[i];const t=textures[i];t.colorSpace=T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.channel=2;t.anisotropy=Math.min(i===0?2:anisotropy,renderer.capabilities.getMaxAnisotropy());report.loadedTextureBytes=(textures[0]?25009:0)+(textures[1]?8447:0);t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;}
 }
 const profiles={steel:[.30,.98],alloy:[.45,.93],paint:[.44,0],rubber:[.88,0],polymer:[.57,0],copper:[.32,.98],bronze:[.37,.95]};
 function classify(o,m){
  if(!m.isMeshStandardMaterial||o.isSkinnedMesh||m.transparent||m.opacity<1||m.transmission>0||m.emissive?.getHex()>0)return null;
  // Host may opt into exact material assignments instead of Crown name heuristics.
  if(classifyMaterial){const family=classifyMaterial(o,m);return profiles[family]?family:null;}
  const n=(o.name+' '+(o.parent?.name||'')).toLowerCase().replaceAll('_',' ');
  if(/skin|finger|hair|face|cloth|leaf|grass|decal|logo|display|screen|lamp|light|signal|carton|wood|pallet deck|runner|window|windshield/.test(n))return null;
  if(/^(Sealed cartridge envelope|nose[ _]shell|vizcom[ _]body|battery[ _]cover)/i.test(o.name)||/Warm alloy shell/i.test(m.name))return 'paint';
  const explicit=o.userData.finishFamily||m.userData.finishFamily;
  if(profiles[explicit])return explicit;
  if(/copper|winding|coil/.test(n))return 'copper';
  if(/bronze|brass/.test(n))return 'bronze';
  if(/rubber|tyre|tire|grip|tread|belt|gasket|hose|seal|cushion/.test(n))return 'rubber';
  if(/connector|plug|socket|plastic|radio|handle|switch|impeller|propeller blade/.test(n))return 'polymer';
  if(/piston|shaft|roller|bearing|bolt|fastener|hinge|rod|rail|steel|chrome|screw|washer|chain|wheel lug/.test(n)||m.userData.finishClass==='metal')return 'steel';
  if(/alloy|machined|motor can|motor end|reducer|gearbox/.test(n))return 'alloy';
  if(/shell|cartridge|hood|counterweight|panel|hull|fairing|guard|casing|nose|saddle|duct|body|housing|cover|frame|mast|fork/.test(n)||m.userData.finishClass==='paint')return 'paint';
  return m.metalness>.65?'alloy':null;
 }
 function mapGeometry(g){
  if(geometryCache.has(g))return geometryCache.get(g);
  if(!g.attributes.position||!g.attributes.normal||g.attributes.uv2)return null;
  const c=g.clone(),p=c.attributes.position,n=c.attributes.normal,uv=new Float32Array(p.count*2),tile=.1;
  // Secondary UVs keep artwork, existing UVs and every vertex position intact.
  for(let i=0;i<p.count;i++){
   const x=Math.abs(n.getX(i)),y=Math.abs(n.getY(i)),z=Math.abs(n.getZ(i));
   const u=z>=x&&z>=y?p.getX(i):x>=y?p.getY(i):p.getX(i);
   const v=z>=x&&z>=y?p.getY(i):x>=y?p.getZ(i):p.getZ(i);uv[i*2]=u/tile;uv[i*2+1]=v/tile;
  }
  c.setAttribute('uv2',new T.BufferAttribute(uv,2));geometryCache.set(g,c);ownedGeometry.add(c);return c;
 }
 function finish(m,family,detailed,canMap){
  const key=m.uuid+'/'+family+'/'+detailed+'/'+canMap;if(materialCache.has(key))return materialCache.get(key);
  const result=m.clone();result.onBeforeCompile=m.onBeforeCompile;result.customProgramCacheKey=m.customProgramCacheKey;
  [result.roughness,result.metalness]=profiles[family];
  if(reflectionMap){result.envMap=reflectionMap;result.envMapIntensity=['steel','alloy','copper','bronze'].includes(family)?.65:.35;}
  if(detailed&&canMap){result.roughnessMap=textures[0];if(detailed===true)result.normalMap=textures[1];result.roughness/=.9;result.normalScale=new T.Vector2(family==='alloy'?.18:.10,family==='alloy'?.18:.10);}
  result.name='Industrial '+family+' / '+m.name;result.userData={...m.userData,industrialFinish:family,finishVersion:'1.1.0'};ownedMaterials.add(result);materialCache.set(key,result);return result;
 }
 const seen=new Set();for(const root of roots)root?.traverse(o=>{
  if(!o.isMesh||seen.has(o))return;seen.add(o);
  const originals=Array.isArray(o.material)?o.material:[o.material],families=originals.map(m=>classify(o,m));if(!families.some(Boolean))return;
  const eligible=originals.map((m,i)=>['steel','alloy','copper','bronze'].includes(families[i])&&!m.normalMap&&!m.bumpMap&&!m.roughnessMap);
  const balanced=originals.map((m,i)=>families[i]?finish(m,families[i],false,false):m);
  records.push({o,original:o.material,originals,families,eligible,geometry:o.geometry,mapped:null,balanced:Array.isArray(o.material)?balanced:balanced[0],detailed:null});
  report.meshes++;for(const f of families)if(f)report.byFamily[f]=(report.byFamily[f]||0)+1;
  report.skippedAuthoredMaps+=originals.filter(m=>m.normalMap||m.bumpMap||m.roughnessMap).length;
 });
 let current=quality,desired=quality,request=0;
 async function setQuality(value){if(!['original','balanced','optimized','detail'].includes(value))throw Error('Unknown finish quality: '+value);
  const token=++request;desired=value;
  const mappedMode=value==='detail'||value==='optimized';
  if(mappedMode&&!(value==='detail'?detailReady:optimizedReady)){
   await loadDetail(value==='detail');if(token!==request)return;
   for(const r of records){if(!r.mapped&&r.eligible.some(Boolean)){r.mapped=mapGeometry(r.geometry);if(r.mapped)report.mappedMeshes++;}
    const materials=r.originals.map((m,i)=>r.families[i]?finish(m,r.families[i],value==='detail'?true:'rough',!!r.mapped&&r.eligible[i]):m);
    r[value]=Array.isArray(r.original)?materials:materials[0];
   }
   if(value==='detail')detailReady=true;else optimizedReady=true;
  }
  current=value;report.quality=value;
  for(const r of records){r.o.material=value==='original'?r.original:mappedMode?r[value]:r.balanced;r.o.geometry=mappedMode&&r.mapped?r.mapped:r.geometry;}
  dispatchEvent(new Event('crown-scene-change'));
 }
 await setQuality(current);
 return {report,setQuality,reapply:()=>setQuality(desired),get quality(){return current},dispose(){setQuality('original');for(const m of ownedMaterials)m.dispose();for(const g of ownedGeometry)g.dispose();for(const t of textures||[])t.dispose();}};
}
