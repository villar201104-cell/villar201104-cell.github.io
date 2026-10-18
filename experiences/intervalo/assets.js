import {createHuman,PALETTE,createMaterial} from './shared-3d/index.js';
import {brandMark} from './brand.js';
/**
 * Procedural assets, Three.js 0.180.0. No imports or external assets.
 * Crown reference: octagonal garment sections, 10x6 facial forms, .86 matte cloth;
 * two-segment industrial bevels and .65/.12 painted finish. YPF branding retained.
 * Crown -Z features are mirrored to +Z; its short arm lengths are NOT imported.
 * Metres; Y up, +Z forward. No scene lights/environment are created.
 * Station: {group,roof,pumps,islands,accessoryPositions,totemPositions,carStops,...}.
 * roof.visible=false hides canopy slab/fascia/lights; corner columns remain visible. All positions are station-local.
 * Pump group origin=(islandX,.18,2.2); nozzleDock=(islandX+.8,1.3,2.1).
 * Car: {group,wheels,driver,setColor}. wheels rotate on local X; driver is a full rig.
 * Person: shoulder pivots (±.22,1.40,0); upper arm=.29; forearm=.29.
 * Rest axes -Y. Forearm position=(0,-.29,0), hand pivot=(0,-.29,0).
 * Palm centre=(0,-.045,0) relative to hand pivot; hands support Object3D.attach().
 * driver=true uses same hierarchy, seated pose, root rebased to pelvis.
 * Product returns Group with grip origin, long axis +Y. coffee/drink/snack supported.
 * Static pump hoses/nozzles and accessory groups are hidden by default (simulation/GLB owns them).
 * Generated textures/materials belong to caller; dispose them when unloading assets.
 */
const C={...PALETTE,white:PALETTE.ivory,dark:PALETTE.charcoal,silver:PALETTE.steel,green:PALETTE.leaf,blue:0x1266bd,navy:0x182e46,wood:0x96816b};
function mat(T,color,extra={}){return createMaterial(T,color,extra);}
function mesh(T,p,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
function box(T,p,w,h,d,m,x=0,y=0,z=0){return mesh(T,p,new T.BoxGeometry(w,h,d),m,x,y,z);}
function cyl(T,p,rt,rb,h,m,x=0,y=0,z=0,n=12){return mesh(T,p,new T.CylinderGeometry(rt,rb,h,n),m,x,y,z);}
function orb(T,p,rx,ry,rz,m,x=0,y=0,z=0,n=12){const o=mesh(T,p,new T.SphereGeometry(1,n,6),m,x,y,z);o.scale.set(rx,ry,rz);return o;}
function rod(T,p,a,b,r,m,r2=r){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);const o=cyl(T,p,r2,r,v.length(),m);o.position.copy(av).add(bv).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
function roundShape(T,w,h,r){const s=new T.Shape(),x=-w/2,y=-h/2;r=Math.min(r,w/2,h/2);s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
function rounded(T,p,w,h,d,r,m,x=0,y=0,z=0){const b=Math.min(.025,r*.4,w/8,h/8,d/4);const g=new T.ExtrudeGeometry(roundShape(T,w-2*b,h-2*b,Math.max(.001,r-b)),{depth:d-2*b,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:2,steps:1,curveSegments:3});g.translate(0,0,-d/2+b);return mesh(T,p,g,m,x,y,z);}
function slab(T,p,w,d,h,r,m,x=0,y=0,z=0){const o=rounded(T,p,w,d,h,r,m,x,y,z);o.rotation.x=-Math.PI/2;return o;}
function tube(T,p,points,r,m){const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)));return mesh(T,p,new T.TubeGeometry(curve,28,r,6,false),m);}
function quad(T,p,points,m){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();const o=mesh(T,p,g,m);if(m.transparent)o.castShadow=false;return o;}
export function createTextPlane(T,text,options={}){
 const {width=1,height=.3,color='#ffffff',background=null,font='700 76px Arial',resolution=512}=options;
 const canvas=typeof document!=='undefined'?document.createElement('canvas'):typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(1,1):null;
 const geometry=new T.PlaneGeometry(width,height);
 if(!canvas)return new T.Mesh(geometry,new T.MeshBasicMaterial({color,side:T.DoubleSide}));
 canvas.width=resolution;canvas.height=Math.max(64,Math.round(resolution*height/width));const ctx=canvas.getContext('2d');
 if(background){ctx.fillStyle=background;ctx.fillRect(0,0,canvas.width,canvas.height);}
 ctx.fillStyle=color;ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(text),canvas.width/2,canvas.height/2,canvas.width*.92);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const out=new T.Mesh(geometry,new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false}));out.userData.generatedTexture=texture;return out;
}
function label(T,p,text,w,h,x,y,z,options={}){const o=createTextPlane(T,text,{width:w,height:h,...options});o.position.set(x,y,z);p.add(o);return o;}
// Crown operator's eight-corner section construction, adapted to Intervalo +Z and rig.
function shell(T,parent,name,sections,material){
 const rings=[...sections].sort((a,b)=>a[0]-b[0]),vertices=[],indices=[];
 for(const [y,w,d,zc=0]of rings){const c=Math.min(w,d)*.2;for(const [x,z]of [[-w/2+c,-d/2],[w/2-c,-d/2],[w/2,-d/2+c],[w/2,d/2-c],[w/2-c,d/2],[-w/2+c,d/2],[-w/2,d/2-c],[-w/2,-d/2+c]])vertices.push(x,y,z+zc);}
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<8;i++){const a=j*8+i,b=j*8+(i+1)%8;indices.push(a,b+8,b,a,a+8,b+8);}
 for(let i=1;i<7;i++){indices.push(0,i,i+1);const a=(rings.length-1)*8;indices.push(a,a+i+1,a+i);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();const out=mesh(T,parent,geometry,material);out.name=name;return out;
}
export function createPerson(T,{driver=false}={}){
 return createHuman(T,{driver,shirtColor:driver?0x454447:C.blue,pantsColor:C.navy,badge:(parent,options)=>brandMark(T,parent,'ypf-white',options)});
}
export function createProduct(T,type='bottle'){
 const group=new T.Group();group.name='prop-'+type;type=({coffee:'cup',drink:'bottle',snack:'snack'})[type]||type;
 const blue=mat(T,C.blue),dark=mat(T,C.dark),white=mat(T,C.white),silver=mat(T,C.silver,{metalness:.12,roughness:.65});
 if(type==='card'){rounded(T,group,.086,.054,.003,.005,blue,0,.025,0);box(T,group,.017,.014,.001,mat(T,0xc7b47e),-.02,.029,.002);box(T,group,.054,.004,.001,white,.004,.010,.002);}
 else if(type==='nozzle'){
  const shape=new T.Shape();shape.moveTo(-.05,-.08);shape.lineTo(.045,-.08);shape.lineTo(.095,.12);shape.quadraticCurveTo(.09,.20,.01,.20);shape.lineTo(-.065,.13);shape.closePath();
  const hole=new T.Path();hole.moveTo(-.017,-.035);hole.lineTo(.022,-.035);hole.lineTo(.056,.105);hole.lineTo(.005,.13);hole.closePath();shape.holes.push(hole);
  const geo=new T.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelThickness:.005,bevelSize:.005,bevelSegments:2});geo.translate(0,0,-.0225);mesh(T,group,geo,dark);rounded(T,group,.13,.13,.06,.025,blue,-.005,.16,0);tube(T,group,[[.02,.21,0],[.04,.29,0],[.16,.34,0],[.24,.34,0]],.018,silver);cyl(T,group,.025,.027,.08,dark,0,-.10,0);
 }else if(type==='cup'){cyl(T,group,.045,.033,.12,white,0,.035,0);cyl(T,group,.049,.048,.014,dark,0,.102,0);cyl(T,group,.041,.037,.038,mat(T,C.wood),0,.035,0);}
 else if(type==='snack'){rounded(T,group,.10,.17,.042,.018,mat(T,0xdab56f),0,.03,0);for(const y of [-.057,.117])box(T,group,.107,.014,.045,blue,0,y,0);brandMark(T,group,'full',{width:.046,height:.035,x:0,y:.045,z:.023});}
 else if(type==='bag'){rounded(T,group,.23,.29,.13,.018,mat(T,0xc3a581),0,.04,0);for(const z of [-.045,.045])tube(T,group,[[-.065,.18,z],[-.06,.28,z],[.06,.28,z],[.065,.18,z]],.008,dark);brandMark(T,group,'full',{width:.09,height:.069,x:0,y:.04,z:.067});}
 else if(type==='oil'){rounded(T,group,.15,.23,.085,.022,blue,0,.06,0);cyl(T,group,.025,.025,.04,dark,.035,.19,0);label(T,group,'ELAION',.11,.037,0,.065,.044);}
 else{const points=[[.027,-.075],[.033,-.065],[.033,.09],[.024,.12],[.014,.13],[.014,.16]];mesh(T,group,new T.LatheGeometry(points.map(([r,y])=>new T.Vector2(r,y)),16),mat(T,0x9bc6c8,{roughness:.25}));cyl(T,group,.018,.018,.023,blue,0,.165,0);cyl(T,group,.034,.034,.065,white,0,.025,0);}
 return group;
}
// Car-only skin: a thin closed panel, never a solid volume through the cabin.
function carSkin(T,parent,name,rows,thickness,material){
 const n=rows.length,m=rows[0].length,v=rows.flat(2),count=n*m,indices=[];
 for(const row of rows)for(const [x,y,z]of row)v.push(x,y-thickness,z);
 for(let j=0;j<n-1;j++)for(let i=0;i<m-1;i++){
  const a=j*m+i,b=a+m;indices.push(a,b,a+1,a+1,b,b+1);
  indices.push(a+count,a+1+count,b+count,a+1+count,b+1+count,b+count);
 }
 const edge=(a,b)=>indices.push(a,b,a+count,b,b+count,a+count);
 for(let i=0;i<m-1;i++){edge(i+1,i);edge((n-1)*m+i,(n-1)*m+i+1);}
 for(let j=0;j<n-1;j++){edge(j*m,(j+1)*m);edge((j+1)*m+m-1,j*m+m-1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(indices);g.computeVertexNormals();const out=mesh(T,parent,g,material);out.name=name;return out;
}
function carRoofRows(sections){return sections.map(([z,w,y,crown])=>[-1,-.66,0,.66,1].map(t=>[t*w,y-crown*t*t,z]));}
function carArmPose(T,driver,side,target){
 const arm=driver[side+'Arm'],forearm=driver[side+'Forearm'],shoulder=arm.position.clone(),end=new T.Vector3(...target),v=end.clone().sub(shoulder),len=v.length(),dir=v.normalize(),a=.29,b=.29;
 const along=(a*a+len*len-b*b)/(2*len),height=Math.sqrt(Math.max(0,a*a-along*along));
 const bend=new T.Vector3(0,-1,0).addScaledVector(dir,dir.y).normalize();
 const elbow=shoulder.clone().addScaledVector(dir,along).addScaledVector(bend,height);
 arm.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),elbow.clone().sub(shoulder).normalize());
 const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,-1,0),end.sub(elbow).normalize());forearm.quaternion.copy(arm.quaternion).invert().multiply(q);
}
export function createCar(T,color=0x789aab){
 const group=new T.Group();group.name='C-segment hollow-cabin hatchback';
 const staticGroup=new T.Group();staticGroup.name='car-static-panels-and-interior';staticGroup.userData.staticBatchRoot=true;group.add(staticGroup);
 const paint=mat(T,color,{roughness:.65,metalness:.12}),trim=mat(T,0x30383c,{roughness:.83,metalness:0}),rubber=mat(T,0x20272b,{roughness:.93,metalness:0});
 const silver=mat(T,0x8e9b9e,{roughness:.60,metalness:.25}),cloth=mat(T,0x4a5052,{roughness:.90,metalness:0}),insert=mat(T,0x656c6c,{roughness:.94,metalness:0}),seam=mat(T,0x92998f,{roughness:.86,metalness:0});
 const glass=mat(T,0xa9c0c1,{roughness:.32,metalness:0,transparent:true,opacity:.14,depthWrite:false,flatShading:false,side:T.DoubleSide});
 const led=mat(T,0xf1efdf,{roughness:.35,emissive:0xe5e4cf,emissiveIntensity:.35}),red=mat(T,0xa7473d,{roughness:.48,emissive:0x6e201b,emissiveIntensity:.20});
 const collisionParts=[];const named=(o,name,category)=>{o.name=name;if(category){o.userData.carCollisionCategory=category;collisionParts.push(o);}return o;};
 const block=(name,w,h,d,r,material,x,y,z,category='body')=>named(rounded(T,staticGroup,w,h,d,r,material,x,y,z),name,category);
 const bar=(name,a,b,r,material,category='body')=>named(rod(T,staticGroup,a,b,r,material),name,category);
 const panel=(name,points,material,category='body')=>named(quad(T,staticGroup,points,material),name,category);
 // Only 55 mm side skins are extruded: the space between them is entirely empty.
 const profile=new T.Shape(),M=(z,y)=>profile.moveTo(-z,y),L=(z,y)=>profile.lineTo(-z,y),Q=(a,b,c,d)=>profile.quadraticCurveTo(-a,b,-c,d);
 M(-2.20,.30);Q(-2.24,.45,-2.18,.69);Q(-2.05,.88,-1.65,.92);L(-.70,.94);Q(.35,.96,1.12,.86);Q(1.90,.75,2.22,.60);L(2.22,.33);L(1.80,.30);
 Q(1.80,.73,1.40,.75);Q(1.00,.73,1.00,.30);L(-.95,.30);Q(-.95,.73,-1.35,.75);Q(-1.75,.73,-1.75,.30);L(-2.20,.30);profile.closePath();
 for(const sign of [-1,1]){
  const sideGeo=new T.ExtrudeGeometry(profile,{depth:.055,bevelEnabled:true,bevelSize:.01,bevelThickness:.01,bevelSegments:2,curveSegments:7});sideGeo.rotateY(Math.PI/2);sideGeo.translate(sign*.8875-.0275,0,0);
  const pos=sideGeo.attributes.position;for(let i=0;i<pos.count;i++){const z=pos.getZ(i),t=Math.max(0,(Math.abs(z)-1.65)/.60);pos.setX(i,pos.getX(i)*(1-.10*t*t));}pos.needsUpdate=true;sideGeo.computeVertexNormals();named(mesh(T,staticGroup,sideGeo,paint),sign<0?'Left hollow body skin':'Right hollow body skin','body');
  block('Sill cover',.055,.10,2.05,.02,trim,sign*.88,.265,.02);
  block('Inner door panel',.036,.48,1.27,.045,trim,sign*.827,.655,.235,'doors');
  block('Door textile insert',.014,.19,.74,.035,insert,sign*.802,.735,.19,'doors');
  block('Door armrest',.105,.055,.56,.02,trim,sign*.777,.745,.19,'doors');
  block('Door pull',.025,.027,.14,.008,silver,sign*.772,.844,.41,'doors');
  block('Window switch',.034,.009,.065,.004,silver,sign*.741,.778,.34,'doors');
  block('Rear door inner panel',.035,.43,.65,.035,trim,sign*.825,.65,-.82,'doors');
  // Lower glass seals are below the animated hand-off height y=1.12.
  bar('Front window belt seal',[sign*.87,.941,-.34],[sign*.87,.941,.97],.012,rubber,'doors');
  bar('Rear window belt seal',[sign*.87,.941,-1.52],[sign*.87,.941,-.43],.012,rubber,'doors');
  bar('A pillar',[sign*.86,.94,1.07],[sign*.735,1.47,.48],.037,paint);
  bar('B pillar',[sign*.87,.94,-.38],[sign*.743,1.47,-.38],.032,trim);
  bar('C pillar',[sign*.84,.94,-1.63],[sign*.72,1.43,-1.10],.055,paint);
  bar('Roof side rail',[sign*.735,1.47,.48],[sign*.72,1.43,-1.10],.019,paint,'roof');
  panel('Rear door glass',[[sign*.855,.96,-1.50],[sign*.724,1.405,-1.08],[sign*.742,1.45,-.43],[sign*.865,.96,-.43]],glass,'glass');
  // Both front windows have no glass mesh: driver and interactions stay unobstructed.
  for(const z of [-.38,-1.48])bar('Door shut line',[sign*.921,.36,z],[sign*.921,.90,z],.0038,trim);
  block('Flush front door handle',.018,.032,.17,.012,silver,sign*.916,.845,-.13);
  block('Flush rear door handle',.018,.032,.15,.012,silver,sign*.916,.845,-1.10);
  bar('Mirror stem',[sign*.88,.97,.91],[sign*.975,.99,.86],.014,trim);
  block('Mirror shell',.15,.085,.18,.038,paint,sign*1.01,1.015,.86);
  const mirror=block('Mirror glass',.115,.055,.006,.018,silver,sign*1.015,1.015,.767);mirror.castShadow=false;
  // Dark arch lips emphasize actual cutouts, not painted discs on solid bodywork.
  for(const z of [-1.35,1.40]){const pts=[];for(let j=0;j<=14;j++){const a=j*Math.PI/14;pts.push([sign*.913,.33+Math.sin(a)*.402,z+Math.cos(a)*.402]);}named(tube(T,staticGroup,pts,.012,trim),'Wheel arch lip','body');}
 }
 named(carSkin(T,staticGroup,'Sculpted hood',carRoofRows([[1.10,.85,.875,.035],[1.38,.855,.845,.038],[1.80,.83,.755,.035],[2.20,.76,.675,.025]]),.035,paint),'Sculpted hood','body');
 const roof=named(carSkin(T,staticGroup,'Crowned roof',carRoofRows([[-1.12,.72,1.475,.025],[-.78,.745,1.525,.035],[-.25,.75,1.535,.035],[.25,.745,1.53,.035],[.49,.735,1.49,.02]]),.028,paint),'Crowned roof','roof');
 // Liner follows the roof; no full bounding-box solid above the occupant.
 named(carSkin(T,staticGroup,'Roof headliner',carRoofRows([[-1.09,.69,1.444,.025],[-.75,.716,1.494,.035],[-.25,.72,1.504,.035],[.24,.715,1.499,.035],[.46,.705,1.459,.02]]),.008,insert),'Roof headliner','roof');
 panel('Windshield',[[-.84,.945,1.075],[.84,.945,1.075],[.723,1.458,.49],[-.723,1.458,.49]],glass,'glass');
 panel('Rear hatch glass',[[.80,.965,-1.96],[-.80,.965,-1.96],[-.708,1.425,-1.12],[.708,1.425,-1.12]],glass,'glass');
 block('Tailgate lower panel',1.59,.43,.075,.09,paint,0,.70,-2.10);
 named(carSkin(T,staticGroup,'Rear shoulder deck',carRoofRows([[-2.13,.79,.925,.035],[-1.94,.81,.975,.025]]),.04,paint),'Rear shoulder deck','body');
 block('Roof spoiler',1.49,.045,.19,.025,paint,0,1.44,-1.18,'roof');
 block('Spoiler brake light',.42,.018,.012,.006,red,0,1.436,-1.281,'lamps');
 for(const sign of [-1,1])bar('Windshield wiper',[sign*.13,.958,1.07],[sign*.59,.972,1.055],.007,trim);
 bar('Rear wiper',[-.24,1.03,-1.88],[.20,1.03,-1.88],.006,trim);
 // Deep footwell and firewall: raised chassis is outside the feet, never through them.
 block('Cabin floor',1.62,.035,2.95,.035,trim,0,.0925,-.22,'floor');
 block('Firewall',1.62,.65,.045,.025,trim,0,.445,1.13,'dashboard');
 block('Rear cargo floor',1.54,.045,.56,.025,trim,0,.38,-1.70,'floor');
 for(const x of [-.40,.40])block('Footwell carpet',.54,.007,.70,.03,rubber,x,.114,.69,'floor');
 // Front seats: cushion top .500; driver thighs bottom .505 in the seated pose.
 const frontSeats=[];
 for(const x of [-.40,.40]){
  const seat=new T.Group();seat.name=x<0?'Driver front seat':'Passenger front seat';staticGroup.add(seat);frontSeats.push(seat);
  const seatBlock=(name,w,h,d,r,m,y,z,dx=0)=>named(rounded(T,seat,w,h,d,r,m,dx,y,z),name,'seats');seat.position.x=x;
  for(const dx of [-.17,.17])seatBlock('Seat runner',.035,.06,.44,.008,silver,.35,.30,dx);
  seatBlock('Seat cushion',.48,.09,.50,.045,cloth,.455,.30);
  seatBlock('Cushion textile centre',.31,.008,.35,.025,insert,.496,.29);
  // Side bolsters sit outside the two thighs, with an intentional clearance.
  for(const dx of [-.235,.235])seatBlock('Seat cushion side bolster',.045,.095,.49,.018,cloth,.469,.29,dx);
  const back=seatBlock('Front seat back',.48,.54,.105,.05,cloth,.795,.025);back.rotation.x=-.075;
  const backInsert=seatBlock('Backrest textile centre',.32,.37,.012,.025,insert,.80,.084);backInsert.rotation.x=-.075;
  for(const dx of [-.215,.215])seatBlock('Backrest side bolster',.045,.43,.09,.02,cloth,.79,.05,dx);
  for(const dx of [-.075,.075])seatBlock('Headrest post',.014,.115,.014,.004,silver,1.105,.007,dx);
  seatBlock('Front headrest',.265,.19,.105,.04,cloth,1.225,.012);
  seatBlock('Headrest front insert',.19,.125,.008,.02,insert,1.225,.068);
  seatBlock('Seat belt buckle',.04,.075,.055,.01,trim,.54,.18,x<0?.276:-.276);
  seatBlock('Buckle release',.028,.012,.035,.004,red,.582,.18,x<0?.276:-.276);
  for(const dx of [-.148,.148])seatBlock('Cushion stitched edge',.003,.003,.39,.001,seam,.501,.36,dx);
 }
 block('Rear bench cushion',1.43,.11,.56,.055,cloth,0,.465,-.93,'seats');
 const rearBack=block('Rear bench back',1.43,.52,.11,.055,cloth,0,.79,-1.255,'seats');rearBack.rotation.x=-.13;
 for(const x of [-.47,0,.47]){
  block('Rear cushion insert',.36,.008,.43,.025,insert,x,.523,-.93,'seats');
  block('Rear backrest insert',.35,.34,.015,.025,insert,x,.80,-1.187,'seats');
  for(const dx of [-.06,.06])bar('Rear headrest post',[x+dx,1.025,-1.285],[x+dx,1.12,-1.285],.007,silver,'seats');
  block('Rear headrest',.25,.16,.105,.035,cloth,x,1.16,-1.285,'seats');
 }
 block('Parcel shelf',1.42,.025,.42,.025,trim,0,.965,-1.62,'interior');
 // Narrow tunnel leaves both front footwells open; cockpit is beyond the knees.
 block('Centre console',.175,.25,.79,.03,trim,0,.34,.45,'console');
 block('Console armrest',.165,.065,.28,.025,cloth,0,.497,.02,'console');
 for(const z of [.24,.39]){const ring=mesh(T,staticGroup,new T.TorusGeometry(.042,.006,6,16),silver,0,.471,z);ring.rotation.x=Math.PI/2;named(ring,'Cupholder ring','console');}
 block('Gear selector base',.10,.025,.12,.015,silver,0,.48,.63,'console');block('Gear selector',.055,.065,.06,.015,trim,0,.52,.63,'console');
 block('Dashboard upper shell',1.57,.16,.26,.055,trim,0,.925,1.00,'dashboard');
 block('Dashboard lower shelf',1.49,.14,.14,.035,trim,0,.79,1.055,'dashboard');
 block('Passenger dash inset',.64,.075,.015,.018,insert,.40,.923,.861,'dashboard');
 block('Instrument binnacle',.35,.115,.16,.035,trim,-.40,1.01,.925,'dashboard');
 const display=mat(T,0x354b51,{roughness:.65,emissive:0x263d41,emissiveIntensity:.16});
 block('Instrument display',.28,.065,.008,.012,display,-.40,1.025,.840,'dashboard');
 for(const x of [-.477,-.323]){const dial=mesh(T,staticGroup,new T.TorusGeometry(.022,.0025,5,18),seam,x,1.026,.834);named(dial,'Instrument dial','dashboard');}
 block('Centre display frame',.28,.18,.035,.02,trim,0,1.055,.884,'dashboard');block('Centre display',.24,.135,.008,.012,display,0,1.055,.861,'dashboard');
 for(const x of [-.67,.67]){block('Air vent recess',.15,.06,.015,.012,rubber,x,.973,.861,'dashboard');for(let j=0;j<3;j++)block('Air vent slat',.12,.004,.012,.001,silver,x,.954+j*.017,.851,'dashboard');}
 block('Climate control panel',.23,.06,.025,.012,trim,0,.868,.849,'dashboard');
 for(const x of [-.075,.075]){const knob=cyl(T,staticGroup,.016,.016,.013,silver,x,.868,.830,12);knob.rotation.x=Math.PI/2;named(knob,'Climate dial','dashboard');}
 const steering=new T.Group();steering.name='Steering wheel';steering.position.set(-.40,1.02,.665);steering.rotation.x=-.20;staticGroup.add(steering);
 named(mesh(T,steering,new T.TorusGeometry(.145,.015,8,32),rubber),'Steering rim','steering');
 for(const a of [0,Math.PI,Math.PI*1.5])named(rod(T,steering,[0,0,0],[Math.cos(a)*.13,Math.sin(a)*.13,0],.012,trim),'Steering spoke','steering');
 named(rounded(T,steering,.11,.075,.04,.025,trim),'Steering hub','steering');
 bar('Steering column',[-.40,1.02,.685],[-.40,.88,.995],.025,trim,'steering');
 for(const x of [-.47,-.31]){const pedal=block('Pedal',.075,.022,.12,.012,rubber,x,.144,1.02,'floor');pedal.rotation.x=.35;}
 // Front and rear assemblies have separate housings, lenses, reflectors and grille.
 block('Front bumper',1.65,.24,.18,.065,paint,0,.40,2.14);
 block('Lower intake surround',1.21,.145,.055,.04,rubber,0,.395,2.211,'lamps');
 for(let j=0;j<4;j++)block('Grille horizontal blade',1.09,.009,.012,.003,trim,0,.348+j*.031,2.242,'lamps');
 for(const x of [-.45,-.225,0,.225,.45])block('Grille vertical fin',.008,.105,.012,.002,silver,x,.395,2.244,'lamps');
 block('Upper nose trim',.66,.04,.025,.014,trim,0,.624,2.218,'lamps');
 for(const sign of [-1,1]){
  block('Headlamp housing',.43,.115,.09,.035,trim,sign*.565,.635,2.133,'lamps');
  block('Headlamp inner reflector',.365,.072,.012,.02,silver,sign*.565,.637,2.184,'lamps');
  block('LED eyebrow',.35,.014,.015,.005,led,sign*.565,.676,2.195,'lamps');
  for(const dx of [-.09,.075]){const projector=cyl(T,staticGroup,.024,.024,.015,led,sign*.565+dx,.628,2.199,16);projector.rotation.x=Math.PI/2;named(projector,'Headlight projector','lamps');}
  block('Lower corner vent',.17,.11,.025,.02,trim,sign*.715,.40,2.222,'lamps');
  block('Rear lamp housing',.44,.13,.05,.035,trim,sign*.545,.81,-2.159,'lamps');
  block('Rear lamp lens',.395,.089,.014,.025,red,sign*.545,.815,-2.192,'lamps');
  block('Rear signature strip',.33,.018,.009,.006,red,sign*.545,.84,-2.205,'lamps');
  block('Reverse lamp',.065,.023,.009,.006,led,sign*.43,.793,-2.205,'lamps');
 }
 block('Rear bumper',1.63,.20,.15,.06,paint,0,.34,-2.16);
 block('Rear diffuser',1.31,.075,.06,.025,trim,0,.265,-2.22);
 for(const x of [-.62,.62])block('Rear bumper reflector',.13,.025,.012,.008,red,x,.365,-2.243,'lamps');
 const frontPlate=label(T,staticGroup,'INTERVALO',.36,.069,0,.52,2.246,{color:'#30383c',background:'#e7e8de'});frontPlate.name='Front plate';
 const rearPlate=label(T,staticGroup,'YPF 01',.36,.069,0,.57,-2.148,{color:'#30383c',background:'#e7e8de'});rearPlate.rotation.y=Math.PI;rearPlate.name='Rear plate';
 const fuel=block('Left rear fuel flap',.008,.14,.17,.024,paint,-.921,.839,-1.56);fuel.userData.interaction='fuel';
 // Wheels remain independent groups: axle/spin axis local X, fronts at positive Z.
 const wheels=[];
 for(const x of [-.804,.804])for(const z of [-1.35,1.40]){
  const wheel=new T.Group();wheel.name=`wheel-${x<0?'left':'right'}-${z>0?'front':'rear'}`;wheel.position.set(x,.335,z);wheel.userData.dynamic=true;wheel.userData.excludeFromStaticBatch=true;group.add(wheel);wheels.push(wheel);
  const sign=Math.sign(x),tire=cyl(T,wheel,.335,.335,.19,rubber,0,0,0,32);tire.rotation.z=Math.PI/2;tire.name='Rounded tyre';
  for(const side of [-1,1]){const bead=mesh(T,wheel,new T.TorusGeometry(.278,.045,8,28),rubber,side*.070,0,0);bead.rotation.y=Math.PI/2;bead.name='Tyre shoulder';}
  const barrel=cyl(T,wheel,.232,.232,.182,trim,0,0,0,24);barrel.rotation.z=Math.PI/2;
  const rim=mesh(T,wheel,new T.TorusGeometry(.224,.012,6,28),silver,sign*.098,0,0);rim.rotation.y=Math.PI/2;rim.name='Alloy rim lip';
  const brake=cyl(T,wheel,.177,.177,.012,silver,sign*.068,0,0,24);brake.rotation.z=Math.PI/2;
  rounded(T,wheel,.035,.12,.065,.012,trim,sign*.080,.10,.105).name='Brake caliper';
  for(let j=0;j<5;j++){
   const a=j*Math.PI*2/5;for(const offset of [-.10,.10])rod(T,wheel,[sign*.103,Math.sin(a)*.07,Math.cos(a)*.07],[sign*.103,Math.sin(a+offset)*.215,Math.cos(a+offset)*.215],.012,silver).name='Split alloy spoke';
   const bolt=cyl(T,wheel,.010,.010,.012,trim,sign*.110,Math.sin(a)*.044,Math.cos(a)*.044,8);bolt.rotation.z=Math.PI/2;
  }
  const centre=cyl(T,wheel,.032,.032,.012,silver,sign*.115,0,0,16);centre.rotation.z=Math.PI/2;centre.name='Wheel centre cap';
 }
 const driver=createPerson(T,{driver:true});driver.group.position.set(-.40,.60,.25);
 for(const side of ['left','right']){driver[side+'Leg'].rotation.x=-Math.PI/2;driver[side+'Knee'].rotation.x=Math.PI/2;}
 carArmPose(T,driver,'left',[-.14,.435,.392]);carArmPose(T,driver,'right',[.14,.435,.392]);
 driver.group.userData.dynamic=true;driver.group.userData.excludeFromStaticBatch=true;driver.group.userData.skipStaticBatch=true;
 driver.group.traverse(o=>{o.userData.excludeFromStaticBatch=true;o.userData.skipStaticBatch=true;});group.add(driver.group);
 driver.restPose={};for(const side of ['left','right'])for(const part of ['Arm','Forearm','Hand','Leg','Knee'])driver.restPose[side+part]=driver[side+part].quaternion.clone();
 group.userData.dimensions={length:4.5,width:1.85,height:1.535,mirrorsWidth:2.17};
 const interactionPoints={window:new T.Vector3(-.89,1.12,.25),fuel:new T.Vector3(-.925,.839,-1.56)};
 group.userData.interactionPoints=interactionPoints;
 return {group,wheels,driver,steeringWheel:steering,staticGroup,roof,frontSeats,collisionParts,interactionPoints,setColor(value){paint.color.set(value);}};
}
export function createStation(T){
 const group=new T.Group();group.name='intervalo-station';const white=mat(T,C.white),blue=mat(T,C.blue),concrete=mat(T,0x878d8b,{roughness:.94,metalness:0}),dark=mat(T,C.dark),silver=mat(T,C.silver,{metalness:.12,roughness:.65}),wood=mat(T,C.wood,{roughness:.90,metalness:0}),green=mat(T,C.green,{roughness:1,metalness:0});
 // Crown environment-detail uses seeded grain and a .007 m bump, never photo assets.
 let grainSeed=9123;const random=()=>((grainSeed=(grainSeed*1664525+1013904223)>>>0)/4294967296);
 const pixels=new Uint8Array(64*64*4);for(let i=0;i<64*64;i++){const value=242+Math.floor(random()*14);pixels.set([value,value,value,255],i*4);}
 const grain=new T.DataTexture(pixels,64,64);grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(.5,.5);grain.generateMipmaps=true;grain.minFilter=T.LinearMipmapLinearFilter;grain.magFilter=T.LinearFilter;grain.needsUpdate=true;
 concrete.bumpMap=grain;concrete.bumpScale=.007;
 const ground=slab(T,group,40,40,.24,.7,concrete,0,-.12,0);ground.name='site-ground';const road=slab(T,group,40,7,.026,.08,mat(T,C.asphalt,{roughness:.97,metalness:0}),0,.014,15.8);
 for(const [x,w]of [[-17,6],[-9,2],[-1,2],[7,2],[17,6]])slab(T,group,w,2.1,.14,.10,white,x,.07,11.25);
 for(let x=-18;x<20;x+=5)box(T,group,2.5,.012,.10,white,x,.035,16.1);
 const joint=mat(T,0xc3c5bd);for(let x=-18;x<=18;x+=3)box(T,group,.012,.005,19,joint,x,.005,-.5);
 const roof=new T.Group();roof.name='hideable-canopy';group.add(roof);slab(T,roof,27,13,.30,.20,white,0,5.8,0);rounded(T,roof,27,.40,.10,.05,blue,0,5.81,6.49);rounded(T,roof,27,.40,.10,.05,blue,0,5.81,-6.49);box(T,roof,.10,.40,12.9,blue,-13.47,5.81,0);box(T,roof,.10,.40,12.9,blue,13.47,5.81,0);
 label(T,roof,'YPF',2.15,.52,-10.6,5.82,6.55,{font:'900 94px Arial'});label(T,roof,'EN MOVIMIENTO',3.2,.23,9.4,5.81,6.55,{font:'600 62px Arial'});
 const columns=new T.Group();columns.name='canopy-columns';group.add(columns);const columnPositions=[];for(const x of [-12.5,12.5])for(const z of [-5.45,5.45]){cyl(T,columns,.19,.23,5.64,white,x,2.82,z);cyl(T,columns,.25,.26,.19,silver,x,.095,z);columnPositions.push(new T.Vector3(x,0,z));}
 const light=mat(T,0xf5f3df,{emissive:0xfff6d8,emissiveIntensity:.65});for(const x of [-8,0,8])for(const z of [-3.4,3.4])slab(T,roof,2.8,.16,.018,.04,light,x,5.64,z);
 const pumps=[],islands=[],accessoryPositions=[],islandEdge=mat(T,0x8f9693);
 for(const [index,x]of [-10,0,10].entries()){
  const island=slab(T,group,2.6,15,.18,.34,[concrete,islandEdge],x,.09,-2.6);island.name='island-'+index;
  const data={group:island,center:new T.Vector3(x,0,0),totemPosition:new T.Vector3(x,.18,-1.3),pumpPosition:new T.Vector3(x,.18,2.2),carStop:new T.Vector3(x+3,0,.4),attendantPosition:new T.Vector3(x+1.5,0,.4)};islands.push(data);
  const pump=new T.Group();pump.name='pump-'+index;pump.position.set(x,.18,2.2);group.add(pump);rounded(T,pump,1.08,.22,.65,.08,dark,0,.11,0);rounded(T,pump,.95,.78,.55,.08,blue,0,.59,0);rounded(T,pump,1.12,.68,.63,.09,white,0,1.30,0);rounded(T,pump,1.10,.12,.65,.035,blue,0,1.63,0);
  rounded(T,pump,.75,.25,.018,.018,dark,0,1.43,.325);label(T,pump,'000.00',.60,.12,0,1.45,.338,{color:'#b7d8c4',font:'500 74px monospace'});label(T,pump,'LITROS',.26,.045,0,1.35,.338,{color:'#a9bdb6'});label(T,pump,'YPF',.56,.20,0,.67,.286,{font:'900 86px Arial'});label(T,pump,'INFINIA',.46,.075,0,.43,.286);label(T,pump,String(index+1).padStart(2,'0'),.21,.14,-.32,1.14,.327,{color:'#1c61ae'});
  for(let k=0;k<3;k++)cyl(T,pump,.036,.036,.015,mat(T,[0x418a72,0xe5c16a,0x4b73a0][k]),-.08+k*.14,1.13,.333,12).rotation.x=Math.PI/2;
  const nozzleDock=new T.Vector3(x+.8,1.3,2.1),dock=new T.Group();dock.name='nozzle-dock';dock.position.set(.8,1.12,-.1);pump.add(dock);rounded(T,dock,.12,.20,.10,.025,dark);rod(T,pump,[.51,1.12,-.1],[.8,1.12,-.1],.035,silver);
  const hose=tube(T,pump,[[.49,1.46,-.16],[.91,1.36,-.17],[.96,.30,-.18],[.69,.19,-.16],[.72,.86,-.1],[.8,1.05,-.1]],.026,dark),nozzle=createProduct(T,'nozzle');nozzle.position.copy(dock.position);pump.add(nozzle);hose.visible=false;nozzle.visible=false;pumps.push({group:pump,nozzleDock,dock,hose,nozzle,index,islandX:x});
  const binPos=new T.Vector3(x+.92,.18,-3.14),rackPos=new T.Vector3(x+.94,.18,-2.40);const bin=new T.Group();bin.position.copy(binPos);group.add(bin);cyl(T,bin,.22,.19,.62,dark,0,.31,0,20);cyl(T,bin,.235,.23,.065,silver,0,.65,0,20);cyl(T,bin,.14,.14,.009,dark,0,.687,0,20);
  const rack=new T.Group();rack.position.copy(rackPos);group.add(rack);cyl(T,rack,.14,.12,.34,blue,0,.25,0);rod(T,rack,[0,.17,0],[0,.96,.08],.015,silver);box(T,rack,.27,.042,.045,dark,0,.96,.08);bin.visible=false;rack.visible=false;accessoryPositions.push({bin:binPos,squeegee:rackPos,binGroup:bin,squeegeeGroup:rack});
  for(const z of [-3.96,3.96]){cyl(T,group,.065,.065,.72,silver,x,.54,z);cyl(T,group,.068,.068,.12,blue,x,.76,z);}
 }
 const store=new T.Group();store.name='wood-slat-convenience-store';store.position.set(0,0,-13);group.add(store);slab(T,store,22,6.4,.20,.20,white,0,.10,0);box(T,store,21.5,3.7,5.9,dark,0,2.05,-.1);slab(T,store,22.4,6.6,.21,.13,white,0,4,0);
 const glass=mat(T,0x9db9b9,{roughness:.32,flatShading:false,transparent:true,opacity:.40,depthWrite:false,side:T.DoubleSide});box(T,store,9.4,2.80,.12,mat(T,0xddd7c7),0,1.75,2.86);box(T,store,9.0,2.55,.10,mat(T,0x526a6b),0,1.65,2.95);
 for(const x of [-3.3,-1.1,1.1,3.3]){quad(T,store,[[x-1.04,.32,3.04],[x+1.04,.32,3.04],[x+1.04,2.94,3.04],[x-1.04,2.94,3.04]],glass);box(T,store,.055,2.68,.075,silver,x-1.07,1.63,3.07);}
 for(const x of [-.15,.15])rod(T,store,[x,1.15,3.12],[x,1.65,3.12],.017,silver);
 for(const side of [-1,1])for(let i=0;i<26;i++)box(T,store,.12,3.25,.18,wood,side*(4.93+i*.215),1.91,2.99);
 box(T,store,10,.64,.25,white,0,3.40,3);label(T,store,'FULL',1.85,.48,0,3.42,3.137,{color:'#246751',font:'800 88px Arial'});label(T,store,'CAFÉ · TIENDA',2.5,.20,3.45,3.40,3.137,{color:'#344c4b'});label(T,store,'BIENVENIDOS',1.4,.14,0,2.64,3.08,{color:'#f5f2e9'});
 const entrancePosition=new T.Vector3(0,.20,-9.85);for(const x of [-7,-3.5,3.5,7]){for(const side of [-1,1])box(T,group,.055,.012,3.1,white,x+side*1.45,.014,-7.1);box(T,group,2.9,.012,.06,white,x,.014,-8.63);}
 const landscape=new T.Group();landscape.name='landscaping';group.add(landscape);const leaf=mat(T,0x80916c,{roughness:1,metalness:0}),soil=mat(T,0x999b8d,{roughness:1,metalness:0});
 for(const x of [-17.1,17.1]){slab(T,landscape,3,15,.30,.65,white,x,.15,-4.2);slab(T,landscape,2.7,14.7,.05,.58,soil,x,.315,-4.2);for(let i=0;i<6;i++){const z=-10.2+i*2.4;orb(T,landscape,.70,.40,.74,green,x,.69,z,10);orb(T,landscape,.42,.32,.42,leaf,x+.38,.67,z+.32,10);}for(const z of [-8,1.8]){rod(T,landscape,[x,.34,z],[x,2.5,z],.095,wood,.055);rod(T,landscape,[x,1.65,z],[x+.48,2.7,z+.18],.047,wood,.022);orb(T,landscape,1.1,1.1,.95,green,x,3,z,10);orb(T,landscape,.71,.78,.72,leaf,x+.55,3.28,z+.13,10);}}
 // Small crossed grass blades use Crown's geometry and base green; sparse at this scale.
 const blades=[];for(let k=0;k<3;k++){const angle=k*Math.PI/3,dx=Math.cos(angle)*.04,dz=Math.sin(angle)*.04;blades.push(-dx,0,-dz,dx,0,dz,dx*.4,.085,dz*.4);}
 const grassGeometry=new T.BufferGeometry();grassGeometry.setAttribute('position',new T.Float32BufferAttribute(blades,3));grassGeometry.computeVertexNormals();
 const grass=new T.InstancedMesh(grassGeometry,mat(T,0x6d9954,{roughness:1,metalness:0,side:T.DoubleSide}),160),dummy=new T.Object3D();grass.name='Crown-family short grass';
 for(let i=0;i<160;i++){dummy.position.set((i<80?-17.1:17.1)+(random()-.5)*2.35,.345,-11.2+random()*14);dummy.rotation.y=random()*Math.PI*2;dummy.scale.setScalar(.6+random()*.8);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);grass.setColorAt(i,new T.Color().setHSL(.23+random()*.035,.28+random()*.15,.28+random()*.12));}
 grass.instanceMatrix.needsUpdate=true;grass.instanceColor.needsUpdate=true;grass.receiveShadow=true;landscape.add(grass);
 return {group,roof,columns,pumps,islands,store,ground,road,landscape,accessoryPositions,columnPositions,entrancePosition,totemPositions:islands.map(i=>i.totemPosition.clone()),carStops:islands.map(i=>i.carStop.clone()),palette:{...C},bounds:{width:40,depth:40},canopyHeight:5.8};
}









