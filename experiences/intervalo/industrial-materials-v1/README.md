# Industrial materials — 1.1.0

Biblioteca local reutilizable para las simulaciones de Nahuel. No necesita npm ni una segunda copia de Three.js. El motor se recibe como argumento. Probada en Crown con Three.js r180; antes de usarla en otros proyectos comprobar versión, escala, nombres y UV. Los mecanismos R34 siguen siendo una referencia independiente con Three.js r160; no sustituir su motor.

## Uso
```js
import {installIndustrialFinishLibrary} from './industrial-materials-v1/install.js';
const finishes = await installIndustrialFinishLibrary(THREE, {
  renderer,
  roots: [drone, forklift, serviceEquipment],
  quality: 'optimized',
  reflection: 'studio'
});
await finishes.setQuality('optimized'); // Un mapa compartido de rugosidad; sin normal map
await finishes.setQuality('balanced'); // Acabados y reflejos, sin mapas finos
await finishes.setQuality('detail');   // Carga los mapas una vez, cuando se requieren
await finishes.setQuality('original'); // Recupera materiales y geometrías de origen
finishes.dispose();                   // Al desmontar la experiencia
```

El modo original es diagnóstico. Elegir `reflection:'existing'` para usar el entorno de la escena. El HDR de estudio se asigna a los materiales seleccionados; no reemplaza el cielo, las luces ni el entorno completo. Ante fallo de carga del HDR se conserva el entorno existente; si faltan mapas se usa el modo equilibrado.

## Familias
Acero .30/.98, aluminio .45/.93, pintura .44/0, goma .88/0, polímero .57/0, cobre .32/.98 y bronce .37/.95 (rugosidad/metalness). Conserva los colores existentes. Son valores visuales de referencia, no mediciones de muestras físicas.

Asignación explícita recomendada: `mesh.userData.finishFamily='steel'` (o alloy, paint, rubber, polymer, copper, bronze). Existe una clasificación por nombres para migrar assets existentes. Revisarla antes de extender a otro proyecto: no todos los componentes llamados frame o housing son del mismo material.

Solo los metales expuestos elegibles reciben mapas. Se preservan texturas ya creadas, UV de gráficos, transparencia, materiales emisivos y piezas humanas. Las UV adicionales usan el canal 2, con escala de referencia de 10 cm en coordenadas locales. No modifica vértices ni normales geométricas. Para objetos escalados de forma no uniforme, comprobar visualmente la escala de textura antes de aplicar; no se corrige automáticamente la escala mundial. No hornear sombras entre piezas móviles.

## Intermedio R37

`optimized` es el valor inicial del adaptador: un mapa de rugosidad de 512 px (25.009 bytes), anisotropía 2, sin mapa normal. `detail` añade el mapa normal (8.447 bytes) bajo demanda. Volver a intermedio restaura el sombreado sin normal map; después de solicitar detalle sus recursos permanecen en caché hasta desmontar. Estimación de memoria del mapa de rugosidad RGBA8 con mipmaps: 1,33 MiB, frente a 2,67 MiB de los dos mapas. No son lecturas de VRAM. El coste del HDR/PMREM y los buffers sigue aparte.

Nariz, cuerpo, cubiertas de patas y cartuchos sellados tienen clasificación explícita de pintura, anterior a las palabras heredadas del padre (por ejemplo, bisagra). No aplicar metal a una carcasa por el nombre del grupo.

## Coste y límites
- Dos mapas compartidos de 512 px: 33.456 bytes en disco, aproximadamente 2,67 MiB en GPU con RGBA8 y mipmaps. No equivale a una lectura de VRAM.
- HDRI 1K: 1.508.872 bytes; PMREM consume memoria adicional.
- Se mantienen materiales estándar en Crown; no se añade transmisión, clearcoat ni anisotropía física a todas las piezas.
- Modo equilibrado no descarga los dos mapas hasta pedir detalle. Después de usarlos permanecen en caché hasta `dispose()`.
- Detalle clona las geometrías elegibles para añadir UV secundarias sin alterar las originales. Esos buffers también consumen memoria; las cifras de texturas no representan el coste total. El modo original iniciado desde el adaptador no carga el HDR; para comparar después el mismo HDR, iniciar en equilibrado y alternar desde allí.
- Render bajo demanda, instancias y animaciones siguen perteneciendo a la aplicación. La biblioteca emite `crown-scene-change` para despertar Crown; otros visores deben llamar a su propio render después de cambiar calidad.
- No corrige facetas, uniones, sombras defectuosas o proporciones de los modelos. No convierte una simulación en un render de KeyShot.

## Procedencia
Los mapas son los aprobados en mecanismos R34. [Metal032, ambientCG](https://ambientcg.com/view?id=Metal032), [CC0](https://docs.ambientcg.com/license/), material procedural: normales OpenGL y rugosidad reducidas a 512 px. Rugosidad recentrada alrededor de 0,9 y compensada en el material para evitar apariencia cromada. [Studio Small 08, Sergej Majboroda / Poly Haven](https://polyhaven.com/a/studio_small_08), [CC0](https://polyhaven.com/license/).

`hdr-loader-factory.js` adapta únicamente la importación/exportación de [HDRLoader oficial r180](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/loaders/HDRLoader.js) para recibir la misma instancia de Three.js. Conserva su implementación y licencia MIT en THIRD-PARTY-LICENSES.txt. La biblioteca del proyecto es privada; las licencias de los recursos externos no cambian.

Documentación técnica: [MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html), [Texture](https://threejs.org/docs/pages/Texture.html), [estadísticas de render](https://threejs.org/docs/pages/WebGLRenderer.html). Consultar RESULTADOS.md de la entrega para mediciones reales, equipo y límites.

## Public Intervalo adapter (R44 integration)

The public copy adds an optional `classifyMaterial(object, material)` callback. Default Crown classification remains unchanged when omitted. Intervalo uses an audited allowlist, skips authored maps/alpha/custom shaders, and keeps existing scene reflections. Initialization creates one balanced owner before requesting optional maps, so a failed map request reuses that owner. `report.loadedTextureBytes` reports the roughness/normal files actually loaded; `textureBytes` remains the full two-map bundle size. Runtime color ownership is preserved by the Intervalo adapter. No Crown routes, models, cameras or private modules are imported.

Intervalo deployment: this library is nested under `experiences/intervalo/industrial-materials-v1/` in the public site and under `site/industrial-materials-v1/` in the standalone source. The adapter imports `./industrial-materials-v1/install.js`. The optional direct HDRLoader/RGBELoader entry points use the adjacent Intervalo Three engine at `../vendor/three/build/three.module.js`; the production installer continues using the injected-engine factory. No module imports a Crown path.
