// One ordered timeline controls both the visible actions and the activity captions.
export const ORDER_NAMES={coffee:'Café',drink:'Refresco',snack:'Snack'};
export function createVisit(order='coffee',clean=true,waste=false){
 const steps=[];
 const add=(id,duration,label)=>steps.push({id,duration,label});
 add('arrive',14,'Llegada a la isla');
 add('greet',3,'El playero recibe el pedido');
 add('toPump',3,'Retira la manguera');
 add('takeNozzle',2,'Retira la manguera');
 add('toTank',3,'Se acerca al tanque');
 add('insert',2,'Conecta el pico');
 add('fuel',8,'Carga de combustible');
 add('remove',2,'Finaliza la carga');
 add('returnNozzle',3,'Guarda la manguera');
 add('dock',2,'Guarda la manguera');
 add('toTotem',4,order==='coffee'?'Va a preparar el café':'Va a buscar el pedido');
 if(order!=='coffee')add('openFridge',2,'Abre la heladera');
 add('prepare',order==='coffee'?6:4,order==='coffee'?'Prepara un café':order==='drink'?'Retira el refresco':'Retira un snack');
 if(order!=='coffee')add('closeFridge',2,'Cierra la heladera');
 add('toWindow',4,'Lleva el pedido al auto');
 add('deliver',3,'Entrega en la ventanilla');
 add('stowProduct',3.5,'El conductor guarda el pedido');
 add('takeCard',3,'Recibe la tarjeta');
 add('toTerminal',4,'Se acerca al terminal');
 add('pay',4,'Procesa el pago');
 add('backWithCard',4,'Vuelve a la ventanilla');
 add('returnCard',3,'Devuelve tarjeta y comprobante');
 if(clean){
  add('toSqueegee',4,'Busca la escobilla');add('takeSqueegee',2,'Retira la escobilla');
  add('toGlass',4,'Se acerca al parabrisas');add('clean',6,'Limpia el parabrisas');
  add('backSqueegee',4,'Devuelve la escobilla');add('rackSqueegee',2,'Guarda la escobilla');
 }
 if(waste){add('toWasteWindow',4,'Recoge un residuo del conductor');add('takeWaste',2,'Recoge un residuo del conductor');add('toBin',4,'Lleva el residuo al cesto');add('dispose',2,'Deposita el residuo');}
 add('standClear',4,'Deja libre la salida');add('depart',32,'El conductor continúa su viaje');add('wait',2,'Lista para el próximo auto');
 let cursor=0;steps.forEach(s=>{s.start=cursor;cursor+=s.duration;s.end=cursor;});
 return {order,clean,waste,steps,duration:cursor};
}
export function sampleVisit(visit,time){
 const t=Math.max(0,Math.min(time,visit.duration));
 const index=visit.steps.findIndex(s=>t<s.end);
 const i=index<0?visit.steps.length-1:index;
 const step=visit.steps[i];return {...step,index,p:Math.max(0,Math.min(1,(t-step.start)/step.duration)),progress:t/visit.duration};
}
export function chooseNextOrder(previous,rng=Math.random){const bag=Object.keys(ORDER_NAMES).filter(x=>x!==previous);return bag[Math.floor(rng()*bag.length)];}

// Expand a continuous window interaction with a short lead-in/return so the driver
// raises the arm while the attendant approaches; adjacent handoffs stay extended.
export function windowReachAmount(visit,time,transition=.9){
 let amount=0;
 for(const step of visit.steps){
  if(!['deliver','takeCard','returnCard','takeWaste'].includes(step.id))continue;
  const enter=Math.max(0,Math.min(1,(time-step.start+transition)/transition));
  const leave=Math.max(0,Math.min(1,(step.end+transition-time)/transition));
  amount=Math.max(amount,Math.min(enter,leave));
 }
 return amount;
}
