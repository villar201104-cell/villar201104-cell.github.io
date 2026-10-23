// Task-based viewpoints below the permanent canopy, never a car chase.
const smooth=u=>{u=Math.max(0,Math.min(1,u));return u*u*u*(u*(u*6-15)+10);};
const task=id=>['toTotem','openFridge','prepare','closeFridge','toTerminal','pay'].includes(id)?'product':
 ['toGlass','clean','backSqueegee','takeSqueegee','toSqueegee','rackSqueegee'].includes(id)?'glass':
 ['toPump','takeNozzle','toTank','insert','fuel','remove','returnNozzle','dock'].includes(id)?'fuel':'window';
const shots={
 window:{p:[1.1,2.45,6],t:[2.05,1.12,.55]},
 fuel:{p:[1.25,2.6,4.1],t:[1.8,1.12,-1.1]},
 product:{p:[2,2.7,3.8],t:[.35,1.30,-1.3]},
 glass:{p:[.7,2.75,5.7],t:[2.2,1.15,1.25]}
};
export function serviceCamera(lane,T){
 const current=lane?.visit?.steps.findIndex(s=>lane.clock<s.end)??0,steps=lane?.visit?.steps||[];
 const index=Math.max(0,current),step=steps[index],id=step?.id||'arrive',key=task(id),shot=shots[key];
 let previous=index;while(previous>0&&task(steps[previous-1].id)===key)previous--;
 const before=shots[previous?task(steps[previous-1].id):key],start=steps[previous]?.start||0;
 const u=smooth(((lane?.clock||0)-start)/3);
 const p=before.p.map((v,i)=>v+(shot.p[i]-v)*u),t=before.t.map((v,i)=>v+(shot.t[i]-v)*u);
 p[0]+=lane?.x||0;t[0]+=lane?.x||0;
 return {pos:new T.Vector3(...p),target:new T.Vector3(...t),subject:key};
}
