// Preserve the full shadow-map resolution; reuse it between 30 Hz updates.
// Geometry/camera still render at display rate. Paused/manual views refresh once.
export function shadowCadence(renderer){
 renderer.shadowMap.autoUpdate=false;let last=-Infinity;
 return (now,moving,force=false)=>{if(force||!moving||now-last>=1000/30){renderer.shadowMap.needsUpdate=true;last=now;}};
}
