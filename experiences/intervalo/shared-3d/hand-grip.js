import {reachHuman} from './human-motion.js';
// The palm sits on the rear contact surface, never at the object's centre.
export function gripHuman(T,human,side,point,orientation){
 const hand=human[side+'Hand'],offset=new T.Vector3(0,-.045,0).applyQuaternion(orientation);
 const wrist=point.clone().sub(offset),endpoint=wrist.clone();
 for(let i=0;i<5;i++){
  reachHuman(T,human,side,endpoint);
  const error=wrist.clone().sub(hand.getWorldPosition(new T.Vector3()));
  if(error.lengthSq()<1e-10)break;
  endpoint.add(error);
 }
 hand.quaternion.copy(hand.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(orientation));
 hand.userData.setGrip?.(true);hand.updateWorldMatrix(false,true);
}
export function orientPalm(T,human,side,orientation){
 const hand=human[side+'Hand'],point=hand.localToWorld(new T.Vector3(0,-.045,0));
 gripHuman(T,human,side,point,orientation);
 return hand.localToWorld(new T.Vector3(0,-.045,0));
}
