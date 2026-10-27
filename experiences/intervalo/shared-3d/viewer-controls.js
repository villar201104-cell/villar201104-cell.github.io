/* Shared portfolio controls. Move existing controls so their original handlers remain authoritative. */
(()=>{
 const q=s=>document.querySelector(s),crown=!!q('#experience'),root=q('#experience')||q('.experience');
 if(!root)return;
 const transport=q(crown?'.timeline':'.timeline-row'),toolbar=q('.toolbar'),sequence=q(crown?'.chapters':'.service-selector');
 const names={es:['Escenas','Opciones','Cámara','Apariencia','Ayudas'],en:['Scenes','Options','Camera','Appearance','Overlays'],de:['Szenen','Optionen','Kamera','Darstellung','Einblendungen']};
 const rail=document.createElement('div');rail.className='viewer-controls';transport.after(rail);
 function disclosure(id){const d=document.createElement('details');d.className='control-menu';d.id=id;const sum=document.createElement('summary');d.append(sum);rail.append(d);d.addEventListener('toggle',()=>{if(d.open)rail.querySelectorAll('details').forEach(other=>{if(other!==d)other.open=false;});});return d;}
 const scenes=disclosure('scene-menu'),options=disclosure('options-menu');
 scenes.append(sequence);options.append(toolbar);
 // Speed and fullscreen are primary, always available beside playback.
 for(const id of ['speed','fullscreen'])transport.append(q('#'+id));
 q('#fullscreen').classList.add('expand-control');
 const groups=[...toolbar.children].filter(n=>n.tagName==='DIV');
 groups.forEach((g,i)=>{g.classList.add('option-group');const h=document.createElement('span');h.className='option-group-label';h.dataset.group=i;g.prepend(h);});
 const active=document.createElement('span');active.className='active-scene';rail.prepend(active);
 const phase=q(crown?'#phase':'#activity');if(phase)active.append(phase);
 function translate(){const lang=document.documentElement.lang||new URLSearchParams(location.search).get('lang')||'en',c=names[lang]||names.en;scenes.querySelector('summary').textContent=c[0];options.querySelector('summary').textContent=c[1];groups.forEach((g,i)=>g.querySelector('.option-group-label').textContent=c[i+2]||c[4]);}
 translate();new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 sequence.addEventListener('click',e=>{if(e.target.closest('button'))scenes.open=false;});
 document.addEventListener('pointerdown',e=>{if(!rail.contains(e.target))rail.querySelectorAll('details').forEach(d=>d.open=false);});
 root.addEventListener('keydown',e=>{if(e.key==='Escape')rail.querySelectorAll('details').forEach(d=>d.open=false);});
})();
