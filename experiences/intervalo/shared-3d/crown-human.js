import {createHuman} from './human.js';
import {reachHuman,walkHuman} from './human-motion.js';
// Compatibility adapter only: Crown's -Z/front and root/body API use the exact
// same mesh factory, proportions and joints as Intervalo's +Z/group API.
export function createCrownHuman(T,{vestColor='#FAA61A'}={}){
 const human=createHuman(T,{vestColor,headwear:'helmet',gloves:true});
 const root=new T.Group(),body=new T.Group();root.name='Operator / shared portfolio human';root.add(body);body.add(human.group);human.group.rotation.y=Math.PI;
 const sides=['right','left'],arms=sides.map(s=>human[s+'Arm']),hands=sides.map(s=>human[s+'Hand']);
 const legs=sides.map(s=>({hip:human[s+'Leg'],knee:human[s+'Knee'],foot:human[s+'Foot']}));
 function reach(targets){root.updateMatrixWorld(true);sides.forEach((s,i)=>reachHuman(T,human,s,root.localToWorld(new T.Vector3(...targets[i]))));}
 function legPose(z,lift,bob=0){
  const a=.40,b=.33,y=.15+lift-(.88+bob),d=Math.min(Math.hypot(y,z),a+b-.00001);
  const theta=Math.atan2(-z,-y)+Math.acos(T.MathUtils.clamp((a*a+d*d-b*b)/(2*a*d),-1,1));
  const k=Math.PI-Math.acos(T.MathUtils.clamp((a*a+b*b-d*d)/(2*a*b),-1,1));
  return {theta,k};
 }
 let distance=0,lastTime=null,previous=new T.Vector3(),lastHeading=0;
 function walk(time,speed){
  const delta=lastTime===null?0:time-lastTime,travel=root.position.distanceTo(previous),turn=Math.abs(Math.atan2(Math.sin(root.rotation.y-lastHeading),Math.cos(root.rotation.y-lastHeading)));
  if(delta<0||delta>.5){distance=time*.75;}else if(delta>0){distance+=travel+Math.min(turn,.3)*.18;}
  const turnSpeed=delta>0&&delta<.5?turn*.18/delta:0;
  body.position.y=walkHuman(T,human,distance,Math.max(speed,turnSpeed));
  previous.copy(root.position);lastTime=time;lastHeading=root.rotation.y;
 }
 function crouch(amount){const drop=Math.max(0,Math.min(.30,amount));body.position.y=-drop;const {theta,k}=legPose(0,0,-drop);legs.forEach(({hip,knee,foot})=>{hip.rotation.x=-theta;knee.rotation.x=k;foot.rotation.x=theta-k;});}
 function seated(){body.position.y=0;legs.forEach(({hip,knee,foot})=>{hip.rotation.x=-Math.PI/2;knee.rotation.x=Math.PI/2;foot.rotation.x=0;});reach([[-.115,1.18,-.45],[.115,1.18,-.45]]);}
 function idle(time,{phase=0,hands:busy=false,seated:isSeated=false,look=0,lookPitch=0,attentive=false}={}){
  const t=time+phase;human.head.rotation.set(-lookPitch-Math.sin(t*.67)*.012,-look-(attentive?0:Math.sin(t*.48)*.10+Math.sin(t*.17)*.035),Math.sin(t*.32)*.014);
  if(!busy&&!isSeated)reach([[-.24,1.01+Math.sin(t*.9)*.013,-.14],[.24,1.02+Math.sin(t*.9+1)*.013,-.14]]);
 }
 walk(0,0);root.visible=false;
 return {root,body,arms,hands,legs,human,reach,walk,idle,seated,crouch,update:(dt,distance)=>walk(distance*8,distance/Math.max(dt,.001))};
}
