import {PALETTE} from './palette.js';
import {createMaterial,seededRandom} from './materials.js';
/** Reusable street tree: branch structure and seeded, asymmetrical faceted canopy. */
export function createTree(T,{seed=12,height=5,crown=2.1,leafColor=PALETTE.leaf,model=null,maxWidth=null}={}){
 const group=new T.Group();group.name='shared-street-tree';if(model){const copy=model.clone(true),bounds=new T.Box3().setFromObject(copy),scale=height/bounds.getSize(new T.Vector3()).y;copy.scale.multiplyScalar(scale);copy.position.y-=bounds.min.y*scale;if(maxWidth){const size=bounds.getSize(new T.Vector3()),k=Math.min(1,maxWidth/(Math.max(size.x,size.z)*scale));copy.scale.x*=k;copy.scale.z*=k;}group.add(copy);return group;}const random=seededRandom(seed),bark=createMaterial(T,PALETTE.bark,{roughness:1,metalness:0}),leaves=[leafColor,PALETTE.leafShade,0x7c9f63].map(c=>createMaterial(T,c,{roughness:1,metalness:0}));
 const branch=(a,b,r1,r2)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av),o=new T.Mesh(new T.CylinderGeometry(r2,r1,v.length(),7),bark);o.position.copy(av).add(bv).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());o.castShadow=o.receiveShadow=true;group.add(o);};
 branch([0,0,0],[.06,height*.68,0],.14,.045);
 for(let i=0;i<9;i++){const angle=i*2.399+random()*.4,r=crown*(.35+random()*.48),x=Math.cos(angle)*r,z=Math.sin(angle)*r,y=height*(.62+random()*.2);branch([0,height*(.36+random()*.17),0],[x,y,z],.055,.018);const leaf=new T.Mesh(new T.IcosahedronGeometry(1,1),leaves[i%3]);leaf.position.set(x,y+.25,z);leaf.scale.set(crown*(.47+random()*.13),height*(.16+random()*.08),crown*(.46+random()*.13));leaf.rotation.set(random()*.5,angle,random()*.3);leaf.castShadow=leaf.receiveShadow=true;group.add(leaf);}
 return group;
}


