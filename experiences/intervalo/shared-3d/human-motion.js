// Shared anatomical arm solver. Targets and elbow poles use world coordinates.
export function reachHuman(T,p,side,target){
 const upper=p[side+'Arm'],fore=p[side+'Forearm'],hand=p[side+'Hand'];if(!upper||!fore||!hand)return;
 p.group.updateMatrixWorld(true);
 const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),origin=upper.getWorldPosition(V());
 const l1=Math.abs(fore.position.y),l2=Math.abs(hand.position.y)+.035,dir=target.clone().sub(origin);
 const d=Math.max(.08,Math.min(dir.length(),l1+l2-.018));dir.normalize();
 const bodyQ=p.group.getWorldQuaternion(new T.Quaternion());
 const pole=V(side==='right'?.55:-.55,-1,.15).applyQuaternion(bodyQ);
 const bend=pole.clone().addScaledVector(dir,-pole.dot(dir));
 if(bend.lengthSq()<1e-8){bend.copy(V(0,0,1).applyQuaternion(bodyQ));bend.addScaledVector(dir,-bend.dot(dir));}bend.normalize();
 const a=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-a*a));
 const elbow=origin.clone().addScaledVector(dir,a).addScaledVector(bend,h);
 upper.quaternion.setFromUnitVectors(V(0,-1,0),elbow.clone().sub(origin).normalize().applyQuaternion(upper.parent.getWorldQuaternion(new T.Quaternion()).invert()));
 p.group.updateMatrixWorld(true);
 fore.quaternion.setFromUnitVectors(V(0,-1,0),origin.clone().addScaledVector(dir,d).sub(elbow).normalize().applyQuaternion(fore.parent.getWorldQuaternion(new T.Quaternion()).invert()));
 hand.quaternion.identity();p.group.updateMatrixWorld(true);
}

// Shared distance-driven gait. The planted foot moves backward at body speed;
// only the swing foot lifts. Both projects use the same knee/elbow mechanics.
export function walkHuman(T,p,distance,speed){
 const blend=T.MathUtils.smoothstep(Math.abs(speed),.005,.08),cycle=.64;
 const bob=(-.035+.006*Math.cos(distance/cycle*Math.PI*4))*blend;
 for(const [i,side]of ['left','right'].entries()){
  const phase=((distance/cycle+i*.5)%1+1)%1,stance=.60;
  const swing=phase<stance?0:(phase-stance)/(1-stance);
  const z=(phase<stance?.192-.384*phase/stance:-.192+.384*(swing*swing*(3-2*swing)))*blend;
  const lift=Math.sin(Math.PI*swing)*.085*blend;
  const hip=p[side+'Leg'],knee=p[side+'Knee'],foot=p[side+'Foot'];
  const a=Math.abs(knee.position.y),b=Math.abs(foot.position.y),vertical=hip.position.y+bob-.15-lift;
  const d=Math.max(.01,Math.min(Math.hypot(vertical,z),a+b-.00001));
  const bend=Math.acos(T.MathUtils.clamp((a*a+d*d-b*b)/(2*a*d),-1,1));
  const theta=Math.atan2(z,vertical)+bend,k=Math.PI-Math.acos(T.MathUtils.clamp((a*a+b*b-d*d)/(2*a*b),-1,1));
  hip.rotation.set(-theta,0,0);knee.rotation.set(k,0,0);foot.rotation.set(theta-k,0,0);
  // Opposite arm follows the leg. A flexed elbow keeps the hands forward.
  p[side+'Arm'].rotation.set(.24*Math.cos(phase*Math.PI*2)*blend-.04,0,side==='left'?.035:-.035);
  p[side+'Forearm'].rotation.set(-.28-.13*blend*(.5+.5*Math.sin(phase*Math.PI*2)),0,0);
 }
 return bob;
}
