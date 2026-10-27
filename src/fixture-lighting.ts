import Phaser from 'phaser';
import {fixtureStrength} from './fixture-light-model';
import {getVisualSettings} from './visual-settings';

export interface FixtureSource {offsetX?:number;offsetY?:number;radius:number;always?:boolean;strength?:number}
const FRAGMENT=`precision mediump float;
uniform vec2 resolution;uniform float power;varying vec2 fragCoord;
void main(){vec2 p=(fragCoord/resolution-vec2(.5))*2.;
float halo=pow(max(0.,1.-length(p)),2.3);float core=pow(max(0.,1.-length(p)*5.),2.);
float a=power*(halo*.18+core*.27);gl_FragColor=vec4(vec3(1.,.66,.28)*a,a);}`;
type Emitter=Phaser.GameObjects.Image|Phaser.GameObjects.Sprite|Phaser.GameObjects.Zone;

/** Same real source positions in WebGL and Canvas. A bounded radial shader
 * lights the fixture and nearby ground, without a rectangular color overlay. */
export class FixtureLighting {
 private lights=new Map<Emitter,Phaser.GameObjects.Shader|Phaser.GameObjects.Graphics>();
 constructor(private scene:Phaser.Scene){}
 update(time:number):void{
  const settings=getVisualSettings(),live=new Set<Emitter>();
  for(const object of this.scene.children.list){const source=object.getData('fixture-light') as FixtureSource|undefined;
   if(!source||!('x'in object)||!('visible'in object))continue;const emitter=object as Emitter;live.add(emitter);
   const strength=settings.dynamicLighting&&emitter.visible?fixtureStrength(time,this.scene.time.now,!!source.always,settings.intensity)*(source.strength??1):0;
   let light=this.lights.get(emitter);
   if(!light&&strength<=.001)continue;
   if(!light){
    if(this.scene.game.renderer.type===Phaser.WEBGL){const shader=new Phaser.Display.BaseShader('after-rain-fixture-light',FRAGMENT,undefined,{power:{type:'1f',value:0}});light=this.scene.add.shader(shader,0,0,source.radius*2,source.radius*2);}
    else{light=this.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);}
    light.setDepth(5003).setData('fixture-glow',true);this.lights.set(emitter,light);
   }
   const x=emitter.x+(source.offsetX??0),y=emitter.y+(source.offsetY??0);
   light.setVisible(strength>.001).setPosition(x,y);
   if(light instanceof Phaser.GameObjects.Shader)light.setDisplaySize(source.radius*2,source.radius*2).setUniform('power.value',strength);
   else{light.clear();if(strength>0)for(let n=10;n>0;n--)light.fillStyle(0xffc178,strength*.018*(1-n/12)).fillCircle(0,0,source.radius*n/10);}
  }
  for(const[source,light]of this.lights)if(!live.has(source)||!source.active){light.destroy();this.lights.delete(source);}
 }
 contains(object:Phaser.GameObjects.GameObject){return !!object.getData('fixture-glow');}
 destroy(){for(const light of this.lights.values())light.destroy();this.lights.clear();}
}
