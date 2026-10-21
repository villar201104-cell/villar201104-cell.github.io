import {createVisit,sampleVisit} from './timeline.js';
// Fixed editorial cycle: identical poses for playback, seeking and repeated loops.
export const SLOT_DURATION=180;
export const LOOP_DURATION=SLOT_DURATION*3;
export const INITIAL_TIME=0;
export const LANE_DELAYS=[0,32,64];
const ORDERS=['coffee','drink','snack'];
export const VISITS=Array.from({length:3},(_,lane)=>Array.from({length:3},(_,visit)=>createVisit(ORDERS[(lane+visit)%3],(lane+visit)%3!==1,(lane+visit)%3===2)));
export function sampleLoop(time,lane){
 const cycle=((time%LOOP_DURATION)+LOOP_DURATION)%LOOP_DURATION;
 const pending=cycle<LANE_DELAYS[lane];
 const local=pending?0:cycle-LANE_DELAYS[lane];
 const index=Math.floor(local/SLOT_DURATION),visit=VISITS[lane][index],elapsed=local%SLOT_DURATION;
 const clock=Math.min(elapsed,visit.duration-.000001);
 return {visit,index,clock,offsite:pending||elapsed>=visit.duration,step:sampleVisit(visit,clock)};
}
export function formatTime(time){const s=Math.max(0,Math.floor(time));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}


// Service shortcuts sample the same continuous timeline: deliveries and payments
// remain automatic, and all other islands/traffic keep their synchronized poses.
export const SERVICE_LANE=0;
export const SERVICE_CUES=Object.fromEntries(['coffee','snack','drink','fuel','clean'].map(key=>{
 const index=key==='clean'?VISITS[SERVICE_LANE].findIndex(v=>v.clean):key==='fuel'?0:VISITS[SERVICE_LANE].findIndex(v=>v.order===key);
 const visit=VISITS[SERVICE_LANE][index];
 const startId=key==='clean'?'toSqueegee':key==='fuel'?'toPump':'toTotem';
 const endId=key==='clean'?'rackSqueegee':'returnCard';
 const offset=LANE_DELAYS[SERVICE_LANE]+index*SLOT_DURATION;
 return [key,{start:offset+visit.steps.find(s=>s.id===startId).start,end:offset+visit.steps.find(s=>s.id===endId).end,order:visit.order}];
}));
