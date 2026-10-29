/* Progressive disclosure keeps the evidence available without a wall of small text. */
window.refineIntentLayout=function(root,L){
  const details=(label)=>{const d=document.createElement('details');d.className='intent-details';const s=document.createElement('summary');s.textContent=label;d.append(s);return d;};
  root.querySelectorAll('.cmp-jp').forEach(phase=>{
    const rows=[...phase.querySelectorAll('.cmp-jp-row')];
    const d=details(L('Context and feedback','Contexto y respuesta','Kontext und Rückmeldung'));
    rows.filter((r,i)=>i>0&&!r.classList.contains('is-pain')).forEach(r=>d.append(r));phase.append(d);
  });
  const profile=root.querySelector('.cmp-persona-pg');
  if(profile){const blocks=[...profile.children];const d=details(L('Routine and traffic context','Rutina y contexto de tránsito','Alltag und Verkehrskontext'));d.classList.add('intent-profile-extra');const content=document.createElement('div');blocks.slice(0,4).forEach(el=>content.append(el));d.append(content);profile.append(d);}
  const journal=root.querySelector('.case-field-layout'),log=root.querySelector('.cmp-log-wrap');
  if(journal&&log){const copy=document.createElement('div');copy.className='intent-field-copy';const conclusion=journal.closest('.cmp-section').querySelector('.cmp-log-sum');if(conclusion)copy.append(conclusion);const d=details(L('Read the observation log · 11 min','Ver el registro de observación · 11 min','Beobachtungsprotokoll lesen · 11 Min.'));d.append(log);copy.append(d);journal.append(copy);}
  root.querySelectorAll('.cmp-km-item div').forEach(e=>{if(e.children.length===0&&e.textContent.trim().length>65)e.classList.add('intent-reading-copy');});
  // The exploded view is deliberately static and full-width, without scroll reveals.
  root.querySelectorAll('.case-parts-image,.case-parts-image img').forEach(e=>{e.classList.remove('case-reveal','fu');delete e.dataset.caseMotion;e.removeAttribute('data-portfolio-motion');});
};
