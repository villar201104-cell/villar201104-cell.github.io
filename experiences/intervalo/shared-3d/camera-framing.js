// Engine-injected helpers. Fit the selected subject, never an entire city by accident.
export function fitSubject(T,camera,controls,bounds,{direction=[1,.55,1],padding=1.2,far=1000}={}){
 if(bounds.isEmpty())throw Error('Cannot frame an empty subject');
 const sphere=bounds.getBoundingSphere(new T.Sphere()),vertical=T.MathUtils.degToRad(camera.getEffectiveFOV())/2,horizontal=Math.atan(Math.tan(vertical)*camera.aspect),distance=sphere.radius*padding/Math.sin(Math.min(vertical,horizontal));
 const d=new T.Vector3(...direction).normalize();camera.position.copy(sphere.center).addScaledVector(d,distance);controls.target.copy(sphere.center);camera.near=Math.max(.01,(distance-sphere.radius)*.06);camera.far=Math.max(far,distance+sphere.radius*3);camera.updateProjectionMatrix();controls.update();return{distance,radius:sphere.radius};
}
// Damping is based on elapsed time, so 30/60/120 Hz do not change the composition.
export function dampVector(current,target,dt,halfLife=.16){return current.lerp(target,1-Math.exp(-Math.LN2*Math.max(0,dt)/halfLife));}
// Maintain the lens and subject proportions on narrow viewports by moving back.
// Only call for authored views: manual orbit remains owned by the user.
export function frameShot(shot,aspect,referenceAspect=1.5){const k=Math.max(1,referenceAspect/Math.max(.35,aspect));return {...shot,p:shot.p.map((p,i)=>shot.t[i]+(p-shot.t[i])*k)};}
