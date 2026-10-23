import {createMaterial,createSurfaceMaterial,createAsphaltMaterial,createTree,createBench,seededRandom,PALETTE} from './shared-3d/index.js';
import {addUrbanBackground,CITY_GRID} from './urban-background.js';
import {installSourcePumps} from './pump.js';
import {brandMark} from './brand.js';
import {createTextPlane} from './assets.js';
import {createImportedCar} from './shared-3d/index.js';
import {createBrickMaterial} from './facade-material.js';

/** Reference-informed adaptation: YPF Directorio / Varela, Flores, Buenos Aires.
 * Keeps Intervalo's three-island coordinates and service paths. Not a measured replica. */
export function upgradeEnvironment(T,station,{models={}}={}){
 const g=station.group,keep=new Set([...station.islands.map(x=>x.group),...station.pumps.map(x=>x.group)]);
 for(const child of [...g.children])if(!keep.has(child))g.remove(child);
 const materialCache=new Map();
 const M=(c,o={})=>{const key=String(c)+JSON.stringify(o);if(!materialCache.has(key))materialCache.set(key,createMaterial(T,c,o));return materialCache.get(key);},white=M(0xd9d9d6,{roughness:.82,metalness:0}),blue=M(0x0063c2,{roughness:.75,metalness:0}),dark=M(0x454447,{roughness:.82,metalness:0}),steel=M(PALETTE.steel),wood=M(0x9b8668,{roughness:.9,metalness:0});
 const concrete=createSurfaceMaterial(T,{color:0xb8bdb8,grain:.0025,repeat:20}),asphalt=createAsphaltMaterial(T),pavement=createSurfaceMaterial(T,{color:0xb7b9b2,grain:.002,repeat:16}),plaster=createSurfaceMaterial(T,{color:0xd1d0c9,grain:.002,repeat:8}),mark=M(0xe5e3d6,{roughness:.95,metalness:0});
 const box=(p,w,h,d,m,x=0,y=0,z=0)=>{const geo=new T.BoxGeometry(w,h,d);if(m.userData.tileSize){const uv=geo.attributes.uv,n=geo.attributes.normal,pos=geo.attributes.position,tile=m.userData.tileSize;for(let i=0;i<uv.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));uv.setXY(i,(nx>.5?pos.getZ(i):pos.getX(i))/tile,(ny>.5?pos.getZ(i):pos.getY(i))/tile);}}const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;};
 const cyl=(p,rt,rb,h,m,x=0,y=0,z=0,n=12)=>{const o=new T.Mesh(new T.CylinderGeometry(rt,rb,h,n),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;};
 const line=(p,a,b,r,m)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av),o=cyl(p,r,r,v.length(),m);o.position.copy(av).add(bv).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;};
 const text=(p,t,w,h,x,y,z,color='#ffffff',rotation=0)=>{const o=createTextPlane(T,t,{width:w,height:h,color,font:`600 ${Math.round(Math.max(64,2048*h/w)*.82)}px Arial`,resolution:2048});o.position.set(x,y,z);o.rotation.y=rotation;p.add(o);return o;};
 const ground=box(g,6000,.25,6000,pavement,0,-.23,0);ground.name='city-ground';ground.castShadow=false;
 box(g,40,.13,30,concrete,0,-.065,-1);
 const road=new T.Group();road.name='urban-streets';g.add(road);
 for(let i=CITY_GRID.min;i<=CITY_GRID.max;i++){
  const rx=-26+i*64,rz=19+i*64;
  box(road,760,.035,10,asphalt,0,-.02,rz);
  // Vertical segments stop at intersections: one asphalt surface per junction.
  for(let j=CITY_GRID.min-1;j<=CITY_GRID.max;j++)box(road,10,.035,54,asphalt,rx,-.02,19+j*64+32);
  for(let j=CITY_GRID.min;j<CITY_GRID.max;j++)for(const side of [-1,1]){
   if(!(i===0&&j===0&&side===-1))box(g,48,.15,3,pavement,-26+j*64+32,.075,rz+side*6.5);
   if(!(i===0&&j===-1&&side===1))box(g,3,.15,54,pavement,rx+side*6.5,.075,19+j*64+32);
  }
 }
 for(let x=-370;x<375;x+=5.5)if(Math.abs((((x+26)%64+64)%64)-32)<25)box(road,2.6,.007,.10,mark,x,.003,19);
 for(let z=-370;z<375;z+=5.5)if(Math.abs((((z-19)%64+64)%64)-32)<25)box(road,.10,.007,2.6,mark,-26,.003,z);
 // Forecourt expansion joints, drains and road-side paving, with entry openings.
 const joint=M(0x999e9a,{roughness:1,metalness:0});
 for(let x=-18;x<=18;x+=4)box(g,.012,.003,26,joint,x,.003,-.3);
 for(let z=-12;z<=12;z+=4)box(g,38,.003,.012,joint,0,.003,z);
 for(const [x,w]of [[-17,6],[-10,1.4],[0,1.4],[10,1.4],[17.7,4.6]])box(g,w,.15,1.75,pavement,x,.075,13.125);
 for(const [z,d]of [[-19,10],[4,18]])box(g,1.8,.15,d,pavement,-20.1,.075,z);
 box(g,3,.15,30,pavement,21.5,.075,-1);
 box(g,3,.15,16,pavement,-19.5,.075,-32);
 box(g,7,.15,3,pavement,26.5,.075,12.5);
 
 // Expansion joints stay on actual curb segments, not across vehicle exits.
 for(const [x,w]of [[-17,6],[-10,1.4],[0,1.4],[10,1.4],[17.7,4.6]])for(let dx=-w/2+.5;dx<w/2;dx+=1.2)box(g,.009,.002,1.72,joint,x+dx,.151,13.125);
 box(g,1,.13,9,concrete,-20.5,-.065,-9.5); // Continuous side-entry apron.
 box(g,10,.13,8,concrete,18,-.065,-19);
 for(let i=0;i<7;i++){box(road,.58,.008,3.6,mark,-21.7+i*1.3,.006,20.8);box(road,3.6,.008,.58,mark,-27.8,.006,12.3+i*1.3);}
 for(const x of [-14,4,18]){box(g,1,.012,.28,dark,x,.004,10.7);for(let i=0;i<13;i++)box(g,.025,.013,.26,steel,x-.45+i*.075,.011,10.7);}
 // White deep fascia and blue cap from the Flores reference; light ribbed soffit.
 const roof=new T.Group();roof.name='hideable-canopy';g.add(roof);
 box(roof,35,.18,22,white,0,5.42,-2.6);
 for(const z of [-13.52,8.32])box(roof,35,.90,.18,white,0,5.91,z);
 for(const x of [-17.41,17.41])box(roof,.18,.90,21.8,white,x,5.91,-2.6);
 box(roof,35.1,.13,22.1,blue,0,6.42,-2.6);box(roof,34.8,.09,21.8,dark,0,6.51,-2.6);
 for(let x=-17;x<18;x+=1.15)box(roof,.018,.01,21.8,joint,x,5.325,-2.6);
 box(roof,4.5,.88,.045,blue,-12,5.92,8.43);brandMark(T,roof,'ypf-white',{width:3.25,height:.822,x:-12,y:5.92,z:8.46});
 box(roof,.035,.88,4.5,blue,-17.515,5.92,-2.8);brandMark(T,roof,'ypf-white',{width:3.25,height:.822,x:-17.54,y:5.92,z:-2.8,rotation:-Math.PI/2});
 const columns=new T.Group();g.add(columns);for(const x of [-16.5,16.5])for(const z of [-10,6]){cyl(columns,.20,.24,5.34,white,x,2.67,z,20);cyl(columns,.28,.29,.20,steel,x,.10,z,20);}
 const led=M(0xf3f4eb,{emissive:0xf3f4eb,emissiveIntensity:.65,roughness:.4}),canopyFixtures=[],canopyFixturePositions=[-10,0,10].map(x=>new T.Vector3(x,5.28,-2.6));for(const x of [-10,0,10])for(const z of [-8,-1,5]){const fixture=box(roof,2.5,.025,.12,led,x,5.315,z);fixture.name='canopy-emissive-fixture';canopyFixtures.push(fixture);}
 // Reuse the eleven original pump parts, preserving source silhouettes and service anchors.
 installSourcePumps(T,station);
 const rearPumps=new T.Group();rearPumps.name='rear-fuel-dispensers';g.add(rearPumps);
 for(const pump of station.pumps){const copy=pump.group.clone(true);copy.position.z=-6.4;copy.rotation.y=Math.PI/2;copy.name='rear-dispenser-'+pump.index;rearPumps.add(copy);}
 station.rearPumps=rearPumps;
 // Keep all marked bays available; only the three fully animated service cars occupy them.
 // Decorative parked cars and their frozen occupants used to obscure the active lanes.
 for(const x of [-7,-3,3,7])for(const z of [-6.1,.4])for(const sign of [-1,1])box(g,.06,.005,5.1,mark,x+sign*1.32,.005,z);

 // FULL shop: actual brand sign, transparent frontage, shelving and a service annex.
 const store=new T.Group();store.position.set(0,0,-20.5);store.name='full-shop-and-service-annex';g.add(store);
 box(store,27,.25,8.5,white,0,.125,0);box(store,27,4.1,.22,plaster,0,2.25,-4.1);
 for(const x of [-13.4,13.4])box(store,.22,4.1,8.3,plaster,x,2.25,0);
 box(store,27,.18,8.5,white,0,4.38,0);box(store,27,.55,.25,dark,0,4.05,4.1);
 box(store,12,1.05,.28,M(0x326951),-3.8,4.02,4.23);brandMark(T,store,'full',{width:1.30,height:.99,x:-8.5,y:4.02,z:4.39});
 text(store,'CAFÉ · COMIDAS · TIENDA',5.0,.38,-3.4,4.02,4.39);
 const shopGlass=M(0x9eb7bc,{roughness:.30,metalness:.05,transparent:true,opacity:.16,depthWrite:false,side:T.DoubleSide});
 box(store,17.8,3.5,.15,M(0xddd8c6),-3.5,1.98,-2.3);
 box(store,18,.05,6.1,M(0xc7bba6),-3.5,.29,.8);
 // Eight complete bays, paired centre doors, and continuous mullions.
 for(let bay=0;bay<8;bay++){const x=-11.8+bay*2.25,pane=box(store,2.19,3.05,.018,shopGlass,x,1.85,4.22);pane.castShadow=false;pane.renderOrder=2;}
 for(let edge=0;edge<=8;edge++)box(store,.065,3.22,.09,steel,-12.925+edge*2.25,1.91,4.25);
 // Close the two leftover facade bays; continuous header/sill seal the glass perimeter.
 const frontageInfill=new T.Group();frontageInfill.name='store-frontage-infill';store.add(frontageInfill);
 box(frontageInfill,.50,3.22,.12,steel,-13.15,1.91,4.21); // x[-13.40,-12.90]
 box(frontageInfill,1.05,3.22,.12,dark,5.55,1.91,4.21); // x[5.025,6.075]
 for(const x of [5.05,6.05])box(frontageInfill,.06,3.22,.15,steel,x,1.91,4.24);
 box(frontageInfill,19.55,.145,.12,steel,-3.625,3.43,4.24); // y[3.3575,3.5025]
 box(frontageInfill,19.55,.12,.12,steel,-3.625,.30,4.24);
 for(const x of [-3.30,-2.90])box(store,.035,3.12,.07,dark,x,1.88,4.27);
 for(const x of [-11,-6,0,4]){box(store,1.6,.07,.28,led,x,3.6,2.7);}
 for(const x of [-4,0,3]){box(store,1.20,.07,.70,wood,x,1.05,1.8);for(const dx of [-.4,.4]){box(store,.07,.72,.07,steel,x+dx,.66,1.8);box(store,.40,.07,.40,wood,x+dx,.61,2.7);box(store,.055,.36,.055,steel,x+dx,.40,2.7);}}
 box(store,1.9,2.9,.65,dark,3.7,1.77,-1.85);for(const x of [3.25,4.15]){box(store,.83,2.45,.025,shopGlass,x,1.78,-1.51);for(let y=.7;y<2.9;y+=.45)box(store,.80,.025,.52,steel,x,y,-1.8);}
 for(const y of [.33,3.49])box(store,18.5,.055,.09,steel,-3.5,y,4.25);
 for(const x of [-3.3,-2.9])line(store,[x,1.1,4.28],[x,1.6,4.28],.017,steel);
 const annexWall=box(store,7.3,3.4,.18,M(0x676f69),9.65,1.99,3.95);annexWall.name='solid-service-annex-behind-slats';
 for(let x=6.1;x<13.3;x+=.19)box(store,.10,3.4,.12,wood,x,1.99,4.15);
 const counter=box(store,4.2,1.05,.75,wood,-9.2,.82,2.8);box(store,4.4,.06,.9,dark,-9.2,1.37,2.8);
 box(store,.6,.55,.48,steel,-10.4,1.67,2.8);box(store,.18,.25,.15,dark,-9.5,1.55,2.88);
 const rng=seededRandom(229);for(const x of [-7,-3,1]){box(store,2.7,2.4,.45,dark,x,1.5,-1.9);for(let row=0;row<4;row++){box(store,2.8,.045,.6,steel,x,.55+row*.57,-1.63);for(let k=0;k<10;k++)box(store,.15,.24,.14,M([0xcdb57c,0x6b8d6f,0xa56951,0xd1c9aa][Math.floor(rng()*4)]),x-1.2+k*.26,.70+row*.57,-1.59);}}
 // Low rooftop service room, vents, ducts and utility equipment.
 box(store,10,2.4,5,plaster,7,5.67,-.9);box(store,10.3,.16,5.3,white,7,6.95,-.9);
 for(let x=3;x<12;x+=1.2){box(store,.85,.62,.04,dark,x,5.94,1.62);for(let j=0;j<5;j++)box(store,.82,.035,.07,steel,x,5.70+j*.12,1.66);}
 for(const x of [-7,-3]){box(store,1.5,.9,1,steel,x,4.91,-1.8);cyl(store,.36,.36,.06,dark,x,5.39,-1.8,16);}
 for(const x of [10,11])line(store,[x,4.5,-3.3],[x,7.2,-3.3],.08,steel);
 // Brand pylon at the corner, small islands, bollards and cafe furniture.
 const pylon=new T.Group();pylon.position.set(-17.3,0,10.4);g.add(pylon);
 pylon.name='corner-ypf-price-pylon';
 box(pylon,2.18,.25,.68,dark,0,.125,0);box(pylon,1.96,5.9,.38,white,0,3.08,0);
 for(const side of [-1,1]){const face=new T.Group();face.rotation.y=side<0?Math.PI:0;face.position.z=side*.205;pylon.add(face);
  box(face,2.02,1.18,.04,blue,0,5.38,0);brandMark(T,face,'ypf-white',{width:1.64,height:.415,y:5.38,z:.025});
  box(face,1.82,2.36,.035,dark,0,3.43,.012);
  for(const [i,label,price]of [[0,'INFINIA','1.599'],[1,'SUPER','1.349'],[2,'DIESEL','1.459']]){const y=4.17-i*.69;text(face,label,.78,.13,-.40,y,.036);text(face,price,.84,.27,.40,y-.08,.038,'#dce7ba');box(face,1.63,.012,.012,steel,0,y-.39,.041);}
  box(face,1.82,1.05,.035,M(0x326951),0,1.6,.015);brandMark(T,face,'full',{width:.90,height:.685,y:1.6,z:.036});
  text(face,'24 HORAS',1.2,.15,0,.75,.035,'#234d66');
 }
 pylon.userData.prices='Illustrative scene values, not live retail prices';
 for(const x of [-10,0,10])for(const z of [-9.7,4.5]){cyl(g,.065,.065,.72,steel,x,.54,z);cyl(g,.068,.068,.12,blue,x,.76,z);}
 // Cafe seating lives beside the shop, clear of the cars' turning envelope.
 for(const z of [-22,-18.5]){const x=17;cyl(g,.53,.53,.055,wood,x,1.02,z);cyl(g,.055,.075,.80,steel,x,.60,z);for(const dx of [-.8,.8]){box(g,.43,.08,.43,wood,x+dx,.57,z);for(const a of [-.16,.16])for(const b of [-.16,.16])box(g,.035,.42,.035,steel,x+dx+a,.32,z+b);box(g,.43,.38,.04,wood,x+dx,.80,z-.22);}}
 const landscape=new T.Group();g.add(landscape);for(const [i,x,z]of [[0,20,-9],[1,20,2],[2,-18,-18],[3,-32,5],[4,-32,-15],[5,13,26],[6,-8,26],[7,32,26]]){
  box(landscape,1.7,.18,1.7,dark,x,.14,z);box(landscape,1.5,.02,1.5,M(0x78796a,{roughness:1,metalness:0}),x,.24,z);const tree=createTree(T,{seed:120+i,height:4.6+i%3*.5,crown:1.7,maxWidth:3.6,model:i%3===1?(models.treeJacaranda||models.tree):models.tree});tree.position.set(x,.25,z);tree.rotation.y=(i===3||i===4)?Math.PI/2:i*2.39996;landscape.add(tree);
 }
 // Planted service-side setback: ends before the grid sidewalk at x30.
 const nearGardens=new T.Group();nearGardens.name='near-parcel-gardens';g.add(nearGardens);
 const gardenLeaf=M(0x667c59,{roughness:1}),gardenGrass=M(0x7a8a69,{roughness:1});
 function lowGarden(x,z,w,d){box(nearGardens,w,.10,d,gardenGrass,x,.05,z);for(const sign of [-1,1]){box(nearGardens,.10,.18,d,white,x+sign*(w/2-.05),.09,z);box(nearGardens,w-.2,.18,.10,white,x,.09,z+sign*(d/2-.05));}
  for(let dz=-d/2+1;dz<d/2-1;dz+=2.4){box(nearGardens,w*.35,.38,.95,gardenLeaf,x+.65*Math.sin(dz),.29,z+dz);for(const dx of [-w*.31,w*.31]){const plant=new T.Mesh(new T.ConeGeometry(.20,.45,5),gardenLeaf);plant.position.set(x+dx,.32,z+dz+.45);nearGardens.add(plant);}}
 }
 lowGarden(26.75,-10,6.4,18);lowGarden(27,-28,5.5,8);
 nearGardens.userData.rectangles=[{x:26.75,z:-10,w:6.4,d:18},{x:27,z:-28,w:5.5,d:8}];
 // Low public park opposite the station. No benches inside the entry apron.
 const park=new T.Group();park.name='plaza-intervalo';g.add(park);
 box(park,46,.12,34,M(0x718267,{roughness:1}),6,.06,46);
 box(park,46,.04,3,pavement,6,.16,32.5);
 for(const [z,d]of [[30,2],[46.375,24.75],[62.125,1.75]])box(park,3,.04,d,pavement,6,.16,z);
 box(park,46,.04,2.5,pavement,6,.16,60);
 for(const [x,z,angle]of [[-10,32.5,Math.PI],[0,32.5,Math.PI],[16,32.5,Math.PI],[-10,60,0],[18,60,0]]){const bench=createBench(T,models.bench);bench.position.set(x,.18,z);bench.rotation.y=angle;g.add(bench);}
 for(const [x,z]of [[-12,40],[-7,53],[20,42],[21,54]]){const tr=createTree(T,{height:x<0?5.0:5.6,maxWidth:5.4,model:models.treeJacaranda||models.tree});tr.position.set(x,.12,z);tr.rotation.y=x*.31;landscape.add(tr);}
 for(const x of [-15,27])for(const z of [30,62]){cyl(park,.07,.09,1.05,steel,x,.67,z);cyl(park,.09,.09,.09,led,x,1.22,z);}
 park.userData={bounds:{min:[-17,0,29],max:[29,5.2,63]},walkways:[[-17,32.5,29,32.5],[6,29,6,63],[-17,60,29,60]],benchPositions:[[-10,.18,32.5],[0,.18,32.5],[16,.18,32.5],[-10,.18,60],[18,.18,60]],pedestrianRoutes:[{id:'park-front',points:[[-16,.18,33.45],[6,.18,33.45],[28,.18,33.45]]},{id:'park-spine',points:[[6,.18,29.5],[6,.18,33.45],[6,.18,59.05],[6,.18,62.5]]},{id:'park-rear',points:[[-16,.18,59.05],[6,.18,59.05],[28,.18,59.05]]}],benchClearance:.45};
 // Buenos Aires street wall: apartment buildings, balconies, ACs and water tanks.
 const brickWall=createBrickMaterial(T);
 const city=new T.Group(),cityBuildings=[];city.name='Flores-inspired-neighbourhood';g.add(city);
 function building(x,z,w,d,floors,color,turn=0){
  const p=new T.Group();p.position.set(x,0,z);p.rotation.y=turn;p.name=`city-building-${x}-${z}`;city.add(p);cityBuildings.push(p);const wall=createSurfaceMaterial(T,{color,grain:.004,repeat:7}),window=M(0x546a70,{roughness:.30,metalness:.22}),rail=M(0x535c5b),h=3.1*floors+3.2,heritage=floors<=3,brick=M(0x987b66),shade=M(0xb5b7ac),recess=M(0x3e4749);
  p.userData={footprint:{width:w,depth:d},height:h,style:heritage?'low-stucco-shopfront':'mixed-apartment-balconies'};
  box(p,w,h,d,heritage?wall:brickWall,0,h/2,0);box(p,w+.2,.22,d+.2,white,0,h+.11,0);
  if(heritage){for(const yy of [3.15,h-.35,h+.25])box(p,w+.20,.14,.32,white,0,yy,d/2+.10);for(const xx of [-w/2+.20,w/2-.20])box(p,.26,h-.5,.16,white,xx,h/2,d/2+.04);}
  box(p,w+.15,.20,d+.15,white,0,3.2,0);
  const bays=Math.max(2,Math.floor(w/3));for(let level=1;level<=floors;level++)for(let k=0;k<bays;k++){
   const bx=-w/2+(k+.5)*w/bays,y=3.2+(level-.5)*3.1;box(p,1.49,1.99,.07,recess,bx,y,d/2+.035);box(p,1.35,1.85,.045,window,bx,y,d/2+.078);box(p,.04,1.85,.055,white,bx,y,d/2+.06);box(p,1.35,.04,.055,white,bx,y,d/2+.06);
   if(k%2===0&&!heritage){box(p,2.4,.13,1.15,white,bx,y-.97,d/2+.52);for(const yy of [y-.75,y-.05])box(p,2.3,.035,.04,rail,bx,yy,d/2+1.06);for(let j=0;j<6;j++)box(p,.025,.72,.025,rail,bx-1.1+j*.44,y-.40,d/2+1.06);for(const sign of [-1,1])box(p,.035,.035,1.05,rail,bx+sign*1.13,y-.05,d/2+.54);}
   else{box(p,1.62,.10,.26,white,bx,y-1.0,d/2+.10);if((k+level)%3===0)box(p,1.31,.77,.06,shade,bx,y+.48,d/2+.11);box(p,.67,.38,.25,white,bx+.8,y-.70,d/2+.18);for(let j=0;j<4;j++)box(p,.58,.016,.015,rail,bx+.8,y-.80+j*.065,d/2+.32);}
  }
  for(let k=0;k<bays;k++){const bx=-w/2+(k+.5)*w/bays,bw=Math.min(2.5,w/bays-.3);box(p,bw,2.65,.06,recess,bx,1.4,d/2+.04);
   if(k%3===1){for(let j=0;j<14;j++)box(p,bw-.1,.026,.035,shade,bx,.35+j*.17,d/2+.085);}
   else{box(p,bw-.16,2.35,.035,window,bx,1.4,d/2+.085);box(p,.045,2.45,.06,white,bx,1.4,d/2+.12);box(p,bw,.07,.06,white,bx,2.16,d/2+.12);box(p,.024,.36,.035,steel,bx+.13,1.2,d/2+.15);}
  }
  const shopNames=['ALMACÉN','PANADERÍA','CAFÉ DE BARRIO','FARMACIA','LIBRERÍA'],name=shopNames[Math.abs(Math.round(x+z))%shopNames.length];
  const awningColor=M(heritage?0x65796d:0x7b7770);box(p,w-.5,.30,.10,awningColor,0,2.98,d/2+.10);text(p,name,Math.min(5,w-.8),.19,0,2.98,d/2+.16,'#f4f1e7');
  if(heritage){const awning=box(p,w-.6,.08,.85,awningColor,0,2.78,d/2+.46);awning.rotation.x=.10;}
  box(p,w-.3,.65,.12,wall,0,h+.38,d/2-.08);
  box(p,w*.32,2.3,d*.35,wall,-w*.2,h+1.15,-d*.15);cyl(p,.75,.75,1.6,M(0x7e827d),w*.2,h+1.0,0,12);cyl(p,.78,.78,.10,dark,w*.2,h+1.85,0,12);
 }
 building(-12.5,-30,11,10,3,0xc9c4b6);building(1,-31,13,12,6,0xd8d7cf);building(15,-30,13,10,2,0xbcbcb2);
 building(54,-16,12,12,6,0xd2c9b9,-Math.PI/2);building(54,4,12,13,4,0xb0b2ac,-Math.PI/2);
 building(-42,-15,15,14,5,0xcec8ba,Math.PI/2);building(-42,4,13,14,3,0xb7b3a5,Math.PI/2);
 building(-44,37,15,14,5,0xd5d2c4,Math.PI);building(62,53,13,14,6,0xc6c3b9,Math.PI);
 // Narrow infill and mixed-height street fronts replace empty near-city gaps.
 building(-42,-5,4,14,2,0xc6c3af,Math.PI/2);
 building(54,-6,6,12,2,0xbab3a2,-Math.PI/2);building(54,-32,12,10,3,0xd6cdbc,-Math.PI/2);
 building(54,35,12,10,3,0xbfc7bf,-Math.PI/2);
 building(-10,71,12,10,2,0xd6c9af,Math.PI);building(6,71,14,10,3,0xb9c3b9,Math.PI);building(22,71,12,10,2,0xd0c4b4,Math.PI);
 for(const [x,w]of [[-6.25,1.35],[8,.8]]){box(city,w,2.6,.12,dark,x,1.3,-24.9);for(let yy=.2;yy<2.6;yy+=.24)box(city,w,.018,.02,steel,x,yy,-24.82);}
 addUrbanBackground(T,g);
 // Street lighting and overhead lines remain outside the orbit's focal area.
 for(const [x,z]of [[-32,11],[-32,-10],[20,26],[-20,26],[22,-14]]){cyl(city,.07,.11,7,steel,x,3.5,z,10);line(city,[x,6.9,z],[x+1.8,7.1,z],.055,steel);box(city,.64,.12,.31,dark,x+1.8,7.07,z);box(city,.48,.018,.22,led,x+1.8,7,z);}
 for(const z of [-24,-2]){cyl(city,.11,.14,8.5,wood,-34,4.25,z,10);line(city,[-34,8.1,z],[-34,8.1,z+22],.012,dark);}
 Object.assign(station,{roof,columns,store,ground,road,landscape,city,cityBuildings,park,nearGardens,canopyFixtures,canopyFixturePositions,bounds:{width:760,depth:760},canopyHeight:6.5});return station;
}











