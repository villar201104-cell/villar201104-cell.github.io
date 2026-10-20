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
