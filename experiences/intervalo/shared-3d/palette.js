import {WORLD_STYLE} from './world-style.js';
/** Portfolio-wide base. Brand palettes belong to each project. */
export const VERSION='0.2.0';
const hex=s=>Number.parseInt(s.slice(1),16),w=WORLD_STYLE.worker;
export const PALETTE=Object.freeze({ivory:hex(w.helmet),charcoal:hex(w.seam),steel:hex(w.metal),concrete:0xb7b9b2,asphalt:0x51595b,bark:hex(WORLD_STYLE.trees.trunk),leaf:hex(WORLD_STYLE.trees.foliage[2]),leafShade:hex(WORLD_STYLE.trees.foliage[1]),skin:hex(w.skin),cloth:hex(w.shirt),reflective:hex(w.reflective),shoe:hex(w.boot),sole:hex(w.sole),glove:hex(w.glove),glass:hex(w.glass)});
export const NEUTRAL=Object.freeze({surface:0xe7e8e2,sky:0xe8e9e5,roughness:.9,metalness:0});
export const DAYLIGHT=Object.freeze({sky:0xc7e1ef,hemisphereSky:0xf1f7ff,hemisphereGround:0x6b745f,hemisphereIntensity:1.25,sun:0xfff6e7,sunIntensity:2.4,exposure:1.05});
export function applyDaylight(T,renderer,scene,{fogNear=75,fogFar=190}={}){renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=DAYLIGHT.exposure;scene.background=new T.Color(DAYLIGHT.sky);scene.fog=new T.Fog(DAYLIGHT.sky,fogNear,fogFar);const hemisphere=new T.HemisphereLight(DAYLIGHT.hemisphereSky,DAYLIGHT.hemisphereGround,DAYLIGHT.hemisphereIntensity),sun=new T.DirectionalLight(DAYLIGHT.sun,DAYLIGHT.sunIntensity);scene.add(hemisphere,sun);return {hemisphere,sun};}
