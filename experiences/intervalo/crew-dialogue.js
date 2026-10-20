// Optional editorial preview: all cues follow the sampled visit, including seeking.
export const ROLES={es:{attendant:'Playero',driver:'Conductor',island:'Isla'},en:{attendant:'Attendant',driver:'Driver',island:'Island'},de:{attendant:'Servicekraft',driver:'Fahrer',island:'Insel'}};
const products={es:{coffee:'un café',drink:'un refresco',snack:'un snack'},en:{coffee:'a coffee',drink:'a cold drink',snack:'a snack'},de:{coffee:'einen Kaffee',drink:'ein Kaltgetränk',snack:'einen Snack'}};
const cues=[
 {step:'greet',seconds:6,actor:'driver',text:{es:'Lleno y {order}, por favor.',en:'A full tank and {order}, please.',de:'Volltanken und {order}, bitte.'}},
 {step:'toTotem',seconds:6,actor:'attendant',text:{es:'Ya preparo tu pedido.',en:'I’ll prepare your order now.',de:'Ich bereite deine Bestellung vor.'}},
 {step:'deliver',seconds:6,actor:'attendant',text:{es:'Acá tenés tu pedido.',en:'Here’s your order.',de:'Hier ist deine Bestellung.'}},
 {step:'takeCard',seconds:6,actor:'driver',text:{es:'Pago con tarjeta.',en:'I’ll pay by card.',de:'Ich zahle mit Karte.'}},
 {step:'backWithCard',seconds:6,actor:'attendant',text:{es:'Pago confirmado. Tu tarjeta y comprobante.',en:'Payment confirmed. Your card and receipt.',de:'Zahlung bestätigt. Hier sind Karte und Beleg.'}},
 {step:'toSqueegee',seconds:6,actor:'driver',text:{es:'¿Me limpiás el parabrisas?',en:'Could you clean the windscreen?',de:'Kannst du die Scheibe reinigen?'}},
 {step:'clean',seconds:5,actor:'attendant',text:{es:'Sí, ya me ocupo.',en:'Of course. I’m on it.',de:'Klar, ich kümmere mich darum.'}},
 {step:'toWasteWindow',seconds:6,actor:'driver',text:{es:'¿Podés tirar esto, por favor?',en:'Could you dispose of this, please?',de:'Kannst du das bitte entsorgen?'}},
 {step:'standClear',seconds:5,actor:'attendant',text:{es:'Listo. ¡Buen viaje!',en:'All set. Have a good trip!',de:'Alles erledigt. Gute Fahrt!'}}
];
const schedules=new WeakMap();
export function dialogueFor(visit,clock,language='en'){
 const lang=ROLES[language]?language:'en';
 let scheduled=schedules.get(visit);
 if(!scheduled){scheduled=cues.flatMap(c=>{const step=visit.steps.find(s=>s.id===c.step);return step?[{...c,from:step.start}]:[];}).sort((a,b)=>a.from-b.from);schedules.set(visit,scheduled);}
 for(let i=0;i<scheduled.length;i++){const c=scheduled[i],to=Math.min(c.from+c.seconds,scheduled[i+1]?.from??visit.duration);if(clock>=c.from&&clock<to)return {actor:c.actor,toActor:c.actor==='driver'?'attendant':'driver',from:c.from,to,text:c.text[lang].replace('{order}',products[lang][visit.order]),language:lang};}
 return null;
}
export function createCrewDialogue(host,THREE){
 const card=document.createElement('div');card.className='crew-dialogue';card.hidden=true;
 const header=document.createElement('span'),text=document.createElement('q');header.className='crew-speaker';text.className='crew-line';card.append(header,text);host.append(card);
 const style=document.createElement('style');style.textContent="\n.crew-dialogue{position:absolute;left:0;top:0;z-index:5;pointer-events:none;width:max-content;max-width:min(244px,calc(100% - 24px));box-sizing:border-box;padding:8px 11px;background:#fffefa;color:#222d29;border:0;border-radius:5px;box-shadow:none;text-align:left;font:13px/1.45 'Instrument Sans',Arial,sans-serif;transform:translate(-50%,-100%)}\n.crew-dialogue[hidden]{display:none}\n.crew-speaker{display:none}\n.crew-line{font:inherit;quotes:none}\n.crew-line:before,.crew-line:after{content:none}\n.crew-dialogue.anchored:after{content:'';position:absolute;left:calc(50% - 4px);bottom:-4px;width:8px;height:8px;background:#fffefa;transform:rotate(45deg)}\n.crew-dialogue.docked{transform:none;left:12px!important;top:44px!important}\n.crew-dialogue.docked .crew-speaker{display:inline;font-weight:500;margin-right:5px}\n@media(max-width:480px){.crew-dialogue{max-width:min(224px,calc(100% - 24px));padding:7px 10px}}\n";document.head.append(style);
 const p=new THREE.Vector3(),head=new THREE.Vector3();let last='';
 return {update(lane,camera,language,enabled=true){
  const cue=lane&&!lane.offsite&&dialogueFor(lane.visit,lane.clock,language);
  if(!enabled||!cue){card.hidden=true;return;}
  const actor=cue.actor==='driver'?lane.car.driver?.group:lane.person.group;
  if(!actor){card.hidden=true;return;}card.hidden=false;
  const roles=ROLES[cue.language],key=[lane.i,cue.from,cue.language,cue.text].join('|');
  if(key!==last){header.textContent=roles[cue.actor]+':';text.textContent=cue.text;card.setAttribute('aria-label',roles[cue.actor]+' → '+roles[cue.toActor]+': '+cue.text);card.lang=cue.language;last=key;}
  actor.getWorldPosition(head);head.y+=cue.actor==='driver'?1.15:2;camera.updateMatrixWorld();p.copy(head).project(camera);
  const w=host.clientWidth,h=host.clientHeight,x=(p.x+1)*w/2,y=(1-p.y)*h/2;
  const dock=p.z< -1||p.z>1||head.clone().applyMatrix4(camera.matrixWorldInverse).z>=0||camera.position.distanceTo(head)>55||x<140||x>w-140||y<105||y>h-95;
  card.classList.toggle('docked',dock);card.classList.toggle('anchored',!dock);card.style.left=x.toFixed(1)+'px';card.style.top=y.toFixed(1)+'px';
 }};
}
