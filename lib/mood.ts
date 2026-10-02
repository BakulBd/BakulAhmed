import type { Mood } from "./content";

export const MOOD_KEY = "mood";
export const SEASON_KEY = "season";

export type Season = "spring" | "summer" | "autumn" | "winter";
export const seasons: Season[] = ["spring", "summer", "autumn", "winter"];

/**
 * The sky's clock, written once.
 *
 * This is plain ES5 in a string because it has to run in <head>, before
 * first paint, so the page never flashes the wrong sky. The same object is
 * left on `window.__sky`, and the React side calls into it rather than
 * keeping a TypeScript copy — two copies of "what time is dusk" drifted apart
 * once already. `npm run contrast` evaluates this string directly and checks
 * every minute of the day against it.
 *
 * What it decides:
 *   mood(hour)       which of the four lights the hour belongs to
 *   season(month)    meteorological season, northern hemisphere
 *   sunX(date, mood) where along its strip of sky the body sits right now.
 *                    The windows meet end to end (dawn ends where day
 *                    starts), so the sun never jumps when the hour turns over.
 *   moon(date)       the real lunar phase, from the mean synodic month
 *                    counted from the new moon of 6 Jan 2000, 18:14 UTC.
 *                    Good to well under a day, which is invisible on a 64px
 *                    moon.
 *   paint(...)       writes all of it onto <html>.
 *   drawMoon(canvas) renders tonight's moon into the scene's canvas: a lit
 *                    sphere, shaded per pixel from the real sun direction for
 *                    the phase, with the maria where they really are.
 */
export const SKY_CORE = String.raw`(function(){
var MOODS=['dawn','day','dusk','night'],SEASONS=['spring','summer','autumn','winter'];
var WIN={dawn:[5,9],day:[9,17],dusk:[17,20],night:[20,29]};
var TRACK={dawn:[0.02,0.16],day:[0.16,0.84],dusk:[0.84,0.98],night:[0.18,0.86]};
var SYNODIC=29.530588853,EPOCH=Date.UTC(2000,0,6,18,14);
function isMood(m){return MOODS.indexOf(m)>-1}
function isSeason(s){return SEASONS.indexOf(s)>-1}
function mood(h){return h>=5&&h<9?'dawn':h>=9&&h<17?'day':h>=17&&h<20?'dusk':'night'}
function season(mo){return mo>=2&&mo<=4?'spring':mo>=5&&mo<=7?'summer':mo>=8&&mo<=10?'autumn':'winter'}
function sunX(d,m){var h=d.getHours()+d.getMinutes()/60,w=WIN[m],r=TRACK[m];if(!w)return null;if(m==='night'&&h<w[0])h+=24;var t=(h-w[0])/(w[1]-w[0]);t=t<0?0:t>1?1:t;return Math.round((r[0]+(r[1]-r[0])*t)*1000)/1000}
function moon(d){var age=((d.getTime()-EPOCH)/864e5)%SYNODIC;if(age<0)age+=SYNODIC;var lit=(1-Math.cos(2*Math.PI*age/SYNODIC))/2,wax=age<SYNODIC/2;
var name=lit<0.03?'new moon':lit>0.97?'full moon':Math.abs(lit-0.5)<0.06?(wax?'first quarter':'last quarter'):(wax?'waxing ':'waning ')+(lit<0.5?'crescent':'gibbous');
return {age:age,lit:lit,waxing:wax,name:name}}
function hash(i,j){var t=Math.sin(i*127.1+j*311.7)*43758.5453;return t-Math.floor(t)}
function vnoise(x,y){var i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);
var a=hash(i,j),b=hash(i+1,j),c=hash(i,j+1),e=hash(i+1,j+1);return a+(b-a)*fx+(c-a)*fy+(a-b-c+e)*fx*fy}
function fbm(x,y){return vnoise(x,y)*0.5+vnoise(x*2.1+5.2,y*2.1+1.3)*0.3+vnoise(x*4.3+9.7,y*4.3+7.1)*0.2}
var MARIA=[[-0.58,0.16,0.27,0.48,0.3],[-0.42,-0.1,0.2,0.24,0.26],[-0.28,0.45,0.25,0.2,0.34],[0.2,0.42,0.15,0.14,0.34],
[0.36,0.15,0.2,0.17,0.32],[0.24,0.05,0.15,0.12,0.26],[0.7,0.3,0.11,0.1,0.36],[0.6,-0.12,0.12,0.18,0.28],
[0.36,-0.3,0.09,0.09,0.27],[-0.15,-0.36,0.17,0.13,0.26],[-0.46,-0.38,0.09,0.09,0.28],[0.0,0.2,0.11,0.07,0.22],
[-0.32,0.05,0.13,0.1,0.22],[-0.05,0.72,0.38,0.06,0.16]];
var CRATERS=[[-0.12,-0.7,0.045,0.3],[-0.33,0.2,0.035,0.22],[-0.68,0.39,0.028,0.26],[-0.55,0.12,0.024,0.16]];
function sunAngle(d,mo){mo=mo||moon(d);var th=2*Math.PI*mo.age/SYNODIC;
if(mo.lit<0.1){var t0=Math.acos(0.8);th=mo.waxing?t0:2*Math.PI-t0}return th}
function drawMoon(cv,d){var x=cv&&cv.getContext&&cv.getContext('2d');if(!x)return;
var W=cv.width,R=W/2-1,img=x.createImageData(W,W),p=img.data,mo=moon(d),th=sunAngle(d,mo),Lx=Math.sin(th),Lz=-Math.cos(th),ml=mo.lit,es=0.2+0.8*Math.pow(1-ml,1.5),ka=Math.min(0.95,0.42+0.6*Math.sqrt(ml));
for(var py=0;py<W;py++)for(var px=0;px<W;px++){
var u=(px+0.5-W/2)/R,v=-(py+0.5-W/2)/R,r2=u*u+v*v,k=(py*W+px)*4;if(r2>1.03){p[k+3]=0;continue}
var r=Math.sqrt(r2),z=Math.sqrt(Math.max(0,1-r2)),
wu=u+(fbm(u*3+1,v*3+7)-0.5)*0.22,wv=v+(fbm(u*3+4,v*3+2)-0.5)*0.22,n=fbm(u*9+11,v*9+3),
keep=1,i,M,dx,dy,dd,t;
for(i=0;i<MARIA.length;i++){M=MARIA[i];dx=(wu-M[0])/M[2];dy=(wv-M[1])/M[3];dd=Math.sqrt(dx*dx+dy*dy)+(n-0.5)*0.18;
if(dd<1.4){t=Math.min(1,(1.4-dd)*0.85);t=t*t*(3-2*t);keep*=1-M[4]*t}}
var mare=1-keep,alb=keep*(0.9+0.1*fbm(u*7+5,v*7+9)+0.12*(fbm(u*22+2,v*22+8)-0.5));
var mu0=u*Lx+z*Lz+(n-0.5)*0.06,lit=0;
if(mu0>0){var ls=mu0/(mu0+Math.max(z,0.02));lit=Math.min(1,2*ls)*0.9+mu0*0.1}
for(i=0;i<CRATERS.length;i++){M=CRATERS[i];dx=u-M[0];dy=v-M[1];dd=(dx*dx+dy*dy)/(M[2]*M[2]);if(dd<9)alb+=M[3]*Math.exp(-dd)*lit}
alb=Math.min(1.12,alb);
var e=1-lit,a=Math.max(0,Math.min(1,(1-r)*R+0.5))*(1-ka*e*e);
p[k]=Math.min(255,(248-mare*60)*alb*lit+20*es*alb*e);
p[k+1]=Math.min(255,(244-mare*54)*alb*lit+25*es*alb*e);
p[k+2]=Math.min(255,(234-mare*30)*alb*lit+38*es*alb*e);
p[k+3]=Math.round(a*255)}
x.putImageData(img,0,0)}
function paint(root,m,se,auto,d){var s=root.style;
root.setAttribute('data-mood',m);root.setAttribute('data-theme','dark');s.colorScheme='dark';
root.setAttribute('data-season',se);root.setAttribute('data-sky',auto?'auto':'manual');
if(auto)s.setProperty('--sun-x',String(sunX(d,m)));else s.removeProperty('--sun-x');
var mo=moon(d),k=mo.lit<0.1?0.1:mo.lit;
root.setAttribute('data-moon',(mo.waxing?'wax-':'wane-')+(k<0.5?'crescent':'gibbous'));
s.setProperty('--phase-a',String(Math.round(Math.abs(1-2*k)*500)/1000));
s.setProperty('--moon-lum',String(Math.round((0.35+0.65*k)*100)/100));
var ca=Math.abs(1-2*k),cx=0.4244*(k<0.5?1+ca:1-ca)/2;
s.setProperty('--moon-glow-x',String(Math.round((mo.waxing?cx:-cx)*1000)/1000));
return mo}
return {moods:MOODS,seasons:SEASONS,windows:WIN,track:TRACK,isMood:isMood,isSeason:isSeason,mood:mood,season:season,sunX:sunX,moon:moon,sunAngle:sunAngle,drawMoon:drawMoon,paint:paint};
})()`;

/**
 * Runs before first paint. A stored mood or season is the visitor's choice;
 * without one the sky follows their clock and calendar. Storage is read in
 * its own try, so a browser that blocks it still gets a sky.
 */
export const moodScript = `(function(){var d=document.documentElement;d.setAttribute('data-js','');try{
var S=${SKY_CORE};window.__sky=S;var now=new Date(),m=null,se=null;
try{m=localStorage.getItem('${MOOD_KEY}');se=localStorage.getItem('${SEASON_KEY}')}catch(e){}
var auto=!S.isMood(m);if(auto)m=S.mood(now.getHours());if(!S.isSeason(se))se=S.season(now.getMonth());
S.paint(d,m,se,auto,now);
document.addEventListener('DOMContentLoaded',function(){try{S.drawMoon(document.querySelector('.scene__moon'),now)}catch(e){}});
}catch(e){}})();`;

export type MoonPhase = { age: number; lit: number; waxing: boolean; name: string };

export type SkyCore = {
  moods: Mood["id"][];
  seasons: Season[];
  isMood: (m: unknown) => boolean;
  isSeason: (s: unknown) => boolean;
  mood: (hour: number) => Mood["id"];
  season: (month: number) => Season;
  sunX: (date: Date, mood: Mood["id"]) => number;
  moon: (date: Date) => MoonPhase;
  paint: (root: HTMLElement, mood: Mood["id"], season: Season, auto: boolean, date: Date) => MoonPhase;
  drawMoon: (canvas: HTMLCanvasElement | null, date: Date) => void;
};

declare global {
  interface Window {
    __sky?: SkyCore;
  }
}

/** The head script's sky, or null if it never ran. */
export const sky = (): SkyCore | null => (typeof window === "undefined" ? null : window.__sky ?? null);
