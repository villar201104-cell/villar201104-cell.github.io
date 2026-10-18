/* Public entry only. No research, model URLs, password or private content here. */
(()=>{
 'use strict';
 const CONFIG=Object.freeze({privateOrigin:'https://nahuelvillar.com'});
 const copy={
  en:{category:'Personal project',private:'Private case study',body:'Research, design development and an interactive proposal. Access is reserved for invited viewers.',enter:'Enter project',request:'Request access'},
  es:{category:'Proyecto personal',private:'Caso de estudio privado',body:'Investigación, desarrollo de diseño y una propuesta interactiva. El acceso está reservado a las personas invitadas.',enter:'Entrar al proyecto',request:'Solicitar acceso'},
  de:{category:'Persönliches Projekt',private:'Private Fallstudie',body:'Recherche, Entwurfsentwicklung und ein interaktiver Vorschlag. Zugang für eingeladene Personen.',enter:'Projekt öffnen',request:'Zugang anfragen'}
 };
 const current=()=>copy[window.currentLang]||copy.en;
 window.renderCrownEntry=()=>{
  // Only Crown navigates to the protected hostname; configure after remote checks.
  if(CONFIG.privateOrigin){
   const destination=new URL('/project/crown/',CONFIG.privateOrigin);
   if(destination.protocol!=='https:')throw new Error('Private project requires HTTPS');
   destination.searchParams.set('lang',['en','es','de'].includes(window.currentLang)?window.currentLang:'en');
   window.location.assign(destination.href);
   return;
  }
  window._visorCleanup?.();window._currentProjectId='crown';
  const root=document.getElementById('projContent'),c=current();root.dataset.project='crown';root.className='';
  root.innerHTML='<article class="crown-private-entry"><p class="cpe-kicker"></p><h1>EVTOL Cargo Drone</h1><p class="cpe-state"></p><p class="cpe-description"></p><div class="cpe-actions"></div></article>';
  root.querySelector('.cpe-kicker').textContent='Crown Personal Project 2026';root.querySelector('.cpe-state').textContent=c.private;root.querySelector('.cpe-description').textContent=c.body;
  const actions=root.querySelector('.cpe-actions');
  if(CONFIG.privateOrigin){
   const url=new URL('/project/crown/',CONFIG.privateOrigin);if(url.protocol!=='https:')throw new Error('Private project requires HTTPS');
   url.searchParams.set('lang',['en','es','de'].includes(window.currentLang)?window.currentLang:'en');
   const enter=document.createElement('a');enter.className='cpe-enter';enter.textContent=c.enter+' ↗';enter.href=url.href;enter.referrerPolicy='no-referrer';actions.append(enter);
  }
  const request=document.createElement('a');request.href='mailto:nahue201104@hotmail.com?subject='+encodeURIComponent('eVTOL Cargo Drone Crown · Access');request.textContent=c.request;actions.append(request);
 };
 function labels(){document.querySelectorAll('[data-crown-private]').forEach(el=>el.textContent=current().private);document.querySelectorAll('.projects-grid .cml-num').forEach((el,i)=>el.textContent=String(i+1).padStart(2,'0'));}
 document.addEventListener('DOMContentLoaded',labels);
 window.addEventListener('load',()=>{const previous=window.setLang;if(typeof previous==='function')window.setLang=function(){const result=previous.apply(this,arguments);labels();return result;};const requested=new URLSearchParams(location.search).get('lang');if(Object.hasOwn(copy,requested)&&typeof window.setLang==='function')window.setLang(requested);labels();});
})();

