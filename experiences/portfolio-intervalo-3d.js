/* Drop-in integration for Nahuel's portfolio. Same-origin iframe, EN / ES / DE. */
(()=>{
 if(window.__intervaloSceneInstalled)return;window.__intervaloSceneInstalled=true;
 const copy={
  en:['SERVICE IN MOTION','A stop, from arrival to departure.','Explore the station, follow the service or drag the timeline to any moment.','Interactive 3D service sequence'],
  es:['EL SERVICIO EN MOVIMIENTO','Una parada, de principio a fin.','Recorré la estación, seguí la atención o arrastrá la barra de tiempo hasta cualquier momento.','Secuencia de atención interactiva en 3D'],
  de:['SERVICE IN BEWEGUNG','Ein Stopp, von der Ankunft bis zur Weiterfahrt.','Erkunde die Tankstelle, verfolge den Service oder springe über die Zeitleiste zu einem beliebigen Moment.','Interaktiver 3D-Serviceablauf']
 };
 const style=document.createElement('style');style.textContent='.intervalo-3d-block{padding:clamp(32px,5vw,72px) var(--ph,6%);border-top:1px solid var(--color-border)}.intervalo-3d-block .scene-kicker{font-size:.65rem;letter-spacing:.16em;color:var(--color-muted);margin-bottom:12px}.intervalo-3d-block h2{font-family:var(--font-display);font-size:clamp(24px,3vw,40px);font-weight:500;letter-spacing:-.04em;margin:0 0 14px}.intervalo-3d-block p{font-size:.9rem;line-height:1.6;color:var(--color-muted);margin:0 0 28px;max-width:620px}.intervalo-3d-block iframe{display:block;width:100%;height:840px;border:0;background:var(--color-bg-alt)}@media(max-width:800px){.intervalo-3d-block iframe{height:800px}.intervalo-3d-block{padding-left:20px;padding-right:20px}}';document.head.append(style);

 let record=null;
 function visible(){return !!record&&record.onScreen&&!document.hidden&&window._currentProjectId==='intervalo'&&record.section.isConnected;}
 function sync(){if(record?.started)record.frame.contentWindow?.postMessage({type:'portfolio-visibility',visible:visible()},location.origin);}
 function mount(){
  if(record&&!record.section.isConnected){record.observer?.disconnect();record=null;}
  if(window._currentProjectId!=='intervalo'){sync();return;}
  if(window._currentProjectId!=='intervalo')return;
  const root=document.getElementById('projContent');if(!root)return;
  const lang=['en','es','de'].includes(window.currentLang)?window.currentLang:'en',c=copy[lang];
  let section=root.querySelector('.intervalo-3d-block');
  if(!section){
   section=document.createElement('section');section.className='intervalo-3d-block';section.id='intervalo-in-motion';
   section.innerHTML='<div class="scene-kicker"></div><h2></h2><p></p><iframe allow="fullscreen" loading="eager" referrerpolicy="same-origin"></iframe>';
   const anchor=root.querySelector('.panels-wrap');if(anchor)anchor.after(section);else root.append(section);
   const iframe=section.querySelector('iframe');record={section,frame:iframe,started:false,onScreen:false};
   const entry=record;
   const activate=()=>{if(!entry.started){entry.started=true;iframe.src='/experiences/intervalo/?embed=1&lang='+(['en','es','de'].includes(window.currentLang)?window.currentLang:'en');}sync();};
   if('IntersectionObserver' in window){entry.observer=new IntersectionObserver(entries=>{entry.onScreen=entries[0].isIntersecting&&entries[0].intersectionRatio>=.2;if(entry.onScreen&&visible())activate();else sync();},{threshold:[0,.2]});entry.observer.observe(iframe);}else{entry.onScreen=true;activate();}
   section.querySelector('iframe').addEventListener('load',()=>mount());
  }
  section.querySelector('.scene-kicker').textContent=c[0];section.querySelector('h2').textContent=c[1];section.querySelector('p').textContent=c[2];
  const list=root.querySelector('.project-index-links');
  if(list){
   let link=list.querySelector('[href="#intervalo-in-motion"]');
   if(!link){const li=document.createElement('li');link=document.createElement('a');link.href='#intervalo-in-motion';link.addEventListener('click',event=>{event.preventDefault();section.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});});li.append(link);list.append(li);}
   link.innerHTML='<span class="project-index-number" aria-hidden="true">'+String([...list.children].indexOf(link.parentElement)+1).padStart(2,'0')+'</span>';
   link.append(document.createTextNode({en:'Service in 3D',es:'El servicio en 3D',de:'Service in 3D'}[lang]));
  }
  const frame=section.querySelector('iframe');frame.title=c[3];frame.contentWindow?.postMessage({type:'portfolio-language',lang},location.origin);sync();
 }
 const originalBuild=window.buildProject;if(originalBuild)window.buildProject=function(...args){const result=originalBuild.apply(this,args);mount();return result;};
 const originalLang=window.setLang;if(originalLang)window.setLang=function(...args){const result=originalLang.apply(this,args);mount();return result;};
 addEventListener('message',e=>{if(record&&e.source===record.frame.contentWindow&&e.origin===location.origin&&e.data?.type==='intervalo-ready')sync();});
 document.addEventListener('visibilitychange',sync);
 const originalGo=window.go;if(originalGo)window.go=function(...args){const result=originalGo.apply(this,args);mount();return result;};
 mount();
})();

