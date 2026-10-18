export const COPY={
 en:{captions:'Subtitles',eyebrow:'INTERVALO / SERVICE IN MOTION',title:'One stop. A little more time.',lede:'Fuel, refreshments and payment, without leaving the car.',back:'Explore the project ↗',scene:'Interactive service station',canvas:'Drag to orbit, scroll to zoom. Space to pause.',loading:'Preparing the station',loadingDetail:'Loading Intervalo and its surroundings…',views:'Camera views',general:'Overview',service:'Service island',product:'Intervalo',roof:'Look under the canopy',showRoof:'Show canopy',hint:'Drag to orbit · Scroll to zoom',pause:'Pause',play:'Play',restart:'Start again',speed:'Speed',fullscreen:'Expand ↗',exitFullscreen:'Minimise ↙',timeline:'Explore the sequence',materials:'Textured context',focus:'Massing study',appearance:'Scene appearance',language:'Language',island:'Island',loop:'Continuous sequence',footer:'The attendant takes care of each stop. The driver stays in the car.',note:'Spatial study · Illustrative service sequence',error:'The scene could not load',errorDetail:'Please try again to explore Intervalo.',retry:'Try again',services:'Services',clean:'Windscreen cleaning',coffee:'Coffee',drink:'Cold drink',snack:'Snack',arrive:'Approaching',fuel:'Refuelling',order:'Refreshments',pay:'Payment',care:'Extra care',depart:'Continuing the journey',idle:'Station overview'},
 es:{captions:'Subtítulos',eyebrow:'INTERVALO / EL SERVICIO EN MOVIMIENTO',title:'Una parada. Un poco más de tiempo.',lede:'Combustible, algo para tomar y el pago, sin bajar del auto.',back:'Ver el proyecto ↗',scene:'Estación de servicio interactiva',canvas:'Arrastrá para girar y usá la rueda para acercarte. Espacio para pausar.',loading:'Preparando la estación',loadingDetail:'Cargando Intervalo y su entorno…',views:'Vistas de cámara',general:'Vista general',service:'Isla de servicio',product:'Intervalo',roof:'Ver bajo la cubierta',showRoof:'Mostrar la cubierta',hint:'Arrastrá para girar · Deslizá para acercarte',pause:'Pausar',play:'Reproducir',restart:'Volver al inicio',speed:'Ritmo',fullscreen:'Ampliar ↗',exitFullscreen:'Reducir ↙',timeline:'Recorré la secuencia',materials:'Entorno texturizado',focus:'Entorno volumétrico',appearance:'Aspecto de la escena',language:'Idioma',island:'Isla',loop:'Secuencia continua',footer:'El playero se ocupa de cada parada. El conductor permanece en el auto.',note:'Estudio espacial · Secuencia de uso ilustrativa',error:'No se pudo cargar la escena',errorDetail:'Volvé a intentarlo para recorrer Intervalo.',retry:'Reintentar',services:'Servicios',clean:'Limpiar parabrisas',coffee:'Café',drink:'Refresco',snack:'Snack',arrive:'Acercamiento',fuel:'Carga de combustible',order:'Pedido',pay:'Pago',care:'Cuidados adicionales',depart:'Continúa el viaje',idle:'Vista de la estación'},
 de:{captions:'Untertitel',eyebrow:'INTERVALO / SERVICE IN BEWEGUNG',title:'Ein Halt. Ein bisschen mehr Zeit.',lede:'Tanken, eine Erfrischung und bezahlen – ohne auszusteigen.',back:'Zum Projekt ↗',scene:'Interaktive Tankstelle',canvas:'Ziehen zum Drehen, scrollen zum Zoomen. Leertaste zum Pausieren.',loading:'Die Tankstelle wird vorbereitet',loadingDetail:'Intervalo und die Umgebung werden geladen…',views:'Kameraansichten',general:'Übersicht',service:'Serviceinsel',product:'Intervalo',roof:'Unter das Dach sehen',showRoof:'Dach anzeigen',hint:'Ziehen zum Drehen · Scrollen zum Zoomen',pause:'Pause',play:'Abspielen',restart:'Von vorne',speed:'Tempo',fullscreen:'Vergrößern ↗',exitFullscreen:'Verkleinern ↙',timeline:'Ablauf erkunden',materials:'Texturierte Umgebung',focus:'Volumenstudie',appearance:'Darstellung',language:'Sprache',island:'Tankinsel',loop:'Fortlaufender Ablauf',footer:'Das Personal kümmert sich um den Stopp. Der Fahrer bleibt im Auto.',note:'Räumliche Studie · Beispielhafter Serviceablauf',error:'Die Szene konnte nicht geladen werden',errorDetail:'Bitte versuche es noch einmal.',retry:'Erneut versuchen',services:'Serviceabläufe',clean:'Scheibenreinigung',coffee:'Kaffee',drink:'Kaltgetränk',snack:'Snack',arrive:'Anfahrt',fuel:'Tanken',order:'Erfrischungen',pay:'Bezahlen',care:'Zusätzlicher Service',depart:'Weiterfahrt',idle:'Überblick'}
};
let language='en';
export const t=key=>COPY[language][key]||COPY.en[key]||key;
export const getLanguage=()=>language;
export function setLanguage(value){
 if(!COPY[value])return;language=value;document.documentElement.lang=value;
 document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
 document.querySelectorAll('[data-i18n-label]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.i18nLabel)));
 document.querySelectorAll('[data-island]').forEach(el=>el.textContent=t('island')+' '+String(+el.dataset.island+1).padStart(2,'0'));
 document.querySelector('#language').value=value;document.title='Intervalo · '+t('title');document.dispatchEvent(new Event('intervalo-language'));
}
export function initLanguage(){
 const params=new URLSearchParams(location.search);let inherited;
 try{if(parent!==window)inherited=parent.document.documentElement.lang||parent.currentLang;}catch{}
 setLanguage(params.get('lang')||inherited||'en');
 document.querySelector('#language').onchange=e=>setLanguage(e.target.value);
 // Parent integration posts from the same origin only.
 addEventListener('message',event=>{if(event.origin===location.origin&&event.source===parent&&event.data?.type==='portfolio-language')setLanguage(event.data.lang);});
 if(parent!==window||params.get('embed')==='1')document.documentElement.classList.add('embedded');
}
export function phaseKey(id){
 if(['arrive','greet'].includes(id))return 'arrive';
 if(['toPump','takeNozzle','toTank','insert','fuel','remove','returnNozzle','dock'].includes(id))return 'fuel';
 if(['toTotem','openFridge','prepare','closeFridge','toWindow','deliver','stowProduct'].includes(id))return 'order';
 if(['takeCard','toTerminal','pay','backWithCard','returnCard'].includes(id))return 'pay';
 if(['standClear','depart'].includes(id))return 'depart';
 return id==='wait'?'idle':'care';
}

