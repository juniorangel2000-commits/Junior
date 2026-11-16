import Phaser from 'phaser';
import {NEUTRAL_LIGHTING,type LightingState} from './lighting-model';
/** Passe único de luz aplicado à câmera (docs/construcoes/ILUMINACAO.md): sombra das nuvens,
 * cor da hora do dia, luzes quentes que recortam o escuro com brilho suave, e vinheta.
 * As luzes chegam já em pixels da tela; as nuvens usam coordenadas do mundo, então ficam
 * presas ao chão quando a câmera anda. */
export const MAX_LIGHTS=32;
const FRAGMENT=`
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec2 uResolution;
uniform vec2 uScroll;
uniform float uZoom;
uniform float uTime;
uniform vec3 uAmbient;
uniform float uSaturation;
uniform float uContrast;
uniform float uLamps;
uniform float uClouds;
uniform float uVignette;
uniform float uLightCount;
uniform vec4 uLights[${MAX_LIGHTS}];
uniform vec3 uLightColors[${MAX_LIGHTS}];
varying vec2 outTexCoord;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);}
float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(17.0,9.0);a*=0.5;}return v;}

void main(){
 vec4 base=texture2D(uMainSampler,outTexCoord);
 vec2 screen=vec2(outTexCoord.x,1.0-outTexCoord.y)*uResolution;
 vec2 world=uScroll+screen/uZoom;
 vec3 col=base.rgb;
 // Sombra das nuvens: manchas grandes e macias que correm devagar pelo chão.
 if(uClouds>0.001){
  float cloud=smoothstep(0.44,0.74,fbm(world/680.0+vec2(uTime*0.012,uTime*0.005)));
  col*=1.0-uClouds*cloud*0.3;
 }
 // Cor da hora do dia: saturação, contraste e a luz ambiente.
 float luma=dot(col,vec3(0.299,0.587,0.114));
 col=mix(vec3(luma),col,uSaturation);
 col=(col-0.5)*uContrast+0.5;
 // Luzes: somam claridade onde a noite tirou, e um brilho perto da fonte.
 vec3 light=vec3(0.0),glow=vec3(0.0);
 for(int i=0;i<${MAX_LIGHTS};i++){
  if(float(i)>=uLightCount)break;
  vec4 L=uLights[i];
  float d=length(screen-L.xy)/L.z;
  if(d<1.0){float f=1.0-d;light+=uLightColors[i]*(f*f)*L.w;glow+=uLightColors[i]*pow(f,7.0)*L.w;}
 }
 // A luz leva a cor da noite em direção a um dia quente, sem passar dele: vários postes
 // juntos iluminam bem a rua, mas a praça não fica mais clara que de dia.
 float power=dot(light,vec3(0.3333));
 float amount=1.0-exp(-power*uLamps*1.8);
 vec3 tint=light/max(power,0.0001);
 vec3 target=mix(vec3(1.0),tint,0.35)*0.88;
 vec3 lit=mix(uAmbient,max(uAmbient,target),amount);
 col=col*lit+glow*uLamps*0.25;
 // Vinheta suave nas bordas.
 vec2 v=outTexCoord-0.5;
 col*=1.0-uVignette*smoothstep(0.32,0.78,length(v*vec2(1.15,1.0)));
 gl_FragColor=vec4(clamp(col,0.0,1.0),base.a);
}`;
export interface ScreenLight{x:number;y:number;radius:number;intensity:number;color:[number,number,number]}
export class LightingPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline{
 state?:LightingState;
 lights:ScreenLight[]=[];
 scroll={x:0,y:0};zoom=1;seconds=0;
 private readonly packed=new Float32Array(MAX_LIGHTS*4);
 private readonly colors=new Float32Array(MAX_LIGHTS*3);
 constructor(game:Phaser.Game){super({game,name:'AfterRainLighting',fragShader:FRAGMENT});}
 onPreRender():void{
  // Sem configuração ainda (primeiro quadro), a imagem passa como está: nunca fica preta.
  const s=this.state??NEUTRAL_LIGHTING;
  this.set2f('uResolution',this.renderer.width,this.renderer.height);
  this.set2f('uScroll',this.scroll.x,this.scroll.y);this.set1f('uZoom',this.zoom);this.set1f('uTime',this.seconds);
  this.set3f('uAmbient',...s.ambient);this.set1f('uSaturation',s.saturation);this.set1f('uContrast',s.contrast);
  this.set1f('uLamps',s.lamps);this.set1f('uClouds',s.clouds);this.set1f('uVignette',s.vignette);
  const n=Math.min(MAX_LIGHTS,this.lights.length);this.packed.fill(0);this.colors.fill(0);
  for(let i=0;i<n;i++){const l=this.lights[i];this.packed.set([l.x,l.y,Math.max(1,l.radius),l.intensity],i*4);this.colors.set(l.color,i*3);}
  this.set1f('uLightCount',n);this.set4fv('uLights',this.packed);this.set3fv('uLightColors',this.colors);
 }
}
export const LIGHTING_PIPELINE='AfterRainLighting';
/** Registra o passe no jogo uma vez (só no WebGL). */
export function registerLightingPipeline(game:Phaser.Game):boolean{
 const r=game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
 if(!r||game.renderer.type!==Phaser.WEBGL||!r.pipelines)return false;
 r.pipelines.addPostPipeline(LIGHTING_PIPELINE,LightingPipeline);
 return true;
}
