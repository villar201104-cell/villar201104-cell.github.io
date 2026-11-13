(()=>{
 'use strict';
 const languages=['en','es','de'];
 window.crownProjectURL=()=>{
  const url=new URL('/project/crown/','https://nahuelvillar.com');
  url.searchParams.set('lang',languages.includes(window.currentLang)?window.currentLang:'en');
  return url.href;
 };
 window.renderCrownEntry=()=>location.assign(window.crownProjectURL());
 const captions={en:'Explore the process',es:'Explorá el proceso',de:'Designprozess entdecken'};
 function labels(){
  for(const icon of document.querySelectorAll('.crown-card-surface>svg')){
   const mark=document.createElement('img');
   mark.src='/experiences/intervalo/nv-loader.svg';mark.className='crown-nv-mark';mark.alt='';mark.width=85;mark.height=54;icon.replaceWith(mark);
  }
  for(const surface of document.querySelectorAll('.crown-card-surface')){
   let label=surface.querySelector('.crown-process-label');
   if(!label){label=document.createElement('span');label.className='crown-process-label';surface.append(label);}
   label.textContent=captions[window.currentLang]||captions.en;
  }
  document.querySelectorAll('.projects-grid .cml-num').forEach((el,i)=>el.textContent=String(i+1).padStart(2,'0'));
 }
 document.addEventListener('DOMContentLoaded',labels);
 window.addEventListener('load',()=>{
  const previous=window.setLang;
  if(typeof previous==='function')window.setLang=function(){const result=previous.apply(this,arguments);labels();return result;};
  const requested=new URLSearchParams(location.search).get('lang');
  if(languages.includes(requested)&&typeof window.setLang==='function')window.setLang(requested);
  labels();
 });
})();
