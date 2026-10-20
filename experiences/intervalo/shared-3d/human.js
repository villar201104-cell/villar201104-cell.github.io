import {WORLD_STYLE} from './world-style.js';
import {PALETTE} from './palette.js';
/** Shared articulated human. Metres, Y up, +Z forward. Inject the host Three instance. */
function mat(T,color,extra={}){return new T.MeshStandardMaterial({color,...WORLD_STYLE.materials.product,flatShading:false,...extra});}
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
function createTextPlane(T,text,options={}){
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
function shell(T,parent,name,sections,material,round=false){
 const rings=[...sections].sort((a,b)=>a[0]-b[0]),vertices=[],indices=[];
 const sides=round?12:8;
 for(const [y,w,d,zc=0]of rings){const c=Math.min(w,d)*.2;const ring=round?Array.from({length:sides},(_,i)=>[Math.cos(i/sides*Math.PI*2)*w/2,Math.sin(i/sides*Math.PI*2)*d/2]):[[-w/2+c,-d/2],[w/2-c,-d/2],[w/2,-d/2+c],[w/2,d/2-c],[w/2-c,d/2],[-w/2+c,d/2],[-w/2,d/2-c],[-w/2,-d/2+c]];for(const [x,z]of ring)vertices.push(x,y,z+zc);}
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<sides;i++){const a=j*sides+i,b=j*sides+(i+1)%sides;indices.push(a,b+sides,b,a,a+sides,b+sides);}
 for(let i=1;i<sides-1;i++){indices.push(0,i,i+1);const a=(rings.length-1)*sides;indices.push(a,a+i+1,a+i);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();const out=mesh(T,parent,geometry,material);out.name=name;return out;
}
export function createHuman(T,{driver=false,shirtColor=PALETTE.cloth,pantsColor=PALETTE.cloth,skinColor=PALETTE.skin,vestColor=shirtColor,headwear='cap',gloves=false,badge=null}={}){
 const group=new T.Group();group.name=driver?'seated-driver':'station-attendant';
 const fabric=color=>mat(T,color,{...WORLD_STYLE.materials.worker,flatShading:false});
 const shirt=fabric(shirtColor),pants=fabric(pantsColor),skin=fabric(skinColor),vest=fabric(vestColor),handMaterial=gloves?fabric(PALETTE.glove):skin,shoe=fabric(PALETTE.shoe),sole=fabric(PALETTE.sole),seam=fabric(PALETTE.charcoal),reflect=fabric(PALETTE.reflective),metal=fabric(PALETTE.steel);
 const ball=(p,rx,ry,rz,m,x=0,y=0,z=0)=>{const o=mesh(T,p,new T.SphereGeometry(1,10,6),m,x,y,z);o.scale.set(rx,ry,rz);return o;};
 const upperArmLength=.29,forearmLength=.29,hipHeight=.88,shoulderHeight=1.40;
 shell(T,group,'Tailored shirt torso',[[.89,.29,.22],[1.14,.35,.235],[1.37,.43,.22],[1.43,.29,.19]],shirt);
 shell(T,group,'Work trousers waist',[[.82,.29,.23],[.94,.31,.235]],pants);
 shell(T,group,'Utility belt',[[.91,.319,.245],[.945,.32,.245]],seam);box(T,group,.048,.035,.020,metal,0,.926,.13);
 if(!driver){
  shell(T,group,'Fitted work jacket',[[.94,.315,.245],[1.12,.365,.26],[1.34,.43,.25],[1.39,.32,.22]],vest);
  shell(T,group,'Reflective waist tape',[[1.055,.35,.269],[1.103,.364,.27]],reflect);
  box(T,group,.017,.42,.014,seam,0,1.17,.139);
  for(const sign of [-1,1]){
   const front=box(T,group,.04,.22,.004,reflect,sign*.126,1.24,.132);front.rotation.z=sign*.12;
   const rear=box(T,group,.044,.22,.004,reflect,sign*.126,1.24,-.132);rear.rotation.z=sign*.13;
   box(T,group,.085,.075,.017,pants,sign*.105,.99,.137);box(T,group,.08,.017,.020,shirt,sign*.105,1.02,.146);
  }
  box(T,group,.37,.045,.004,reflect,0,1.31,-.128);
  box(T,group,.055,.12,.065,seam,.19,1.01,0);box(T,group,.011,.08,.011,seam,.19,1.10,0);
  if(badge)badge(group,{width:.085,height:.035,x:.065,y:1.345,z:.139});
 }
 cyl(T,group,.055,.061,.085,skin,0,1.445,0,10);
 const head=new T.Group();head.name='head';head.position.set(0,1.565,0);group.add(head);
 const faceMesh=ball(head,.092,.125,.096,skin,0,0,.006);faceMesh.name='Human head';
 for(const sign of [-1,1]){ball(head,.024,.033,.016,skin,sign*.095,0,0);ball(head,.006,.007,.004,seam,sign*.035,.023,.096);box(T,head,.028,.005,.005,seam,sign*.035,.038,.095);}
 ball(head,.023,.032,.024,skin,0,-.007,.096);
 const hair=fabric(0x3d342e),hairCap=mesh(T,head,new T.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI/2),hair,0,.080,0);hairCap.scale.set(.095,.055,.098);
 if(!driver&&headwear==='cap'){
  // A fabric baseball cap, retaining Crown's 1.75 m overall scale without its helmet.
  const cap=mesh(T,head,new T.SphereGeometry(1,14,7,0,Math.PI*2,0,Math.PI/2),pants,0,.080,0);cap.name='Fabric cap';cap.scale.set(.111,.105,.113);
  const band=cyl(T,head,.111,.111,.020,pants,0,.081,0,14);band.scale.z=1.02;
  slab(T,head,.215,.145,.012,.055,pants,0,.079,.105);
  if(badge)badge(head,{width:.083,height:.032,x:0,y:.116,z:.109});
 }
 if(!driver&&headwear==='helmet'){
  const helmet=fabric(PALETTE.ivory);
  const cap=mesh(T,head,new T.SphereGeometry(1,14,7,0,Math.PI*2,0,Math.PI/2),helmet,0,.080,0);cap.name='Safety helmet';cap.scale.set(.121,.105,.127);
  const brim=cyl(T,head,1,1,.016,helmet,0,.080,.017,16);brim.name='Safety helmet brim';brim.scale.set(.136,1,.153);
  box(T,head,.024,.012,.12,helmet,0,.182,.008);
  const glass=fabric(PALETTE.glass);box(T,head,.165,.037,.023,glass,0,.025,.085);
  for(const sign of [-1,1])box(T,head,.009,.015,.11,glass,sign*.087,.025,.04);
 }
 const refs={group,head};
 for(const [side,sign]of [['left',-1],['right',1]]){
  const arm=new T.Group();arm.name=side+'-shoulder';arm.position.set(sign*.22,shoulderHeight,0);group.add(arm);
  // Clothing follows a tapered deltoid/biceps silhouette, not an oversized joint ball.
  ball(arm,.056,.067,.062,shirt,0,-.025,0);
  shell(T,arm,'Upper sleeve',[[.012,.078,.09],[-.055,.112,.12],[-.15,.101,.108],[-upperArmLength,.079,.087]],shirt,true);
  if(!driver)shell(T,arm,'Reflective sleeve tape',[[-.195,.095,.102],[-.227,.091,.098]],reflect,true);
  const forearm=new T.Group();forearm.name=side+'-elbow';forearm.position.y=-upperArmLength;arm.add(forearm);
  ball(forearm,.042,.046,.046,shirt);
  shell(T,forearm,'Forearm sleeve',[[0,.079,.087],[-.075,.088,.092],[-.20,.066,.073],[-.257,.061,.068]],shirt,true);
  shell(T,forearm,'Sleeve cuff',[[-.242,.066,.074],[-.265,.064,.071]],pants,true);
  cyl(T,forearm,.029,.027,.04,skin,0,-.277,0,10);
  const hand=new T.Group();hand.name=side+'-hand-grip';hand.position.y=-forearmLength;forearm.add(hand);
  ball(hand,.033,.053,.024,handMaterial,0,-.045,0);ball(hand,.014,.029,.016,handMaterial,-sign*.029,-.029,.010);
  const leg=new T.Group();leg.name=side+'-hip';leg.position.set(sign*.098,hipHeight,0);group.add(leg);
  shell(T,leg,'Trouser thigh',[[0,.16,.19],[-.40,.13,.145]],pants);
  const knee=new T.Group();knee.name=side+'-knee';knee.position.y=-.40;leg.add(knee);
  ball(knee,.068,.07,.073,pants);shell(T,knee,'Trouser lower leg',[[0,.13,.145],[-.39,.105,.12]],pants);
  box(T,knee,.098,.105,.018,seam,0,.005,.074);
  if(!driver)shell(T,knee,'Reflective ankle tape',[[-.27,.116,.134],[-.307,.113,.130]],reflect);
  const foot=new T.Group();foot.name=side+'-foot';foot.position.y=-.33;knee.add(foot);
  shell(T,foot,'Work boot',[[.018,.12,.16,.005],[-.095,.145,.255,.048],[-.128,.15,.26,.05]],shoe);
  shell(T,foot,'Boot sole',[[-.125,.155,.27,.05],[-.15,.155,.27,.05]],sole);box(T,foot,.08,.03,.07,seam,0,-.035,.065);
  refs[side+'Arm']=arm;refs[side+'Forearm']=forearm;refs[side+'Hand']=hand;refs[side+'Leg']=leg;refs[side+'Knee']=knee;refs[side+'Foot']=foot;
  if(driver){leg.rotation.x=-1.38;knee.rotation.x=1.46;arm.rotation.set(-.58,0,-sign*.19);forearm.rotation.x=-1.58;}
 }
 if(driver)for(const child of group.children)child.position.y-=hipHeight;
 refs.rig={height:1.75,upperArmLength,forearmLength,handOffset:new T.Vector3(0,-.045,0),restAxis:new T.Vector3(0,-1,0),shoulderHeight:driver?shoulderHeight-hipHeight:shoulderHeight,shoulderHalfWidth:.22,hipHeight:driver?0:hipHeight,upperLegLength:.40,lowerLegLength:.39,rootIsPelvis:driver};group.userData.rig=refs.rig;group.userData.sharedHuman='portfolio-human-0.2';return refs;
}

