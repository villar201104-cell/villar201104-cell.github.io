// Camera response in subject/orbit coordinates. Translation never alters pitch.
// Exact critically damped integration, using seconds rather than frame counts.
export function createCameraMotion(T){
 const targetVelocity=new T.Vector3(),orbitVelocity=new T.Vector3();
 const aim=new T.Vector3(),orbit=new T.Vector3(),goal=new T.Vector3(),desired=new T.Vector3();
 let initialized=false;
 function spring(value,velocity,destination,dt,tau){
  const w=2/tau,e=Math.exp(-w*dt);
  for(const axis of ['x','y','z']){const d=value[axis]-destination[axis],c=velocity[axis]+w*d;
   value[axis]=destination[axis]+(d+c*dt)*e;velocity[axis]=(velocity[axis]-w*c*dt)*e;}
 }
 return {reset(){initialized=false;targetVelocity.set(0,0,0);orbitVelocity.set(0,0,0);},
 update(position,target,shot,dt,flight=false,rate=1){
  if(dt<=0)return;
  if(!initialized){aim.copy(target);const s=new T.Spherical().setFromVector3(position.clone().sub(target));orbit.set(Math.log(Math.max(.2,s.radius)),s.phi,s.theta);initialized=true;}
  goal.set(...shot.t);const s=new T.Spherical().setFromVector3(new T.Vector3(...shot.p).sub(goal));
  desired.set(Math.log(Math.max(.2,s.radius)),s.phi,orbit.z+Math.atan2(Math.sin(s.theta-orbit.z),Math.cos(s.theta-orbit.z)));
  const elapsed=Math.min(dt,.1)*Math.max(.25,rate),steps=Math.max(1,Math.ceil(elapsed/.025));
  for(let i=0;i<steps;i++){spring(aim,targetVelocity,goal,elapsed/steps,shot.response||.85);spring(orbit,orbitVelocity,desired,elapsed/steps,shot.response||.85);}
  target.copy(aim);position.copy(aim).add(new T.Vector3().setFromSpherical(new T.Spherical(Math.exp(orbit.x),orbit.y,orbit.z)));
 }};
}
