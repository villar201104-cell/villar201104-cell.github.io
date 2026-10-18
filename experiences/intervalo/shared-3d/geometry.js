/** Static mesh batching; decodes quantized attributes before baking transforms. */
export function batchStaticMeshes(T,root,excluded=[],mergeGeometries){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),batches=new Map();
 root.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh||o.isInstancedMesh||Array.isArray(o.material)||o.material.transparent)return;
  for(let p=o;p;p=p.parent){
   if(excluded.includes(p)||!p.visible||p.userData.excludeFromStaticBatch||p.userData.skipStaticBatch||p.userData.dynamic)return;
   if(p===root)break;
  }
  const key=o.material.uuid+'-'+o.castShadow+'-'+o.receiveShadow;let entry=batches.get(key);if(!entry){entry={items:[],material:o.material,cast:o.castShadow,receive:o.receiveShadow};batches.set(key,entry);}entry.items.push(o);
 });
 for(const b of batches.values()){if(b.items.length<2)continue;const geometries=b.items.map(o=>{let g=o.geometry.clone();if(g.index)g=g.toNonIndexed();g.deleteAttribute('tangent');for(const [name,attribute]of Object.entries(g.attributes)){if(attribute.normalized||!(attribute.array instanceof Float32Array)){const decoded=new Float32Array(attribute.count*attribute.itemSize);for(let i=0;i<attribute.count;i++)for(let j=0;j<attribute.itemSize;j++)decoded[i*attribute.itemSize+j]=attribute.getComponent(i,j);g.setAttribute(name,new T.BufferAttribute(decoded,attribute.itemSize));}}g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));return g;});
  for(const g of geometries){if(!g.getAttribute('uv'))g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.getAttribute('position').count*2),2));}
  const merged=mergeGeometries(geometries,false);if(!merged){geometries.forEach(g=>g.dispose());continue;}
  const m=new T.Mesh(merged,b.material);m.castShadow=b.cast;m.receiveShadow=b.receive;root.add(m);b.items.forEach(o=>o.removeFromParent());geometries.forEach(g=>g.dispose());
 }
}



