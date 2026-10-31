/* One native horizontal interaction for sketches, studio, environments and CMF. */
window.initVisorGalleries=function(root,lang,signal){
 const L=(en,es,de)=>lang==='es'?es:lang==='de'?de:en;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),events={signal};
 function gallery(host,items,{before=null,colours=false,sketch=false}={}){
  if(items.length<2)return;
  const wrapper=document.createElement('div');wrapper.className='visor-gallery'+(sketch?' is-sketch':'')+(colours?' is-colour':'');
  const title=host.querySelector('h2')?.textContent||L('Image gallery','Galería de imágenes','Bildergalerie');
  if(before)before.before(wrapper);else host.append(wrapper);
  wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label',title);
  const track=document.createElement('div');track.className='visor-gallery-track';track.tabIndex=0;track.setAttribute('aria-label',L('Drag or use arrow keys to explore','Arrastrá o usá las flechas del teclado','Ziehen oder mit Pfeiltasten erkunden'));
  const captions=items.map((item,i)=>item.dataset.caption||item.dataset.name||item.querySelector('figcaption')?.textContent||L('View','Vista','Ansicht')+' '+String(i+1).padStart(2,'0'));
  items.forEach((item,i)=>{item.hidden=false;item.className='visor-gallery-card';item.removeAttribute('tabindex');item.querySelector('figcaption')?.remove();const img=item.querySelector('img');if(img){img.draggable=false;img.sizes='(max-width: 700px) 88vw, 80vw';}track.append(item);});
  const controls=document.createElement('div');controls.className='visor-gallery-controls';
  const caption=document.createElement('div');caption.className='visor-gallery-caption';
  const count=document.createElement('span');count.className='visor-gallery-count';
  const name=document.createElement('span');name.className='visor-gallery-name';
  const hint=document.createElement('span');hint.className='visor-gallery-hint';hint.textContent=L('Drag to explore','Arrastrá para explorar','Zum Erkunden ziehen');
  caption.append(count,name,hint);
  const progress=document.createElement('div');progress.className='visor-gallery-progress';progress.setAttribute('role','group');progress.setAttribute('aria-label',L('Choose a view','Elegir vista','Ansicht wählen'));
  const dots=items.map((item,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',L('View','Vista','Ansicht')+' '+(i+1)+': '+captions[i]);b.addEventListener('click',()=>go(i),events);progress.append(b);return b;});
  const arrows=document.createElement('div');arrows.className='visor-gallery-arrows';
  function arrow(label,path){const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',label);b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg>';arrows.append(b);return b;}
  const prev=arrow(L('Previous view','Vista anterior','Vorherige Ansicht'),'M15 5l-7 7 7 7'),next=arrow(L('Next view','Vista siguiente','Nächste Ansicht'),'M9 5l7 7-7 7');
  const status=document.createElement('span');status.className='visor-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  controls.append(caption,progress,arrows);wrapper.append(track,controls,status);
  let selected=0,requested=0,drag=null,moved=false,frame=0,timer=0;
  const inset=()=>parseFloat(getComputedStyle(track).paddingLeft)||0;
  function draw(){frame=0;const bounds=track.getBoundingClientRect(),edge=bounds.left+inset();let distance=Infinity;
   items.forEach((item,i)=>{const d=Math.abs(item.getBoundingClientRect().left-edge);if(d<distance){distance=d;selected=i;}});
   items.forEach((item,i)=>{item.classList.toggle('is-current',i===selected);if(item.tagName==='BUTTON')item.setAttribute('aria-pressed',String(i===selected));});
   dots.forEach((b,i)=>b.setAttribute('aria-current',i===selected?'true':'false'));
   count.textContent=String(selected+1).padStart(2,'0')+' / '+String(items.length).padStart(2,'0');name.textContent=captions[selected]+(items[selected].dataset.finish?' · '+items[selected].dataset.finish:'');prev.disabled=selected===0;next.disabled=selected===items.length-1;
   if(colours)host.querySelectorAll('[data-colour-choice]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));
  }
  function go(i,instant=false){requested=Math.max(0,Math.min(items.length-1,i));const r=items[requested].getBoundingClientRect(),t=track.getBoundingClientRect();track.scrollTo({left:track.scrollLeft+r.left-t.left-inset(),behavior:instant||reduced.matches?'instant':'smooth'});}
  track.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(draw);clearTimeout(timer);timer=setTimeout(()=>{requested=selected;status.textContent=count.textContent+' · '+name.textContent;},160);},{...events,passive:true});
  prev.addEventListener('click',()=>go(requested-1),events);next.addEventListener('click',()=>go(requested+1),events);
  track.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey)return;const i={ArrowLeft:selected-1,ArrowRight:selected+1,Home:0,End:items.length-1}[e.key];if(i!==undefined){e.preventDefault();go(i);}},events);
  track.addEventListener('pointerdown',e=>{moved=false;if(e.pointerType==='mouse'&&e.button===0)drag={id:e.pointerId,x:e.clientX,left:track.scrollLeft};},events);
  track.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x;if(!moved&&Math.abs(dx)<5)return;if(!moved){moved=true;track.setPointerCapture(e.pointerId);track.classList.add('is-dragging');}track.scrollLeft=drag.left-dx;},events);
  function release(e){if(!drag||drag.id!==e.pointerId)return;drag=null;if(moved){if(track.hasPointerCapture(e.pointerId))track.releasePointerCapture(e.pointerId);track.classList.remove('is-dragging');draw();go(selected);}}
  track.addEventListener('pointerup',release,events);track.addEventListener('pointercancel',release,events);track.addEventListener('dragstart',e=>e.preventDefault(),events);
  track.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopPropagation();return;}const i=items.findIndex(item=>item.contains(e.target));if(i>=0&&i!==selected){e.stopPropagation();go(i);} },{...events,capture:true});
  if(colours)host.querySelectorAll('[data-colour-choice]').forEach((b,i)=>b.addEventListener('click',()=>go(i),events));
  const resize=new ResizeObserver(()=>{go(selected,true);draw();});resize.observe(track);
  signal.addEventListener('abort',()=>{resize.disconnect();cancelAnimationFrame(frame);clearTimeout(timer);},{once:true});draw();
 }
 root.querySelectorAll('.visor-project>section').forEach(section=>{
  const contexts=[...section.querySelectorAll(':scope>.visor-context')];if(contexts.length){gallery(section,contexts,{before:contexts[0]});section.classList.add('visor-gallery-section');}
 });
 const studio=root.querySelector('#visor-studio'),old=studio?.querySelector('.visor-carousel');if(old){gallery(studio,[...old.querySelectorAll('.visor-slide')],{before:old});old.remove();studio.classList.add('visor-gallery-section');}
 const colours=root.querySelector('#visor-colours');if(colours){const old=colours.querySelector('.visor-colour-track');gallery(colours,[...old.querySelectorAll('.visor-colour-card')],{before:old,colours:true});old.remove();colours.querySelector('.visor-colour-navigation')?.remove();colours.querySelector('.visor-colour-status')?.remove();colours.classList.add('visor-gallery-section');}
 const sketches=root.querySelector('#visor-sketches');if(sketches){let group=[];for(const child of [...sketches.children]){if(child.matches('.visor-sketch'))group.push(child);else if(group.length){gallery(sketches,group,{before:group[0],sketch:true});group=[];}}if(group.length)gallery(sketches,group,{before:group[0],sketch:true});}
};
