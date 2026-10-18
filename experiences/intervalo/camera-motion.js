// Critically damped tracking: bounded travel speed and continuous velocity.
// The camera keeps its previous velocity across action changes, avoiding hard cuts.
export function createCameraMotion(T){
 const velocity=new T.Vector3(),targetVelocity=new T.Vector3();
 function damp(current,goal,speed,dt,limit){
  const omega=2/1.6,x=omega*dt,decay=1/(1+x+.48*x*x+.235*x*x*x);
  const change=current.clone().sub(goal).clampLength(0,limit*1.6),adjusted=current.clone().sub(change);
  const temp=speed.clone().addScaledVector(change,omega).multiplyScalar(dt);
  speed.addScaledVector(temp,-omega).multiplyScalar(decay);
  const next=adjusted.add(change.add(temp).multiplyScalar(decay));
  if(goal.clone().sub(current).dot(next.clone().sub(goal))>0){next.copy(goal);speed.set(0,0,0);}
  current.copy(next);
 }
 return {reset(){velocity.set(0,0,0);targetVelocity.set(0,0,0);},update(position,target,shot,dt,flight=false){if(dt<=0)return;damp(position,new T.Vector3(...shot.p),velocity,Math.min(dt,.05),flight?50:10);damp(target,new T.Vector3(...shot.t),targetVelocity,Math.min(dt,.05),flight?50:10);}};
}
