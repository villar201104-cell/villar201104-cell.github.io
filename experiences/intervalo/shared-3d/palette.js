/** Portfolio-wide base. Brand palettes belong to each project. */
export const VERSION='0.1.0';
export const PALETTE=Object.freeze({ivory:0xf1efe4,charcoal:0x323232,steel:0x778a90,concrete:0xb7b9b2,asphalt:0x51595b,bark:0x786c58,leaf:0x6d9954,leafShade:0x527448,skin:0xb89173,cloth:0x454447,reflective:0xe4e8d9});
export const DAYLIGHT=Object.freeze({sky:0xc7e1ef,hemisphereSky:0xf1f7ff,hemisphereGround:0x6b745f,hemisphereIntensity:1.25,sun:0xfff6e7,sunIntensity:2.4,exposure:1.05});
export function applyDaylight(T,renderer,scene,{fogNear=75,fogFar=190}={}){renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=DAYLIGHT.exposure;scene.background=new T.Color(DAYLIGHT.sky);scene.fog=new T.Fog(DAYLIGHT.sky,fogNear,fogFar);const hemisphere=new T.HemisphereLight(DAYLIGHT.hemisphereSky,DAYLIGHT.hemisphereGround,DAYLIGHT.hemisphereIntensity),sun=new T.DirectionalLight(DAYLIGHT.sun,DAYLIGHT.sunIntensity);scene.add(hemisphere,sun);return {hemisphere,sun};}
