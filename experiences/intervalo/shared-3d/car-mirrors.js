// Replace the imported stacked oval caps with one compact, rear-facing shell.
export function refineCarMirrors(T,model,interiorMaterials=[]){
 model.updateMatrixWorld(true);const owned=[],v=new T.Vector3();let removed=0;
 model.traverse(o=>{
  if(!o.isMesh||!o.name.startsWith('body-static'))return;
  const g=o.geometry,p=g.attributes.position,ix=g.index,kept=[];
  const inMirror=i=>{v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);return Math.abs(v.x)>.91&&v.y>1.09&&v.y<1.25&&v.z>.80&&v.z<1.12;};
  for(let k=0;k<(ix?.count||p.count);k+=3){const tri=[0,1,2].map(j=>ix?ix.getX(k+j):k+j);if(tri.every(inMirror))removed++;else kept.push(...tri);}
  if(kept.length!==(ix?.count||p.count)){o.geometry=g.clone();o.geometry.setIndex(kept);o.geometry.computeBoundingBox();o.geometry.computeBoundingSphere();owned.push(o.geometry);}
 });
 const root=new T.Group();root.name='Compact rear-facing side mirrors';model.add(root);
 // Reuse the existing dark trim and polished metal: no extra draw-call groups.
 const materials=[];
 const trim=interiorMaterials[0]||new T.MeshStandardMaterial({color:0x323232,roughness:.72,metalness:.05}),glass=interiorMaterials[2]||new T.MeshStandardMaterial({color:0x9daeb3,roughness:.4,metalness:.65});
 if(!interiorMaterials[0])materials.push(trim);if(!interiorMaterials[2])materials.push(glass);
 const paintSource=[];model.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))if(m.name==='body-paint')paintSource.push(m);});
 for(const sign of [-1,1]){
  const holder=new T.Group();holder.name=sign<0?'Left mirror':'Right mirror';holder.position.set(sign*1.015,1.16,.96);holder.rotation.y=sign*.10;root.add(holder);
  // A tapered pedestal joins the door/A-pillar to the housing; no floating cap.
  const stem=new T.Mesh(new T.BoxGeometry(.19,.035,.055),trim);stem.name='Mirror support arm';stem.position.set(-sign*.105,-.016,.015);holder.add(stem);
  const base=new T.Mesh(new T.BoxGeometry(.025,.10,.09),trim);base.name='Door-mounted mirror pedestal';base.position.set(-sign*.19,-.004,.015);base.rotation.z=-sign*.10;holder.add(base);
  const shape=new T.Shape();shape.moveTo(-.095,-.035);shape.quadraticCurveTo(-.106,-.033,-.102,-.015);shape.lineTo(-.088,.035);shape.quadraticCurveTo(-.085,.043,-.06,.043);shape.lineTo(.083,.032);shape.quadraticCurveTo(.104,.029,.104,.008);shape.lineTo(.095,-.031);shape.quadraticCurveTo(.093,-.04,.075,-.04);shape.closePath();
  const geo=new T.ExtrudeGeometry(shape,{depth:.075,bevelEnabled:true,bevelThickness:.009,bevelSize:.009,bevelSegments:2,steps:1,curveSegments:4});geo.translate(0,0,-.04);
  const shell=new T.Mesh(geo,paintSource[0]||trim);shell.name='Single tapered mirror housing';holder.add(shell);
  const glassGeo=new T.ShapeGeometry(shape,5);glassGeo.scale(.84,.76,1);glassGeo.rotateY(Math.PI);
  const insert=new T.Mesh(glassGeo,glass);insert.name='Rear-facing reflective mirror';insert.position.z=-.050;holder.add(insert);
 }
 root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;owned.push(o.geometry);}});
 root.userData.removedTriangles=removed;
 return {root,geometries:owned,materials};
}
