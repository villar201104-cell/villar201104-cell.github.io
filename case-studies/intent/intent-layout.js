/* Intent: visible evidence, concise copy and a consistent presentation grid. */
window.refineIntentLayout=function(root,L){
 const all=(s,scope=root)=>[...scope.querySelectorAll(s)], one=(s,scope=root)=>scope.querySelector(s);
 const text=(el,value)=>{if(el){el.removeAttribute('data-copy');el.textContent=value;}};
 const set=(sel,rows)=>all(sel).forEach((el,i)=>rows[i]&&text(el,L(...rows[i])));
 const mark=(sel,cls)=>one(sel)?.closest('.cmp-section')?.classList.add(cls);
 mark('.cmp-typo-grid','intent-typologies');mark('.cmp-ante-groups','intent-references');mark('.cmp-persona-wrap','intent-profile');mark('.cmp-context-grid','intent-contexts');mark('.network-layout','intent-stakeholders');mark('.cmp-journey-phases','intent-journey');mark('.cmp-ux-layout','intent-evaluation');mark('.cmp-cmf-grid','intent-cmf');mark('.cmp-how-grid','intent-proposal');mark('.cmp-grado-cards','intent-levels');
 set('.cmp-typo-desc',[
 ['Thumb lever and mechanical striker; no selectable urgency.','Palanca de pulgar y percutor mecánico; sin urgencia seleccionable.','Daumenhebel und mechanischer Schläger; keine Dringlichkeitswahl.'],
 ['Compact side lever with a single output level.','Palanca lateral compacta con un único nivel de salida.','Kompakter Seitenhebel mit einer Signalstufe.'],
 ['Two alternating strike points create a two-tone signal.','Dos puntos de impacto alternados crean una señal bitonal.','Zwei abwechselnde Schlagpunkte erzeugen ein Zweitonsignal.'],
 ['A ring around the handlebar integrates the bell into the cockpit.','Un aro alrededor del manillar integra el timbre al conjunto.','Ein Ring um den Lenker integriert die Klingel ins Cockpit.'],
 ['Button-operated sound; requires a battery or bicycle power.','Sonido por pulsador; requiere batería o alimentación de la bicicleta.','Tastergesteuerter Klang; benötigt Batterie oder Fahrradstrom.'],
 ['Air actuation gives a distinct sound with greater hand effort.','El accionamiento por aire aporta otro sonido y exige más esfuerzo.','Luftbetätigung erzeugt einen anderen Klang bei höherem Kraftaufwand.']
 ]);
 const profiles=[
 ['6 km commute: protected lane and open street.|4–5 days/week · 25–30 min per trip.','Trayecto de 6 km: ciclovía y calle.|4–5 días/semana · 25–30 min por viaje.','6 km Arbeitsweg: Radweg und Straße.|4–5 Tage/Woche · 25–30 Min. pro Fahrt.'],
 ['4–8 bell uses per trip.|Crossings, overtaking and blind corners.','4–8 usos del timbre por viaje.|Cruces, adelantamientos y esquinas ciegas.','4–8 Klingelzeichen pro Fahrt.|Kreuzungen, Überholen und unübersichtliche Ecken.'],
 ['Moderate confidence; constant attention.|Negotiates space with cars and pedestrians.','Confianza media; atención constante.|Negocia el espacio con autos y peatones.','Mittleres Vertrauen; ständige Aufmerksamkeit.|Teilt den Raum mit Autos und Fußgängern.'],
 ['Distracted pedestrians and earphones.|Double-parked cars; wrong-way cyclists.','Peatones distraídos o con auriculares.|Autos en doble fila; ciclistas a contramano.','Abgelenkte Fußgänger mit Kopfhörern.|Falschparker und entgegenkommende Radfahrer.'],
 ['No confirmation or urgency control.|Thumb leaves the grip; risk of a hostile response.','Sin confirmación ni control de urgencia.|El pulgar deja el agarre; posibles reacciones negativas.','Keine Bestätigung oder Dringlichkeitswahl.|Daumen verlässt den Griff; mögliche negative Reaktionen.'],
 ['Safety, courtesy and a continuous ride.|Communicate without shouting.','Seguridad, cortesía y continuidad.|Comunicar sin tener que gritar.','Sicherheit, Höflichkeit und flüssige Fahrt.|Kommunizieren, ohne zu rufen.']
 ];
 all('.cmp-pb').forEach((b,i)=>{const h=b.querySelector('.cmp-pb-h');if(!h||!profiles[i])return;const ul=document.createElement('ul');L(...profiles[i]).split('|').forEach(t=>{const li=document.createElement('li');li.textContent=t;ul.append(li);});b.replaceChildren(h,ul);});
 const groupCopy=[
 ['A familiar thumb gesture, spring return and tactile feedback.','Gesto familiar del pulgar, retorno elástico y respuesta táctil.','Vertraute Daumenbewegung, Federrückstellung und taktiles Feedback.'],
 ['Handlebar mounting, secure adjustment and visual integration.','Montaje al manillar, ajuste firme e integración visual.','Lenkermontage, sichere Einstellung und visuelle Integration.'],
 ['A recognizable sound that communicates presence or urgency.','Un sonido reconocible que comunica presencia o urgencia.','Ein erkennbares Signal für Anwesenheit oder Dringlichkeit.'],
 ['Impact, resonant material and body geometry shape the sound.','Impacto, material resonante y geometría definen el sonido.','Schlag, Resonanzmaterial und Körpergeometrie prägen den Klang.']
 ];
 all('.cmp-ante-group').forEach((g,i)=>{g.querySelectorAll('.cmp-ante-txt').forEach(e=>e.remove());const p=document.createElement('p');p.className='intent-reference-note';p.textContent=L(...groupCopy[i]);g.append(p);});
 text(one('.cmp-ante-band-txt'),L('Combine a familiar control, a clear signal and a resonant body.','Combinar un control familiar, una señal clara y un cuerpo resonante.','Eine vertraute Bedienung, ein klares Signal und einen resonanten Körper verbinden.'));
 set('.cmp-ctx-desc',[
 ['Less competing noise. Pedestrians and cyclists share the signal.','Menos ruido de fondo. La señal se comparte entre peatones y ciclistas.','Weniger Umgebungsgeräusche. Das Signal erreicht Fußgänger und Radfahrer.'],
 ['Useful at crossings and parked cars, with time to respond.','Útil en cruces y junto a autos estacionados, con tiempo para responder.','Hilfreich an Kreuzungen und parkenden Autos, mit Zeit zum Reagieren.'],
 ['Traffic can mask the bell; reception becomes uncertain.','El tránsito puede enmascarar el timbre; la recepción es incierta.','Verkehr kann die Klingel überdecken; die Wahrnehmung bleibt ungewiss.'],
 ['Wind, rough terrain and speed compete for attention and grip.','Viento, terreno irregular y velocidad exigen atención y agarre.','Wind, unebenes Gelände und Tempo beanspruchen Aufmerksamkeit und Griff.']
 ]);
 set('.cmp-log-body',[
 ['Earphones: no visible response to the bell.','Auriculares: sin respuesta visible al timbre.','Kopfhörer: keine sichtbare Reaktion.'],
 ['Two taps; the oncoming cyclist acknowledges.','Dos toques; el ciclista de frente responde.','Zwei Signale; der entgegenkommende Radfahrer reagiert.'],
 ['Unexpected crossing: voice and swerve replace the bell.','Cruce imprevisto: voz y maniobra en lugar del timbre.','Unerwartete Querung: Ruf und Ausweichen statt Klingeln.'],
 ['Overtaking: the delivery rider turns a shoulder.','Adelantamiento: el repartidor gira el hombro.','Überholen: der Lieferfahrer dreht die Schulter.'],
 ['Dense traffic: three rings, then a shouted warning.','Tránsito denso: tres toques y luego un grito.','Dichter Verkehr: dreimal klingeln, dann rufen.'],
 ['The rider signals without checking reception.','La ciclista avisa sin comprobar la recepción.','Die Fahrerin signalisiert, ohne die Reaktion zu prüfen.'],
 ['Low speed: a gentle ring prompts the parent to react.','Baja velocidad: un toque suave obtiene respuesta.','Langsames Tempo: sanftes Klingeln löst eine Reaktion aus.'],
 ['Bell and voice together clarify the overtaking intention.','Timbre y voz juntos aclaran el adelantamiento.','Klingel und Stimme verdeutlichen das Überholen.'],
 ['About 1.4 s to return the thumb to the brake.','Unos 1,4 s para volver el pulgar al freno.','Etwa 1,4 s bis der Daumen zur Bremse zurückkehrt.'],
 ['7 bell uses; 4 visible responses. Two voice substitutions.','7 usos; 4 respuestas visibles. Dos sustituciones por voz.','7 Klingelzeichen; 4 sichtbare Reaktionen. Zweimal Stimme statt Klingel.']
 ]);
 text(one('.cmp-log-sum'),L('In this 11-minute observation, the rider used voice when the bell’s reception was uncertain. A visible response mattered as much as the signal.','En esta observación de 11 minutos, la ciclista recurrió a la voz cuando dudaba de la recepción. La respuesta visible importaba tanto como la señal.','In dieser 11-minütigen Beobachtung nutzte die Fahrerin ihre Stimme bei unklarer Signalwahrnehmung. Eine sichtbare Reaktion war ebenso wichtig wie das Signal.'));
 const journey=[
 [['Prepare and start.','Preparar y salir.','Vorbereiten und starten.'],['Slight rush.','Algo de apuro.','Leichte Eile.'],['Grip and pedals.','Agarre y pedales.','Griff und Pedale.'],['Bell not checked.','Timbre sin comprobar.','Klingel ungeprüft.'],['Cyclist.','Ciclista.','Radfahrerin.']],
 [['Join urban traffic.','Ingresar al tránsito.','In den Verkehr einfahren.'],['Attention rises.','Aumenta la atención.','Aufmerksamkeit steigt.'],['Noise and nearby vehicles.','Ruido y vehículos cerca.','Lärm und nahe Fahrzeuge.'],['Signal competes with noise.','La señal compite con el ruido.','Signal konkurriert mit Lärm.'],['Drivers and pedestrians.','Conductores y peatones.','Fahrer und Fußgänger.']],
 [['Warn and overtake.','Avisar y adelantar.','Warnen und überholen.'],['Uncertain reception.','Recepción incierta.','Unklare Wahrnehmung.'],['Bell; look for a response.','Timbre; buscar respuesta.','Klingeln; Reaktion prüfen.'],['No clear urgency level.','Sin un nivel claro de urgencia.','Keine klare Dringlichkeitsstufe.'],['Cyclists and pedestrians.','Ciclistas y peatones.','Radfahrer und Fußgänger.']],
 [['Brake or avoid a conflict.','Frenar o evitar un conflicto.','Bremsen oder ausweichen.'],['Stress; quick reaction.','Estrés; reacción rápida.','Stress; schnelle Reaktion.'],['Voice, brake and steering.','Voz, freno y dirección.','Stimme, Bremse und Lenkung.'],['Thumb leaves the grip.','El pulgar deja el agarre.','Daumen verlässt den Griff.'],['Nearby road users.','Actores cercanos.','Nahe Verkehrsteilnehmer.']],
 [['Slow down and arrive.','Reducir velocidad y llegar.','Abbremsen und ankommen.'],['Relief.','Alivio.','Erleichterung.'],['Lower noise; visible response.','Menos ruido; respuesta visible.','Weniger Lärm; sichtbare Reaktion.'],['Courtesy and urgency sound alike.','Cortesía y urgencia suenan igual.','Höflichkeit und Dringlichkeit klingen gleich.'],['Pedestrians at destination.','Peatones en destino.','Fußgänger am Ziel.']]
 ];
 all('.cmp-jp').forEach((p,i)=>p.querySelectorAll('.cmp-jp-row-t').forEach((e,j)=>journey[i]?.[j]&&text(e,L(...journey[i][j]))));
 const findings=one('.cmp-hallazgos'),divider=one('.cmp-findings-divider');
 if(findings&&divider){const stage=document.createElement('section');stage.className='cmp-section intent-findings';divider.before(stage);stage.append(divider,findings);}
 set('.cmp-hallazgo-body',[
 ['Repeating a conventional bell does not deliberately select an urgency level.','Repetir un timbre convencional no permite elegir un nivel de urgencia.','Wiederholtes Klingeln wählt keine gezielte Dringlichkeitsstufe.'],
 ['Traffic can mask the signal before it reaches the listener.','El tránsito puede enmascarar la señal antes de que llegue al receptor.','Verkehr kann das Signal überdecken, bevor es den Empfänger erreicht.'],
 ['The same sound serves both a polite request and an urgent warning.','El mismo sonido sirve para pedir paso y para advertir un peligro.','Derselbe Klang dient als höfliche Bitte und dringende Warnung.'],
 ['Without a visible response, the rider cannot confirm reception.','Sin una respuesta visible, la ciclista no puede confirmar la recepción.','Ohne sichtbare Reaktion bleibt der Empfang unbestätigt.'],
 ['The observed thumb movement took about 1.4 s; at a hypothetical 25 km/h, that is 9.7 m.','El movimiento observado tomó unos 1,4 s: a 25 km/h hipotéticos, equivaldría a 9,7 m.','Die beobachtete Daumenbewegung dauerte etwa 1,4 s: bei angenommenen 25 km/h entspricht das 9,7 m.']
 ]);
 const phase=one('#intent-design'),statement=one('.cmp-statement');
 if(phase&&statement){phase.className='cmp-section intent-question';phase.innerHTML='<div class="cmp-section-hd"><div class="cmp-section-label">'+L('Design phase · Problem statement','Fase de diseño · Pregunta problema','Entwurfsphase · Problemstellung')+'</div><h2 class="cmp-section-title">'+L('How can a bicycle bell distinguish <em>courtesy from urgency?</em>','¿Cómo puede un timbre distinguir <em>cortesía de urgencia?</em>','Wie kann eine Fahrradklingel <em>Höflichkeit von Dringlichkeit unterscheiden?</em>')+'</h2></div><p>'+L('A mechanical response that lets the rider graduate the alert with one familiar gesture.','Una respuesta mecánica para graduar la alerta con un gesto familiar.','Eine mechanische Antwort, die das Signal mit einer vertrauten Bewegung abstufbar macht.')+'</p>';statement.remove();}
 const steps=one('.case-mechanism-steps');if(steps)steps.parentElement.classList.add('intent-operation-steps');
 const exploded=one('.case-parts-image');if(exploded){const partsSection=exploded.closest('.cmp-section');const stage=document.createElement('section');stage.className='cmp-section intent-exploded';stage.innerHTML='<div class="cmp-section-hd"><div class="cmp-section-label">'+L('Design and components','Diseño y componentes','Design und Komponenten')+'</div><h2 class="cmp-section-title">'+L('Exploded view','Vista explotada','Explosionsansicht')+'</h2></div>';partsSection.before(stage);stage.append(exploded);exploded.querySelector('img').classList.add('cmp-render-full');}
 all('.case-parts-image,.case-parts-image img').forEach(e=>{e.classList.remove('case-reveal','fu');delete e.dataset.caseMotion;e.removeAttribute('data-portfolio-motion');});
 const closing=one('.cmp-closing');if(closing)closing.innerHTML=L('One bell.<br><em>Three levels of urgency.</em>','Un timbre.<br><em>Tres niveles de urgencia.</em>','Eine Klingel.<br><em>Drei Dringlichkeitsstufen.</em>');

 // Material exploration and the touchpoint each have their own readable frame.
 const finish=one('.intent-plastisol');if(finish){const section=document.createElement('section');section.className='cmp-section intent-finish';section.innerHTML='<div class="cmp-section-hd"><div class="cmp-section-label">'+L('Colour and finish','Color y acabado','Farbe und Oberfläche')+'</div><h2 class="cmp-section-title">'+L('A clear point of interaction','Un punto de interacción claro','Ein klarer Interaktionspunkt')+'</h2></div>';finish.closest('.cmp-section').after(section);section.append(finish);}
 text(one('.intent-references > p'),L('Four connections to the bicycle bell: actuation, mounting, communication and resonance.','Cuatro vínculos con el timbre: accionamiento, montaje, comunicación y resonancia.','Vier Bezüge zur Fahrradklingel: Betätigung, Montage, Kommunikation und Resonanz.'));
 text(one('.intent-cmf > p'),L('Desk research informed the material direction. Shell acoustics still require testing with the final geometry, thickness and mounting.','La investigación documental orientó los materiales. La acústica requiere ensayos con la geometría, el espesor y el montaje definitivos.','Literaturrecherche bestimmte die Materialrichtung. Die Akustik muss mit endgültiger Geometrie, Wandstärke und Montage geprüft werden.'));
 text(one('.intent-evaluation .demo-note'),L('My design assessment, not user-test scores. The observed ride and scenario analysis informed these priorities.','Evaluación propia de diseño, no resultados de pruebas con usuarios. Se basa en el recorrido observado y el análisis de escenarios.','Eigene Designbewertung, keine Nutzertest-Ergebnisse. Grundlage sind die beobachtete Fahrt und die Szenarioanalyse.'));
 const central=one('.cmp-central-finding');if(central){const copy=central.lastElementChild;text(copy,L('Prioritise graduated signals and actuation close to the grip.','Priorizar señales graduadas y accionamiento junto al agarre.','Abgestufte Signale und eine Betätigung nahe am Griff priorisieren.'));}


 const levels=one('.intent-levels'),levelImage=levels?.querySelector('.cmp-render-full');if(levelImage){const visual=document.createElement('section');visual.className='cmp-section intent-signal-render';visual.innerHTML='<div class="cmp-section-hd"><div class="cmp-section-label">'+L('Design · Signal progression','Diseño · Progresión de señal','Design · Signalabstufung')+'</div><h2 class="cmp-section-title">'+L('Three levels, one gesture','Tres niveles, un gesto','Drei Stufen, eine Bewegung')+'</h2></div>';levels.before(visual);visual.append(levelImage);}
 const graph=one('.journey-frame svg');if(graph){graph.setAttribute('viewBox','0 0 1100 170');graph.querySelectorAll('[y]').forEach(e=>{e.setAttribute('y',Number(e.getAttribute('y'))*.57);if(e.tagName==='text')e.setAttribute('font-size','15');});graph.querySelectorAll('line').forEach(e=>['y1','y2'].forEach(k=>e.setAttribute(k,Number(e.getAttribute(k))*.57)));graph.querySelectorAll('circle').forEach(e=>e.setAttribute('cy',Number(e.getAttribute('cy'))*.57));const line=graph.querySelector('polyline');line.setAttribute('points',line.getAttribute('points').split(' ').map(p=>{const [x,y]=p.split(',');return x+','+(Number(y)*.57);}).join(' '));}
 const heading=one('.cmp-findings-title');if(heading){heading.setAttribute('role','heading');heading.setAttribute('aria-level','2');}


 // Observation symbols describe the event; timestamps remain the reading anchor.
 const eventPaths=[
 '<path d="M4 13v-3a8 8 0 0 1 16 0v3M4 12h3v8H4zM17 12h3v8h-3zM9 9l6 6m0-6-6 6"/>',
 '<path d="M5 15h14l-2-3V9a5 5 0 0 0-10 0v3zM10 19h4M18 3l3 3m-2-5 3 3"/>',
 '<path d="M3 20 12 4l9 16zM12 10v4m0 3h.01"/>',
 '<path d="M3 19h5V9h7m-4-4 4 4-4 4M16 19h5M3 4v8"/>',
 '<path d="M3 10h4l5-5v14l-5-5H3zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
 '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12M3 3l18 18"/><circle cx="12" cy="12" r="2"/>',
 '<path d="M3 12h4l5-4v10l-5-4H3zM16 10l2 2 4-5"/>',
 '<path d="M3 4h18v12H9l-6 4zM7 9h10m-10 3h6"/>',
 '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 '<path d="M5 4h14v17H5zM9 4V2h6v2M8 9l1 1 2-2m2 1h3M8 15l1 1 2-2m2 1h3"/>'
 ];
 all('.cmp-log-entry').forEach((e,i)=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.classList.add('intent-event-icon');svg.innerHTML=eventPaths[i]||eventPaths[9];e.prepend(svg);});
 // Supporting numbers share one evidence band, keeping all five finding rows aligned.
 const findingSection=one('.intent-findings');if(findingSection){const band=document.createElement('div');band.className='intent-evidence-band';all('.cmp-hallazgo-stat').forEach(e=>band.append(e));findingSection.append(band);}
 // Independent viewports over the supplied moodboard; source artwork stays unchanged.
 const moodImage=one('img[src="/images/render-moodboard.webp"]');if(moodImage){
  const board=document.createElement('div');board.className='intent-moodboard';
  const groups=[
   [['Morphology','Morfología','Morphologie'],[[129,0,342,253],[129,267,340,428],[129,713,342,278]]],
   [['Materials','Materiales','Materialien'],[[577,0,392,583],[577,620,392,371]]],
   [['Kinetics','Cinética','Kinetik'],[[1076,0,410,381],[1076,452,410,539]]],
   [['Anatomy','Anatomía','Anatomie'],[[1610,0,310,559],[1610,573,310,418]]]
  ];
  groups.forEach(([label,rects])=>{const col=document.createElement('div');col.className='intent-mood-column';const h=document.createElement('h3');h.textContent=L(...label);col.append(h);rects.forEach((rect,i)=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',rect.join(' '));svg.setAttribute('preserveAspectRatio','xMidYMid slice');svg.setAttribute('role','img');svg.setAttribute('aria-label',L(...label)+' · '+(i+1));svg.style.setProperty('--crop-weight',rect[3]/rect[2]);const im=document.createElementNS('http://www.w3.org/2000/svg','image');im.setAttribute('href',moodImage.getAttribute('src'));im.setAttribute('width','1920');im.setAttribute('height','991');svg.append(im);col.append(svg);});board.append(col);});
  moodImage.replaceWith(board);
 }


 // A compact contextual header leaves the observation sequence the full reading width.
 const field=one('.case-field-study'),meta=one('.cmp-obs-log-meta'),fieldImage=one('.case-field-image'),log=one('.cmp-log-wrap');
 if(field&&meta&&fieldImage&&log){meta.prepend(fieldImage);const wrapper=log.parentElement;wrapper.replaceWith(log);}
 // Dimension names already express the criteria; repeated subtitles dilute the scale.
 all('.cmp-dim-sub').forEach(e=>e.remove());
 set('.cmp-km-item>div>div:last-child>div:last-child',[
 ['Moving the thumb away from the grip adds a step before reacting.','Separar el pulgar del agarre añade un paso antes de reaccionar.','Den Daumen vom Griff zu lösen verzögert die Reaktion.'],
 ['One tone cannot distinguish a polite request from an urgent warning.','Un solo tono no distingue un pedido de paso de una alerta urgente.','Ein Ton unterscheidet keine höfliche Bitte von einer dringenden Warnung.'],
 ['Less traffic noise makes the bell and the listener’s response clearer.','Menos ruido facilita oír el timbre y reconocer la respuesta.','Weniger Verkehrslärm macht Signal und Reaktion deutlicher.'],
 ['No visible response means no confirmation that the signal was heard.','Sin respuesta visible, no hay confirmación de que se oyó la señal.','Ohne sichtbare Reaktion bleibt unklar, ob das Signal gehört wurde.']
 ]);

 // Align the qualitative trajectory with the five phase columns; labels already appear below.
 const trajectory=one('.journey-frame svg');
 if(trajectory){const title=trajectory.querySelector('title')?.textContent||'Journey';trajectory.setAttribute('viewBox','0 0 1000 80');trajectory.setAttribute('preserveAspectRatio','none');trajectory.innerHTML='<title>'+title+'</title><path d="M100 31 L300 18 L500 65 L700 40 L900 12" fill="none" stroke="#d24a1f" stroke-width="2" vector-effect="non-scaling-stroke"/>'+[[100,31],[300,18],[500,65],[700,40],[900,12]].map(([x,y])=>'<line x1="'+x+'" y1="'+y+'" x2="'+x+'" y2="80" stroke="var(--color-border)" vector-effect="non-scaling-stroke"/><circle cx="'+x+'" cy="'+y+'" r="3.5" fill="#d24a1f"/>').join('');}
 // Make SVG type readable at the actual rendered size without enlarging the section heading.
 const network=one('.network-desktop svg');
 if(network){network.setAttribute('viewBox','0 0 720 500');network.querySelector('circle[fill="none"]')?.remove();network.querySelectorAll('*').forEach(el=>{['y','y1','y2','cy','height'].forEach(a=>{if(el.hasAttribute(a))el.setAttribute(a,String(Number(el.getAttribute(a))*.8));});if(el.tagName.toLowerCase()==='text'){const old=Number(el.getAttribute('font-size'));el.setAttribute('font-size',old>=21?'22':old>=16?'18':'16');}});}
 const market=one('.intent-typologies');if(market)all('div[style*="font-size:.75rem"]',market).forEach(e=>e.classList.add('intent-annotation'));
 const material=one('.intent-cmf');if(material)all('span[style*="font-size:"]',material).forEach(e=>e.classList.add(e.style.fontSize==='.65rem'||e.style.fontSize==='0.65rem'?'intent-annotation':'intent-material-summary'));
 all('.intent-levels [style*="font-size"]').forEach(e=>{const size=e.style.fontSize;if((size.endsWith('rem')&&parseFloat(size)<.875)||(size.endsWith('px')&&parseFloat(size)<14))e.classList.add('intent-annotation');});
 // Keep proposal copy at reading size by removing repetition.
 const proposal=one('#intent-mechanism')||one('.intent-operation-steps')?.closest('.cmp-section');
 if(proposal)text(proposal.querySelector('.cmp-section-hd>p'),L('Foam models checked overall size; 3D prints checked fit. Acoustic performance, signal progression and timed reset still require a functional prototype.','Los modelos de espuma permitieron revisar el tamaño y las impresiones 3D, el encastre. El sonido, la progresión y el retorno temporizado requieren un prototipo funcional.','Schaummodelle prüften die Größe, 3D-Drucke die Passung. Akustik, Signalabstufung und zeitgesteuerte Rückstellung erfordern noch einen Funktionsprototyp.'));
 set('.case-mechanism-steps>div>div:last-child',[
 ['Consecutive presses advance a ratchet and cam, increasing the hammer stroke while holding each position.','Las pulsaciones avanzan un trinquete y una leva: aumenta el recorrido del percutor y se mantiene cada posición.','Aufeinanderfolgende Betätigungen bewegen Ratsche und Nocke, vergrößern den Hammerhub und halten jede Position.'],
 ['A longer stroke is intended to create a stronger impact and louder signal.','Un recorrido mayor busca generar un impacto más fuerte y una señal más intensa.','Ein längerer Hub soll einen stärkeren Schlag und ein lauteres Signal erzeugen.'],
 ['The third consecutive press reaches the highest proposed level.','La tercera pulsación consecutiva alcanza el nivel máximo propuesto.','Die dritte aufeinanderfolgende Betätigung erreicht die höchste vorgesehene Stufe.'],
 ['Fits standard 22.2 mm handlebars.','Se adapta a manillares estándar de 22,2 mm.','Für Standardlenker mit 22,2 mm Durchmesser.'],
 ['A light spring returns the mechanism after a pause. The physical reset interval still needs calibration.','Un resorte suave devuelve el mecanismo tras una pausa. El intervalo de retorno todavía requiere calibración.','Eine leichte Feder stellt den Mechanismus nach einer Pause zurück. Das Rückstellintervall muss noch kalibriert werden.']
 ]);
 // Index follows the actual section order; no second, competing hierarchy.
 const nav=one('.project-index');if(nav){nav.classList.add('intent-index');const links=document.createElement('div');links.className='intent-index-links';all(':scope > .cmp-section').forEach((s,i)=>{const h=s.querySelector('.cmp-section-title,.cmp-findings-title');if(!h)return;if(!s.id)s.id='intent-section-'+(i+1);const a=document.createElement('a');a.href='#'+s.id;const n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');a.append(n,document.createTextNode(h.textContent));links.append(a);});const label=document.createElement('p');label.className='project-index-label';label.id='intent-index-label';label.textContent=L('In this project','En este proyecto','In diesem Projekt');nav.replaceChildren(label,links);}
};
