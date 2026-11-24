/* Sofra dish drawings: every recipe is drawn as an SVG from its art spec. */
(function(){
const hexOk=h=>/^#[0-9a-f]{6}$/i.test(h)?h:'#cccccc';
function shade(h,a){const n=parseInt(hexOk(h).slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const t=a<0?0:255,p=Math.abs(a);r=Math.round(r+(t-r)*p);g=Math.round(g+(t-g)*p);b=Math.round(b+(t-b)*p);return'#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}
function rng(str){let s=7;for(const c of str)s=(s*31+c.charCodeAt(0))%2147483646;s+=1;return()=>(s=s*16807%2147483647)/2147483647}
const f1=n=>n.toFixed(1);
const plate='<ellipse cx="120" cy="138" rx="104" ry="13" style="fill:var(--shadow)"/><ellipse cx="120" cy="133" rx="100" ry="14" style="fill:var(--plate)"/><ellipse cx="120" cy="133" rx="74" ry="9" style="fill:var(--shadow);opacity:.35"/>';
function piece(sh,c0,x,y,s,rand){const c=hexOk(c0),rot=f1(rand()*180),X=f1(x),Y=f1(y);
  switch(sh){
  case'dot':return`<circle cx="${X}" cy="${Y}" r="${f1((.8+rand()*1.2)*s)}" fill="${c}"/>`;
  case'cube':{const w=7*s,h=6*s;return`<rect x="${f1(x-w/2)}" y="${f1(y-h/2)}" width="${f1(w)}" height="${f1(h)}" rx="1.2" fill="${shade(c,-.15)}"/><rect x="${f1(x-w/2)}" y="${f1(y-h/2)}" width="${f1(w)}" height="${f1(h*.45)}" rx="1" fill="${shade(c,.12)}"/>`}
  case'leaf':return`<ellipse cx="${X}" cy="${Y}" rx="${f1(5*s)}" ry="${f1(2*s)}" fill="${c}" transform="rotate(${rot} ${X} ${Y})"/>`;
  case'ring':return`<ellipse cx="${X}" cy="${Y}" rx="${f1(6*s)}" ry="${f1(3*s)}" fill="none" stroke="${c}" stroke-width="${f1(1.8*s)}" transform="rotate(${f1(rand()*40-20)} ${X} ${Y})"/>`;
  case'block':return`<rect x="${f1(x-17)}" y="${f1(y-6)}" width="34" height="11" fill="${shade(c,-.12)}"/><polygon points="${f1(x-17)},${f1(y-6)} ${f1(x+17)},${f1(y-6)} ${f1(x+23)},${f1(y-13)} ${f1(x-11)},${f1(y-13)}" fill="${c}"/><polygon points="${f1(x+17)},${f1(y-6)} ${f1(x+23)},${f1(y-13)} ${f1(x+23)},${f1(y-2)} ${f1(x+17)},${f1(y+5)}" fill="${shade(c,-.2)}"/>`;
  case'grain':return`<ellipse cx="${X}" cy="${Y}" rx="${f1(2.4*s)}" ry="${f1(1.1*s)}" fill="${c}" transform="rotate(${rot} ${X} ${Y})"/>`;
  case'ball':{const r=5*s;return`<circle cx="${X}" cy="${f1(y+1)}" r="${f1(r)}" fill="${shade(c,-.22)}"/><circle cx="${X}" cy="${f1(y-.4)}" r="${f1(r*.88)}" fill="${c}"/><circle cx="${f1(x-r*.35)}" cy="${f1(y-r*.4)}" r="${f1(r*.28)}" fill="#fff" opacity=".45"/>`}
  case'log':{const w=16*s,h=7*s,t=`rotate(${f1(rand()*50-25)} ${X} ${Y})`;return`<g transform="${t}"><rect x="${f1(x-w/2)}" y="${f1(y-h/2+1.5)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(h/2)}" fill="${shade(c,-.3)}"/><rect x="${f1(x-w/2)}" y="${f1(y-h/2)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(h/2)}" fill="${c}"/><rect x="${f1(x-w/3)}" y="${f1(y-h/2+1)}" width="${f1(w/2)}" height="1.6" rx=".8" fill="#fff" opacity=".25"/></g>`}
  case'half':{const r=6*s;return`<g transform="rotate(${f1(rand()*60-30)} ${X} ${Y})"><path d="M${f1(x-r)},${Y} A${f1(r)},${f1(r)} 0 0 1 ${f1(x+r)},${Y} Z" fill="${c}"/><path d="M${f1(x-r*.68)},${Y} A${f1(r*.68)},${f1(r*.68)} 0 0 1 ${f1(x+r*.68)},${Y} Z" fill="${shade(c,.3)}"/></g>`}
  case'strand':return`<path d="M${f1(x-14*s)},${Y} q${f1(4.5*s)},${f1(-5*s)} ${f1(9*s)},0 t${f1(9*s)},0 t${f1(9*s)},0" stroke="${c}" stroke-width="${f1(2.6*s)}" fill="none" stroke-linecap="round" transform="rotate(${f1(rand()*70-35)} ${X} ${Y})"/>`;
  case'blob':return`<ellipse cx="${X}" cy="${Y}" rx="${f1((4+rand()*3)*s)}" ry="${f1((3+rand()*2)*s)}" fill="${c}" transform="rotate(${rot} ${X} ${Y})"/>`;
  case'egg':return`<ellipse cx="${X}" cy="${f1(y+1)}" rx="${f1(10*s)}" ry="${f1(6.5*s)}" fill="#fbf8f0" transform="rotate(${f1(rand()*40-20)} ${X} ${Y})"/><circle cx="${f1(x+1)}" cy="${Y}" r="${f1(3.6*s)}" fill="${c}"/><circle cx="${f1(x)}" cy="${f1(y-1)}" r="${f1(1.1*s)}" fill="#fff" opacity=".6"/>`;
  case'wedge':return`<g transform="rotate(${f1(rand()*50-25)} ${X} ${Y})"><path d="M${f1(x-9*s)},${f1(y+3*s)} Q${X},${f1(y-9*s)} ${f1(x+9*s)},${f1(y+3*s)} Z" fill="${c}"/><path d="M${f1(x-9*s)},${f1(y+3*s)} Q${X},${f1(y-9*s)} ${f1(x+9*s)},${f1(y+3*s)}" stroke="${shade(c,-.35)}" stroke-width="1.5" fill="none"/></g>`;
  }return''}
function scatterE(cx,cy,rx,ry,pc,rand){const it=[];for(const p of pc||[]){const[sh,c,n,s]=p;for(let i=0;i<n;i++){let x,y;if(sh==='block'){x=cx;y=cy-ry*.1}else{const t=rand()*6.283,m=Math.sqrt(rand())*.88;x=cx+Math.cos(t)*m*rx;y=cy+Math.sin(t)*m*ry}it.push([y,piece(sh,c,x,y,s||1,rand)])}}
  return it.sort((a,b)=>a[0]-b[0]).map(a=>a[1]).join('')}
function slice(a,rand){const x0=48,w=112,dx=36,dy=20;let y=132,o='';
  for(const[c0,h]of a.L){const c=hexOk(c0);o+=`<rect x="${x0}" y="${y-h}" width="${w}" height="${h+.5}" fill="${c}"/><polygon points="${x0+w},${y} ${x0+w+dx},${y-dy} ${x0+w+dx},${y-h-dy} ${x0+w},${y-h}" fill="${shade(c,-.24)}"/>`;y-=h}
  const top=hexOk(a.top),d=a.deco||'';
  o+=`<polygon points="${x0},${y} ${x0+w},${y} ${x0+w+dx},${y-dy} ${x0+dx},${y-dy}" fill="${top}"/><line x1="${x0}" y1="${y}" x2="${x0+w}" y2="${y}" stroke="${shade(top,.28)}" stroke-width="1.5"/>`;
  const pt=()=>{const u=rand(),v=rand();return[x0+4+u*(w-8)+v*dx,y-2-v*(dy-4)]};
  if(d.includes('drip')){o+=`<rect x="${x0}" y="${y-1}" width="${w}" height="5" fill="${top}"/>`;for(let i=0;i<8;i++)o+=`<rect x="${x0+4+i*14}" y="${y}" width="9" height="${f1(6+rand()*16)}" rx="4.5" fill="${top}"/>`}
  if(d.includes('gloss'))o+=`<path d="M${x0+14},${y-4} L${x0+64},${y-4} L${x0+84},${y-dy+4} L${x0+34},${y-dy+4}Z" fill="#fff" opacity=".2"/>`;
  if(d.includes('dust'))for(let i=0;i<70;i++){const[px,py]=pt();o+=`<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(.7+rand()*1.2)}" fill="${a.dc}"/>`}
  if(d.includes('dimple')){for(let i=0;i<26;i++){const[px,py]=pt();o+=`<ellipse cx="${f1(px)}" cy="${f1(py)}" rx="3.2" ry="1.6" fill="${shade(top,-.25)}"/>`}for(let i=0;i<7;i++){const[px,py]=pt();o+=piece('leaf',a.dc,px,py,.8,rand)}}
  if(d.includes('crackle'))for(let i=0;i<14;i++){const[px,py]=pt();o+=`<path d="M${f1(px)},${f1(py)} l${f1(6+rand()*10)},${f1(rand()*3-1.5)} l${f1(4+rand()*6)},${f1(rand()*3-1.5)}" stroke="${a.dc}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`}
  if(d.includes('berries'))for(let i=0;i<5;i++){const px=x0+18+i*20+rand()*8,py=y-5-rand()*10;o+=`<circle cx="${f1(px)}" cy="${f1(py+2)}" r="6.5" fill="${shade(a.dc,-.35)}"/><circle cx="${f1(px)}" cy="${f1(py)}" r="6.5" fill="${a.dc}"/><circle cx="${f1(px-2)}" cy="${f1(py-2.5)}" r="1.8" fill="#fff" opacity=".7"/>`}
  return plate+o}
function cookie(a,rand){const c=hexOk(a.c);let o='<ellipse cx="124" cy="132" rx="104" ry="14" style="fill:var(--shadow)"/><ellipse cx="120" cy="128" rx="100" ry="15" style="fill:var(--plate)"/>';
  const one=(cx,cy,r,front)=>{const ry=r*.6;let s=`<ellipse cx="${cx}" cy="${cy+9}" rx="${r}" ry="${ry}" fill="${shade(c,-.28)}"/><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${ry}" fill="${c}"/><ellipse cx="${f1(cx-r*.25)}" cy="${f1(cy-ry*.35)}" rx="${f1(r*.5)}" ry="${f1(ry*.32)}" fill="${shade(c,.16)}" opacity=".7"/>`;
    const n=a.v==='sugar'?40:12;for(let i=0;i<n;i++){const t=rand()*6.283,m=Math.sqrt(rand())*.82,x=cx+Math.cos(t)*m*r,y=cy+Math.sin(t)*m*ry;
      if(a.v==='sugar')s+=`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(.8+rand())}" fill="${a.ch}" opacity=".85"/>`;
      else s+=`<path d="M${f1(x-4)},${f1(y)} l${f1(3+rand()*3)},-4 l5,${f1(2+rand()*2)} l-2,4 Z" fill="${a.ch}"/>`}
    for(let i=0;i<5;i++){const t=rand()*6.283,m=.3+rand()*.4;s+=`<path d="M${f1(cx+Math.cos(t)*m*r)},${f1(cy+Math.sin(t)*m*ry)} q8,${f1(rand()*6-3)} 16,${f1(rand()*4-2)}" stroke="${shade(c,a.v==='center'?.18:-.18)}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`}
    if(front&&a.v==='center')s+=`<path d="M${cx-17},${cy+1} q3,-10 12,-9 q6,-6 13,0 q9,1 8,8 q2,8 -8,9 q-6,5 -14,1 q-12,1 -11,-9Z" fill="${a.dc}"/><ellipse cx="${cx-4}" cy="${cy-3}" rx="7" ry="3" fill="#fff" opacity=".6"/>`;
    return s};
  return o+one(88,90,48,false)+one(150,100,56,true)}
let clipN=0;
function tray(a,rand){const id='cl'+(++clipN),c=hexOk(a.c);let o=`<rect x="18" y="16" width="204" height="124" rx="12" fill="#8d8780"/><rect x="18" y="12" width="204" height="124" rx="12" fill="#c9c3bc"/><clipPath id="${id}"><rect x="28" y="21" width="184" height="106" rx="6"/></clipPath><rect x="28" y="21" width="184" height="106" rx="6" fill="${shade(c,-.35)}"/><g clip-path="url(#${id})">`;
  for(let r=-1;r<7;r++)for(let k=-1;k<7;k++){const x=30+k*34+(r%2?17:0),y=22+r*19;o+=`<polygon points="${x},${y-9.5} ${x+17},${y} ${x},${y+9.5} ${x-17},${y}" fill="${c}" stroke="${shade(c,-.4)}" stroke-width="1.4"/><polygon points="${x},${y-8} ${x+12},${y-1} ${x-12},${y-1}" fill="${shade(c,.22)}" opacity=".7"/><ellipse cx="${x}" cy="${y}" rx="${f1(3+rand()*1.5)}" ry="2.4" fill="${a.p}"/>`}
  return o+'</g>'}
function bowl(a,rand){const b=hexOk(a.b),c=hexOk(a.c);let o=plate+`<path d="M54,72 Q58,134 120,134 Q182,134 186,72 Z" fill="${b}"/><path d="M120,134 Q182,134 186,72 L150,72 Q156,120 120,134Z" fill="#000" opacity=".12"/><ellipse cx="120" cy="72" rx="66" ry="15" fill="${shade(b,b==='#ffffff'?-.06:.22)}"/><ellipse cx="120" cy="72" rx="58" ry="11.5" fill="${c}"/><ellipse cx="104" cy="69" rx="26" ry="4" fill="#fff" opacity=".14"/>`;
  if(a.deco==='brul')for(let i=0;i<11;i++){const t=rand()*6.283,m=Math.sqrt(rand())*.8;o+=`<ellipse cx="${f1(120+Math.cos(t)*m*52)}" cy="${f1(72+Math.sin(t)*m*9)}" rx="${f1(4+rand()*7)}" ry="${f1(1.6+rand()*1.6)}" fill="${a.dc}" opacity=".75"/>`}
  else if(a.deco==='crumb')for(let i=0;i<40;i++){const t=rand()*6.283,m=Math.sqrt(rand())*.85;o+=`<circle cx="${f1(120+Math.cos(t)*m*54)}" cy="${f1(72+Math.sin(t)*m*10)}" r="${f1(.7+rand()*1.3)}" fill="${a.dc}"/>`}
  if(a.pc)o+=scatterE(120,72,52,9,a.pc,rand);
  if(a.deco==='swirl')o+=`<ellipse cx="114" cy="71" rx="17" ry="5.5" fill="#fbf7f0"/><ellipse cx="111" cy="69.5" rx="8" ry="2.4" fill="#fff"/>`+piece('leaf','#4d8a2c',122,69,1,rand)+piece('leaf','#4d8a2c',106,72,1,rand);
  return o}
function heap(a,rand){const R=a.R||70,H=a.H||30,b=hexOk(a.base);let o=plate+`<ellipse cx="120" cy="128" rx="${R}" ry="9" fill="${shade(b,-.2)}"/><path d="M${120-R},128 A${R},${H} 0 0 1 ${120+R},128 Z" fill="${b}"/><path d="M120,${128-H} A${R},${H} 0 0 1 ${120+R},128 L120,128Z" fill="#000" opacity=".07"/>`;
  const it=[];for(const p of a.pc||[]){const[sh,c,n,s]=p;for(let i=0;i<n;i++){let x,y;if(sh==='block'){x=118;y=128-H*.82}else{const dx=(rand()*2-1)*R*.86,yt=128-H*Math.sqrt(Math.max(0,1-(dx/R)**2));x=120+dx;y=yt+2+rand()*Math.max(2,(128-yt)*.7)}it.push([y,piece(sh,c,x,y,s||1,rand)])}}
  return o+it.sort((p,q)=>p[0]-q[0]).map(p=>p[1]).join('')}
function pan(a,rand){const p=hexOk(a.pan||'#b5652e'),b=hexOk(a.base);return`<ellipse cx="124" cy="104" rx="104" ry="40" style="fill:var(--shadow)"/><rect x="4" y="80" width="34" height="11" rx="5.5" fill="${shade(p,-.4)}"/><rect x="202" y="80" width="34" height="11" rx="5.5" fill="${shade(p,-.4)}"/><ellipse cx="120" cy="90" rx="96" ry="46" fill="${shade(p,-.3)}"/><ellipse cx="120" cy="86" rx="96" ry="46" fill="${p}"/><ellipse cx="120" cy="88" rx="86" ry="40" fill="${shade(p,-.45)}"/><ellipse cx="120" cy="90" rx="82" ry="37" fill="${b}"/><ellipse cx="96" cy="80" rx="36" ry="9" fill="#fff" opacity=".1"/>`+scatterE(120,90,74,31,a.pc,rand)}
function flat(a,rand){const rx=a.oval?102:90,ry=a.oval?34:44,cr=hexOk(a.crust),b=hexOk(a.base);let o=`<ellipse cx="124" cy="${96+ry*.25}" rx="${rx+4}" ry="${ry}" style="fill:var(--shadow)"/><ellipse cx="120" cy="99" rx="${rx}" ry="${ry}" fill="${shade(cr,-.3)}"/><ellipse cx="120" cy="94" rx="${rx}" ry="${ry}" fill="${cr}"/><ellipse cx="120" cy="95" rx="${rx-10}" ry="${ry-7}" fill="${b}"/>`;
  for(let i=0;i<16;i++){const t=rand()*6.283;o+=`<ellipse cx="${f1(120+Math.cos(t)*(rx-4))}" cy="${f1(94+Math.sin(t)*(ry-3))}" rx="${f1(2+rand()*3)}" ry="1.6" fill="#5a3520" opacity=".55"/>`}
  return o+scatterE(120,95,rx-16,ry-11,a.pc,rand)}
function dumpl(a,rand){const c=hexOk(a.c);let o=plate;if(a.sauce)o+=`<ellipse cx="120" cy="120" rx="80" ry="17" fill="${a.sauce}"/><ellipse cx="110" cy="117" rx="50" ry="8" fill="#fff" opacity=".35"/>`;
  let pos=[];if(a.v==='manti'){for(let i=0;i<30;i++){const t=rand()*6.283,m=Math.sqrt(rand())*.92;pos.push([120+Math.cos(t)*m*64,118+Math.sin(t)*m*12])}}
  else pos=[[86,104],[112,100],[138,101],[162,106],[74,116],[100,114],[126,114],[152,116],[176,121],[90,127],[116,128],[142,128]];
  pos.sort((p,q)=>p[1]-q[1]);
  for(const[x,y]of pos){const X=f1(x),Y=f1(y);
    if(a.v==='manti')o+=`<rect x="${f1(x-5)}" y="${f1(y-4)}" width="10" height="8" rx="3" fill="${shade(c,-.12)}"/><path d="M${f1(x-4)},${f1(y-3)} L${X},${f1(y-7)} L${f1(x+4)},${f1(y-3)}Z" fill="${c}"/>`;
    else if(a.v==='moon')o+=`<path d="M${f1(x-15)},${f1(y+5)} Q${X},${f1(y-15)} ${f1(x+15)},${f1(y+5)} Z" fill="${shade(c,-.15)}" transform="translate(0 2)"/><path d="M${f1(x-15)},${f1(y+5)} Q${X},${f1(y-15)} ${f1(x+15)},${f1(y+5)} Z" fill="${c}" stroke="${shade(c,-.18)}" stroke-width="1.6" stroke-dasharray="2 2"/>`;
    else o+=`<ellipse cx="${X}" cy="${f1(y+2)}" rx="13" ry="9" fill="${shade(c,-.18)}"/><ellipse cx="${X}" cy="${Y}" rx="12" ry="8" fill="${c}"/><path d="M${f1(x-7)},${f1(y-1)} q7,-6 14,0" stroke="${shade(c,-.15)}" stroke-width="1.4" fill="none"/>`}
  if(a.dollop)o+=`<ellipse cx="146" cy="104" rx="16" ry="6" fill="#fbf7f0"/><ellipse cx="143" cy="101" rx="8" ry="3" fill="#fff"/>`;
  return o+scatterE(120,114,62,16,a.pc,rand)}
function skewer(a,rand){let o=plate+`<ellipse cx="112" cy="121" rx="80" ry="13" fill="${shade(a.pita,-.2)}"/><ellipse cx="110" cy="117" rx="76" ry="11" fill="${a.pita}"/><ellipse cx="66" cy="117" rx="18" ry="6" fill="#f7f4ea"/>`+piece('leaf','#5d8f3c',62,116,.7,rand)+piece('half','#f5dd5a',184,118,1.6,rand);
  o+=`<line x1="34" y1="114" x2="208" y2="72" stroke="#c8a06a" stroke-width="3" stroke-linecap="round"/>`;
  const cols=[a.meat,a.meat,a.v1,a.meat,a.meat,a.v2,a.meat];
  cols.forEach((c0,i)=>{const t=(i+.5)/7,x=48+t*146,y=110-t*35,c=hexOk(c0),sz=c0===a.meat?19:13;o+=`<rect x="${f1(x-sz/2)}" y="${f1(y-sz/2+2)}" width="${sz}" height="${sz}" rx="4" fill="${shade(c,-.3)}"/><rect x="${f1(x-sz/2)}" y="${f1(y-sz/2)}" width="${sz}" height="${sz}" rx="4" fill="${c}"/><rect x="${f1(x-sz/2+2)}" y="${f1(y-sz/2+1)}" width="${sz-4}" height="3" rx="1.5" fill="${shade(c,.25)}"/>`;
    if(c0===a.meat)for(let k=0;k<3;k++)o+=`<circle cx="${f1(x-6+rand()*12)}" cy="${f1(y-5+rand()*10)}" r="1.6" fill="#3a1a0c" opacity=".7"/>`});
  return o}
function veg(a,rand){let o=plate;const c=hexOk(a.c);
  if(a.v==='tomato'){const c2=hexOk(a.c2);
    o+=`<ellipse cx="76" cy="102" rx="20" ry="28" fill="${shade(c2,-.15)}"/><ellipse cx="74" cy="100" rx="18" ry="26" fill="${c2}"/><path d="M68,80 Q66,100 70,122" stroke="${shade(c2,-.25)}" stroke-width="1.5" fill="none"/><ellipse cx="74" cy="76" rx="12" ry="4" fill="${shade(c2,-.1)}"/><rect x="72" y="66" width="4" height="10" rx="2" fill="#4c6b2a"/>`;
    for(const[x,y,r]of[[166,104,24],[122,112,27]]){o+=`<ellipse cx="${x+2}" cy="${y+2}" rx="${r}" ry="${r*.86}" fill="${shade(c,-.3)}"/><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*.86}" fill="${c}"/><ellipse cx="${x-r*.35}" cy="${y-r*.3}" rx="${r*.3}" ry="${r*.18}" fill="#fff" opacity=".35"/><ellipse cx="${x}" cy="${y-r*.7}" rx="${r*.5}" ry="${r*.16}" fill="${shade(c,-.15)}"/><path d="M${x-4},${y-r*.75} l4,-6 l4,6" stroke="#4c6b2a" stroke-width="2.4" fill="none"/>`;
      for(let k=0;k<4;k++)o+=`<circle cx="${f1(x-r*.6+rand()*r*1.2)}" cy="${f1(y-r*.5+rand()*r)}" r="${f1(1.5+rand()*2)}" fill="#3a1a0c" opacity=".35"/>`}}
  else if(a.v==='aubergine'){const one=(cx,cy,s)=>{const P=(dx,dy)=>f1(cx+dx*s)+','+f1(cy+dy*s);return`<path d="M${P(-58,0)} Q${P(-62,20)} ${P(-30,22)} L${P(40,20)} Q${P(62,14)} ${P(58,0)} Z" fill="${c}"/><path d="M${P(-58,0)} Q${P(-62,20)} ${P(-30,22)} L${P(40,20)}" stroke="#fff" stroke-opacity=".18" stroke-width="2" fill="none"/><ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(54*s)}" ry="${f1(9*s)}" fill="${a.f}"/>${scatterE(cx,cy,48*s,6*s,[['blob',shade(a.f,-.2),10,.7*s],['leaf','#4b8a2f',4,s]],rand)}<circle cx="${f1(cx-10*s)}" cy="${f1(cy-3*s)}" r="${f1(9*s)}" fill="#d8402a"/><circle cx="${f1(cx-10*s)}" cy="${f1(cy-3*s)}" r="${f1(6*s)}" fill="#ee6a4d"/><rect x="${f1(cx+12*s)}" y="${f1(cy-6*s)}" width="${f1(22*s)}" height="${f1(6*s)}" rx="${f1(3*s)}" fill="#5c9a33"/><path d="M${P(56,-2)} q10,-4 14,-12" stroke="#4c6b2a" stroke-width="${f1(5*s)}" stroke-linecap="round" fill="none"/>`};
    o+=one(114,88,.9)+one(126,114,1)}
  else{o+=`<ellipse cx="120" cy="120" rx="88" ry="18" fill="${a.sauce}"/>`;
    for(const[x,y]of[[88,102],[136,100],[102,120],[150,120]]){o+=`<rect x="${x-24}" y="${y-11}" width="48" height="24" rx="12" fill="${shade(c,-.25)}"/><rect x="${x-24}" y="${y-13}" width="48" height="24" rx="12" fill="${c}"/><ellipse cx="${x+18}" cy="${y-1}" rx="6" ry="11" fill="${shade(c,-.12)}"/><path d="M${x-16},${y-10} q8,8 0,20 M${x-2},${y-12} q8,9 0,22" stroke="${shade(c,.35)}" stroke-width="1.5" fill="none"/>`}
    o+=scatterE(120,104,70,18,[['blob',shade(a.sauce,-.1),8,.7],['leaf','#4d8a2c',6]],rand)}
  return o}
function dome(a,rand){const c=hexOk(a.c),s=hexOk(a.s);let o=plate+`<ellipse cx="120" cy="128" rx="62" ry="9" fill="${s}"/><path d="M80,128 L90,70 Q120,62 150,70 L160,128 Z" fill="${c}"/><path d="M120,66 Q150,66 150,70 L160,128 L128,128Z" fill="#000" opacity=".07"/><ellipse cx="120" cy="69" rx="30" ry="7" fill="${s}"/>`;
  for(const[x,l]of[[96,26],[108,40],[132,20],[144,34]])o+=`<rect x="${x-3}" y="68" width="7" height="${l}" rx="3.5" fill="${s}"/>`;
  for(const[x,y]of[[112,64],[126,63],[119,59]])o+=`<circle cx="${x}" cy="${y}" r="5.5" fill="${shade(s,-.2)}"/><circle cx="${x-1.5}" cy="${y-1.5}" r="1.5" fill="#fff" opacity=".6"/>`;
  return o+piece('leaf','#3f7a2a',132,58,1.2,rand)}
function toast(a,rand){let o=plate;for(const[x,y]of[[78,104],[164,106],[121,116]]){o+=`<ellipse cx="${x}" cy="${y+6}" rx="34" ry="16" fill="${a.crust}"/><ellipse cx="${x}" cy="${y}" rx="34" ry="16" fill="${a.bread}"/><ellipse cx="${x}" cy="${y}" rx="34" ry="16" fill="none" stroke="${shade(a.crust,.1)}" stroke-width="3"/>`+scatterE(x,y-1,26,11,a.pc,rand)}return o}
function pastry(a){const c=hexOk(a.c);
  if(a.closed){const one=(cx,cy,s)=>`<ellipse cx="${cx}" cy="${f1(cy+6*s)}" rx="${f1(56*s)}" ry="${f1(28*s)}" fill="${shade(c,-.3)}"/><ellipse cx="${cx}" cy="${cy}" rx="${f1(55*s)}" ry="${f1(27*s)}" fill="${c}"/><ellipse cx="${f1(cx-14*s)}" cy="${f1(cy-10*s)}" rx="${f1(24*s)}" ry="${f1(7*s)}" fill="${shade(c,.35)}" opacity=".7"/>`;return plate+one(84,96,.72)+one(156,96,.72)+one(120,112,.85)}
  const one=(cx,cy,s)=>`<ellipse cx="${cx}" cy="${f1(cy+6*s)}" rx="${f1(62*s)}" ry="${f1(38*s)}" fill="${shade(c,-.25)}"/><ellipse cx="${cx}" cy="${f1(cy+8*s)}" rx="${f1(53*s)}" ry="${f1(29*s)}" fill="${a.f}"/><ellipse cx="${cx}" cy="${f1(cy-7*s)}" rx="${f1(62*s)}" ry="${f1(30*s)}" fill="${c}"/><ellipse cx="${f1(cx-16*s)}" cy="${f1(cy-16*s)}" rx="${f1(26*s)}" ry="${f1(8*s)}" fill="${shade(c,.35)}" opacity=".65"/>`;
  return plate+one(90,92,.7)+one(146,104,.82)}
function stack(a,rand){const c=hexOk(a.c),n=a.thin?7:3,h=a.thin?6:18,g=h+2;let o=plate;
  for(let i=0;i<n;i++){const y=128-i*g;o+=`<ellipse cx="120" cy="${y}" rx="${a.thin?62:52}" ry="13" fill="${shade(c,-.3)}"/><rect x="${a.thin?58:68}" y="${y-h}" width="${a.thin?124:104}" height="${h}" fill="${shade(c,-.18)}"/><ellipse cx="120" cy="${y-h}" rx="${a.thin?62:52}" ry="13" fill="${c}"/><ellipse cx="106" cy="${y-h-3}" rx="22" ry="4" fill="${shade(c,.3)}" opacity=".6"/>`}
  const t=128-(n-1)*g-h;
  if(a.v==='caviar'){o+=`<ellipse cx="114" cy="${t}" rx="24" ry="8" fill="#fbf7ef"/><ellipse cx="111" cy="${t-4}" rx="12" ry="5" fill="#fffdf8"/>`;for(let i=0;i<22;i++)o+=`<circle cx="${f1(124+rand()*22)}" cy="${f1(t-6+rand()*9)}" r="1.8" fill="#d6461f"/>`;o+=piece('leaf','#4d8a2c',100,t-2,1,rand)}
  else if(a.v==='cream')o+=`<ellipse cx="120" cy="${t+1}" rx="24" ry="9" fill="#fbf7ef"/><ellipse cx="117" cy="${t-4}" rx="13" ry="6" fill="#fffdf8"/>`+piece('leaf','#4d8a2c',134,t-1,1,rand);
  else o+=`<path d="M126,${t-2} q16,-5 20,4 l0,26 q-3,6 -6,0 l0,-14 q-5,5 -11,-1 Z" fill="#b3172f"/><ellipse cx="116" cy="${t+2}" rx="24" ry="9" fill="#fbf7ef"/><ellipse cx="113" cy="${t-4}" rx="13" ry="6" fill="#fffdf8"/>`;
  return o}
function loaf(a){const c=hexOk(a.c);return plate+`<path d="M40,130 L44,80 Q48,58 76,56 L164,56 Q192,58 196,80 L200,130 Z" fill="${shade(c,-.08)}"/><path d="M44,80 Q48,58 76,56 L164,56 Q192,58 196,80 Q120,70 44,80 Z" fill="${shade(c,-.32)}"/><path d="M72,63 Q120,55 168,63" stroke="${shade(c,.35)}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M44,112 L200,112 L200,130 L40,130Z" fill="#000" opacity=".1"/><ellipse cx="96" cy="62" rx="9" ry="3.5" fill="#f3e2b0"/><ellipse cx="140" cy="61" rx="9" ry="3.5" fill="#f3e2b0"/>`}
function rings(a,rand){const c=hexOk(a.c);let o=plate;for(const[x,y,r]of[[82,98,34],[158,100,36],[120,118,38]]){const w=f1(r*.42);o+=`<ellipse cx="${x}" cy="${y+4}" rx="${r}" ry="${f1(r*.55)}" fill="none" stroke="${shade(c,-.35)}" stroke-width="${w}"/><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f1(r*.55)}" fill="none" stroke="${c}" stroke-width="${w}"/><ellipse cx="${x-r*.3}" cy="${f1(y-r*.4)}" rx="${f1(r*.4)}" ry="${f1(r*.08)}" fill="#fff" opacity=".18"/>`;
  for(let i=0;i<46;i++){const tt=rand()*6.283,m=1+(rand()-.5)*.36,px=x+Math.cos(tt)*r*m,py=y+Math.sin(tt)*r*.55*m;o+=`<ellipse cx="${f1(px)}" cy="${f1(py)}" rx="1.4" ry=".75" fill="${a.s||'#f3e2b4'}" transform="rotate(${f1(rand()*180)} ${f1(px)} ${f1(py)})"/>`}}return o}
const DRAW={rings,slice,cookie,tray,bowl,heap,pan,flat,dumpl,skewer,veg,dome,toast,pastry,stack,loaf};
const artCache={};
function art(r,big,fallback){const k=r.id+(big?'!':'');if(!r.mine&&artCache[k])return artCache[k];const a=r.art||fallback,f=DRAW[a&&a.t]||slice;let body='';try{body=f(a,rng(r.id))}catch(e){body=''}
  const back=big?'<circle cx="122" cy="76" r="70" fill="#fff" opacity=".28"/>':'';return artCache[k]=`<svg viewBox="0 0 240 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${back}<g class="dish">${body}</g></svg>`}
window.SofraDraw={art,hexOk,shade};
})();
