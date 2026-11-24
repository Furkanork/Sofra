/* Sofra app logic: recipes, cook mode, timers, pantry matcher, plan and shopping list,
   notes and photos, backup, diets, measures and language. Plain browser JavaScript, no build step. */
(function(){
'use strict';
const R=Array.isArray(window.SOFRA_RECIPES)?window.SOFRA_RECIPES:[];
const RTR=window.SOFRA_TR||{};
const I18N=window.SOFRA_I18N||{};
const TRD=I18N.tr||{};
const SUBS=window.SOFRA_SUBS||[];
const PAN=window.SOFRA_PANTRY||{items:[],sections:[]};
const D=window.SofraDraw;
const hexOk=D.hexOk;

const COURSES=[['breakfast','Breakfast'],['soups','Soups'],['meze','Meze & salads'],['mains','Mains'],['pasta','Pasta, rice & dumplings'],['bakes','Breads, pastry & pancakes'],['desserts','Desserts']];
const CL=Object.fromEntries(COURSES),CO=Object.fromEntries(COURSES.map((c,i)=>[c[0],i]));
const CUIS=['Turkish','Persian','Italian','Greek','Russian & Ukrainian','Lebanese','Georgian','Azerbaijani','Balkan'];
const DAYS=[['','Any day'],['mon','Monday'],['tue','Tuesday'],['wed','Wednesday'],['thu','Thursday'],['fri','Friday'],['sat','Saturday'],['sun','Sunday']];
const DIETS=[['veg','Vegetarian'],['vegan','Vegan'],['gf','Gluten-free'],['quick','30 min or less']];
const LOOKS={
 cake:{art:{t:'slice',L:[['#c99560',30],['#f5e9d6',18],['#c99560',30]],top:'#e9cfa6',deco:'dust',dc:'#a86e3c'},tint:'#f3d9b8'},
 soup:{art:{t:'bowl',b:'#ffffff',c:'#d9752e',pc:[['cube','#f0973a',8,.8],['leaf','#3d7a28',6]]},tint:'#f7c59a'},
 plate:{art:{t:'heap',base:'#e9cf8f',H:28,R:68,pc:[['cube','#d6372a',10],['leaf','#3f7f2d',8],['grain','#fffaf0',30]]},tint:'#f4e4b8'},
 pan:{art:{t:'pan',base:'#c94a2a',pc:[['blob','#f3c43b',6,1.1],['ring','#4c8f2c',6],['leaf','#3f7a2a',4]]},tint:'#fbd0a6'},
 dumplings:{art:{t:'dumpl',v:'round',c:'#f5e9d2',dollop:true,pc:[['leaf','#4d8a2c',8]]},tint:'#f1dccb'},
 flat:{art:{t:'flat',crust:'#e9b064',base:'#c9321f',pc:[['blob','#fbf6ea',7,1.4],['leaf','#2f7a26',6,1.3]]},tint:'#f6c9b8'},
 cookie:{art:{t:'cookie',c:'#d9a45f',ch:'#5a3320',v:'chip'},tint:'#f6dfba'},
 pudding:{art:{t:'bowl',b:'#ffffff',c:'#f3e3c3',deco:'crumb',dc:'#a0663b'},tint:'#f2e3cf'},
 pastry:{art:{t:'stack',c:'#e0a95a'},tint:'#f8dcae'}};

/* ---------- storage ---------- */
const LS={get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const prefs=Object.assign({lang:/^tr\b/i.test(navigator.language||'')?'tr':'en',units:'metric'},obj(LS.get('sofra-prefs',{})));
let mine=arr(LS.get('sofra-mine',[]));
mine.forEach(r=>{if(!CL[r.course])r.course='desserts'});
const fav=new Set(arr(LS.get('sofra-fav',[])));
let plan=arr(LS.get('sofra-plan',[])).filter(p=>p&&typeof p.id==='string');
const pantry=new Set(arr(LS.get('sofra-pantry',[])));
const notes=obj(LS.get('sofra-notes',{}));
const covers=obj(LS.get('sofra-covers',{}));
const swaps=obj(LS.get('sofra-swaps',{}));
const shopDone=new Set(arr(LS.get('sofra-shop',[])));
let timers=arr(LS.get('sofra-timers',[])).filter(x=>x&&x.ends);
const save={prefs:()=>LS.set('sofra-prefs',prefs),mine:()=>LS.set('sofra-mine',mine),fav:()=>LS.set('sofra-fav',[...fav]),plan:()=>LS.set('sofra-plan',plan),pantry:()=>LS.set('sofra-pantry',[...pantry]),notes:()=>LS.set('sofra-notes',notes),covers:()=>LS.set('sofra-covers',covers),swaps:()=>LS.set('sofra-swaps',swaps),shop:()=>LS.set('sofra-shop',[...shopDone]),timers:()=>LS.set('sofra-timers',timers)};

const st={q:'',cui:'all',course:'',diet:new Set(),sv:{},open:{},view:'recipes',pq:'',pskip:true,pendingImport:null};
let cur=null,editing=null;
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const all=()=>R.concat(mine);
const find=id=>all().find(r=>r.id===id);
const art=(r,big)=>D.art(r,big,LOOKS.cake.art);
const setHash=h=>{if(h){location.hash=h;return}try{history.pushState(null,'',location.pathname+location.search)}catch(e){location.hash=''}route(true)};

/* ---------- language ---------- */
const tr=()=>prefs.lang==='tr';
function t(s,v){let o=tr()&&TRD[s]!=null?TRD[s]:s;if(v)o=o.replace(/\{(\w+)\}/g,(m,k)=>v[k]!=null?v[k]:m);return o}
const RT=r=>tr()&&!r.mine?RTR[r.id]:null;
const rName=r=>(RT(r)&&RT(r).name)||r.name;
const rLocal=r=>(RT(r)&&RT(r).local)||r.local||'';
const full=r=>{const x=RT(r);return!!(x&&Array.isArray(x.steps)&&x.steps.length===r.steps.length&&Array.isArray(x.ing)&&x.ing.length===r.ing.length)};
const rSteps=r=>full(r)?RT(r).steps:r.steps;
const rTip=r=>(full(r)&&RT(r).tip)||r.tip||'';
const rIng=(r,x)=>{const i=r.ing[x];if(full(r))return RT(r).ing[x];return typeof i==='string'?i:i[2]};
const sing=u=>u.endsWith('ies')?u.slice(0,-3)+'y':u.replace(/s$/,'');
const unitWord=(u,n)=>tr()?((I18N.units||{})[u]||u):(n===1?sing(u):u);
const cName=o=>t(o);
const fmtT=m=>{m=+m||0;const a=tr()?'dk':'min',b=tr()?'sa':'h';if(m<60)return m+' '+a;const h=Math.floor(m/60),r=m%60;return h+' '+b+(r?' '+r+' '+a:'')};
function fmtDur(sec){if(sec<60)return sec+(tr()?' sn':' s');if(sec%3600===0)return sec/3600+(tr()?' sa':' h');if(sec>=3600)return fmtT(Math.round(sec/60));return Math.round(sec/60)+(tr()?' dk':' min')}

/* ---------- amounts and measures ---------- */
function fmtNum(q){const w=Math.floor(q+1e-9),f=q-w,F=[[0,''],[.25,'¼'],[1/3,'⅓'],[.5,'½'],[2/3,'⅔'],[.75,'¾'],[1,'']];let b=F[0];for(const x of F)if(Math.abs(x[0]-f)<Math.abs(b[0]-f))b=x;const W=w+(b[0]===1?1:0);return((W?String(W):'')+b[1])||'¼'}
const dec=n=>{const s=String(Math.round(n*100)/100);return tr()?s.replace('.',','):s};
function fmtQ(q,u){if(!q)return['',u];if(u==='l'&&q<1){q*=1000;u='ml'}if(u==='kg'&&q<1){q*=1000;u='g'}
  if(u==='g'||u==='ml')return[String(q>=20?Math.round(q/5)*5:Math.max(1,Math.round(q))),u];
  if(u==='l'||u==='kg')return[dec(q),u];
  return[fmtNum(q),u]}
const DENS=[[/icing sugar/,120],[/brown sugar/,220],[/sugar/,200],[/semolina/,170],[/flour/,125],[/cocoa/,85],[/bulgur/,160],[/\brice\b/,190],[/lentil/,190],[/chickpea|beans/,190],[/ground (walnut|almond|pistach)|walnuts?, (ground|finely)/,100],[/walnut|pistachio|almond|hazelnut/,115],[/pine nut/,135],[/coconut/,85],[/butter/,227],[/yogh?urt|kefir/,245],[/sour cream|smetana|crème fraîche/,240],[/mascarpone|cream cheese/,230],[/tvorog|cottage|ricotta/,225],[/feta|white cheese|sirene/,150],[/kashk/,250],[/parmigiano|parmesan|pecorino|kefalotyri|kaşar|cheddar|sulguni|cheese/,100],[/honey|molasses/,340],[/breadcrumb/,110],[/chocolate/,170],[/\bpeas\b/,145],[/raisin|barberr|cranberr/,150],[/mayonnaise/,230],[/tahini/,240]];
function conv(q,u,en){if(prefs.units==='metric'||!q||!/^(g|kg|ml|l)$/.test(u))return null;let ml;const n=(en||'').toLowerCase();
  if(u==='ml')ml=q;else if(u==='l')ml=q*1000;else{const g=u==='kg'?q*1000:q,d=DENS.find(x=>x[0].test(n));if(!d)return null;ml=g/d[1]*240}
  const cup=prefs.units==='us'?240:200,c=ml/cup;if(c>=.25)return[fmtNum(c),'cup',c];const tb=ml/15;if(tb>=1)return[fmtNum(tb),'tbsp',tb];return[fmtNum(Math.max(ml/5,.25)),'tsp',ml/5]}
function uLabel(u,num){if(!u)return'';const plural=parseFloat(num)>1||/\d[½¼¾⅓⅔]/.test(num);
  if(u==='cup'){if(prefs.units==='tr')return tr()?'su bardağı':'Turkish cup'+(plural?'s':'');return tr()?'bardak (240 ml)':'cup'+(plural?'s':'')}
  if(tr())return((I18N.measure||{})[u])||u;return u}
function amount(q,u,en){const c=conv(q,u,en)||fmtQ(q,u);return(c[0]+(c[0]&&c[1]?' '+uLabel(c[1],c[0]):'')).trim()}
function line(r,x,k){const i=r.ing[x];return{q:amount(i[0]*k,i[1],i[2]),n:rIng(r,x)}}

/* ---------- substitutions ---------- */
function subsFor(r,i,k){const name=i[2].toLowerCase(),q=i[0]*k,u=i[1];
  const A=(m,u2)=>{if(!q)return m===1?'the same amount of':'some';const[tt,uu]=fmtQ(q*m,u2===undefined?u:u2);return(tt+(uu?' '+uu:'')).trim()};
  let out=[];const own=r.subs||{};for(const key in own)if(name.includes(key.toLowerCase()))out=out.concat(own[key]);
  const hit=SUBS.find(s=>s[0].test(name));if(hit)out=out.concat(hit[1](A));
  return out.map(x=>x[0].toUpperCase()+x.slice(1))}
const swapsOf=r=>swaps[r.id]||(swaps[r.id]={});
const optsFor=(r,i,k)=>subsFor(r,i,k).concat([t('Leave it out.')]);
function ingLines(r,k){const M=swapsOf(r);return r.ing.map((i,x)=>{if(typeof i==='string')return{head:rIng(r,x).replace(/^#\s*/,'')};const l=line(r,x,k),w=(l.q?l.q+' ':'')+l.n,m=M[x];
  if(m==null)return{text:w};if(m===-1)return{text:w+' ('+t('missing')+')'};const o=optsFor(r,i,k)[m];return{text:o?o+' ('+t('instead of {x}',{x:w})+')':w,swapped:true}})}
const linesText=ls=>ls.map(l=>l.head!=null?'\n'+l.head:'- '+l.text).join('\n');

/* ---------- diets ---------- */
const MEAT=/\b(beef|lamb|pork|chicken|veal|mince|minced|guanciale|pancetta|prosciutto|sausage|sucuk|bacon|ham|salmon|fish|anchov\w*|caviar|gelatine|meat|bones?|ribs|escalopes)\b/;
const ANIMAL=/\b(eggs?|yolks?|butter|milk|cream|cheese|yogh?urt|kashk|honey|mascarpone|mozzarella|feta|parmigiano|parmesan|pecorino|ricotta|tvorog|kefalotyri|kaşar|cheddar|sulguni|sirene|kaymak|mayonnaise|smetana|savoiardi|ganache|ghee)\b/;
const GLUTEN=/\b(flour|semolina|bulgur|pasta|spaghetti|linguine|trofie|tonnarelli|rigatoni|bucatini|lasagne|ditalini|orzo|şehriye|vermicelli|noodles|reshteh|bread|breadcrumbs|biscuits?|savoiardi|filo|yufka|couscous|pitta|pita|lavash|ciabatta|sourdough|digestive|barley|wheat|dough|lepinja|simit|dumpling)\b/;
const OPT=/optional|, to serve|, to finish|, to garnish|, to decorate|^[^,]*\bto serve\b/;
const SERVE_HEAD=/serve|garnish/i;
// An ingredient only counts as meat/dairy/gluten-free-breaking if no " or " alternative avoids it.
const ALT={meat:/\b(water|vegetable|veg)\b/,animal:/\b(oil|margarine|plant|vegetable|water|syrup)\b/,gluten:/\b(rice|corn|potato|gluten-free)\b/};
const dietCache={};
function diet(r){if(!r.mine&&dietCache[r.id])return dietCache[r.id];let veg=true,vegan=true,gf=true,serve=false;
  for(const i of r.ing){if(typeof i==='string'){serve=SERVE_HEAD.test(i);continue}const n=i[2].toLowerCase();if(serve||OPT.test(n))continue;const m=n.replace(/rice flour|cornflour|corn flour|potato starch|gluten-free[\w\s-]*/g,''),parts=m.split(/\bor\b|\//);
    const hits=(re,alt)=>re.test(m)&&!parts.some(p=>!re.test(p)&&alt.test(p));if(hits(MEAT,ALT.meat))veg=false;if(hits(ANIMAL,ALT.animal))vegan=false;if(hits(GLUTEN,ALT.gluten))gf=false}
  const o=Object.assign({veg,vegan:veg&&vegan,gf,quick:r.time<=30},r.diet||{});if(!r.mine)dietCache[r.id]=o;return o}

/* ---------- pantry matching ---------- */
const PITEMS=(PAN.items||[]).map(p=>({k:p[0],en:p[1],tr:p[2],sec:p[3],re:new RegExp(p[4],'i')}));
const PBY=Object.fromEntries(PITEMS.map(p=>[p.k,p]));
const pLabel=p=>tr()?p.tr:p.en;
const secLabel=s=>{const x=(PAN.sections||[]).find(z=>z[0]===s);return x?(tr()?x[2]:x[1]):s};
const pmCache={};
function pantryMap(en){const n=en.toLowerCase();if(n in pmCache)return pmCache[n];return pmCache[n]=PITEMS.find(p=>p.re.test(n))||null}
const cleanName=s=>String(s).split(/[,(]/)[0].trim();
const needCache={};
function needs(r){if(!r.mine&&needCache[r.id])return needCache[r.id];const out=[],seen=new Set();
  r.ing.forEach((i,x)=>{if(typeof i==='string')return;const n=i[2].toLowerCase();if(OPT.test(n))return;const p=pantryMap(n);if(p&&p.sec==='basic')return;
    const k=p?p.k:'x:'+cleanName(n);if(seen.has(k))return;seen.add(k);out.push({k,x,p})});
  if(!r.mine)needCache[r.id]=out;return out}

/* ---------- filters and recipe list ---------- */
const sortR=(a,b)=>(CO[a.course]-CO[b.course])||((CUIS.indexOf(a.origin)+1||99)-(CUIS.indexOf(b.origin)+1||99))||rName(a).localeCompare(rName(b));
const fold=s=>String(s).toLocaleLowerCase('tr').replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function searchText(r){return fold([r.name,r.local,rName(r),rLocal(r),r.origin,t(r.origin),CL[r.course],t(CL[r.course])].concat(r.ing.map((i,x)=>typeof i==='string'?i:i[2]+' '+rIng(r,x))).join(' '))}
function vis(){const q=fold(st.q.trim());return all().filter(r=>(st.cui==='all'||(st.cui==='saved'?fav.has(r.id):st.cui==='mine'?r.mine:r.origin===st.cui))&&(!st.course||r.course===st.course)&&[...st.diet].every(d=>diet(r)[d])&&(!q||searchText(r).includes(q))).sort(sortR)}
function renderChips(){const n={};all().forEach(r=>n[r.origin]=(n[r.origin]||0)+1);
  const orgs=Object.keys(n).sort((a,b)=>((CUIS.indexOf(a)+1||99)-(CUIS.indexOf(b)+1||99))||n[b]-n[a]);
  if(!['all','saved','mine'].includes(st.cui)&&!n[st.cui])st.cui='all';
  const chip=(k,l,c)=>`<button class="chip" type="button" data-cui="${esc(k)}" aria-pressed="${st.cui===k}">${esc(l)}${c?`<span>${c}</span>`:''}</button>`;
  $('#chips').innerHTML=chip('all',t('All'),all().length)+orgs.map(o=>chip(o,cName(o),n[o])).join('')+chip('saved',t('Saved'),fav.size)+(mine.length?chip('mine',t('Mine'),mine.length):'')+`<button class="chip" type="button" data-surprise="1">${esc(t('Surprise me'))}</button>`+
  `<label class="sr" for="course">${t('Course')}</label><select id="course"><option value="">${t('Every course')}</option>${COURSES.map(c=>`<option value="${c[0]}"${c[0]===st.course?' selected':''}>${esc(t(c[1]))}</option>`).join('')}</select>`+
  `<span class="diets" role="group" aria-label="${esc(t('Diet'))}">${DIETS.map(d=>`<button class="chip sm" type="button" data-diet="${d[0]}" aria-pressed="${st.diet.has(d[0])}">${esc(t(d[1]))}</button>`).join('')}</span>`}
function coverImg(r){const c=covers[r.id];return c&&coverData[r.id]?`<img src="${esc(coverData[r.id])}" alt="">`:''}
function card(r,extra){return`<a class="item" href="#${esc(r.id)}" style="--tint:${hexOk(r.tint)}" aria-current="${r.id===cur&&st.view==='recipes'}"><span class="pic">${coverImg(r)||art(r)}</span><span><b>${esc(rName(r))}${fav.has(r.id)?' <span class="heart" aria-label="'+esc(t('Saved'))+'">♥</span>':''}</b><small>${esc(cName(r.origin))} · ${fmtT(r.time)}</small>${extra||''}</span></a>`}
function renderItems(){const v=vis(),n=all().length;
  $('#count').textContent=v.length===n?t('{n} recipes',{n}):t('{a} of {b} recipes',{a:v.length,b:n});
  if(!v.length){$('#items').innerHTML=`<div class="empty">${t('Nothing matches that. Try another word or show everything.')}<br><button type="button" id="clear">${t('Clear search and filters')}</button></div>`;return}
  let h='',last='';for(const r of v){if(r.course!==last){last=r.course;h+=`<p class="gh">${esc(t(CL[r.course]))} <span>${v.filter(x=>x.course===last).length}</span></p>`}h+=card(r)}
  $('#items').innerHTML=h}

/* ---------- recipe detail ---------- */
const heartSvg=on=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 6a5 5 0 0 1 9.2 5C19 15.6 12 20 12 20z" fill="${on?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
const scaleNote=(r,n)=>n!==r.serves?t('Scaled from {n}. Tin and pan sizes stay the same; adjust by eye.',{n:r.serves}):t('Tap − and + to scale every amount. Missing something? Tap Swap for what to use instead.');
function ingHtml(r){const n=st.sv[r.id]||r.serves,k=n/r.serves,M=swapsOf(r);
  return r.ing.map((i,x)=>{if(typeof i==='string')return`<li class="grp">${esc(rIng(r,x).replace(/^#\s*/,''))}</li>`;
    const l=line(r,x,k),m=M[x],opts=optsFor(r,i,k),was=(l.q?l.q+' ':'')+l.n;
    if(m==null)return`<li><div class="row"><label><input type="checkbox" id="i-${x}"><span class="q">${esc(l.q)}</span><span>${esc(l.n)}</span></label><button type="button" class="sw" data-act="swap" data-i="${x}" aria-label="${esc(t('I don’t have {x}',{x:l.n}))}">${t('Swap')}</button></div></li>`;
    if(m>=0&&opts[m])return`<li class="swapped"><div class="row"><label><input type="checkbox" id="i-${x}"><span class="q">↻</span><span>${esc(opts[m])}<small class="was">${esc(t('instead of {x}',{x:was}))}</small></span></label><button type="button" class="sw" data-act="swap" data-i="${x}">${t('Change')}</button></div></li>`;
    return`<li class="missing"><div class="row"><label><input type="checkbox" id="i-${x}" disabled><span class="q">${esc(l.q)}</span><span>${esc(l.n)}</span></label><button type="button" class="sw" data-act="unswap" data-i="${x}">${t('I have it')}</button></div>
      <div class="subs"><p>${opts.length>1?t('Don’t have it? Pick what you’ll use instead:'):t('There’s no good stand-in for this one. If it’s central to the dish it’s worth getting; otherwise:')}</p>${tr()&&opts.length>1?`<p class="hint">${t('Suggestions are in English for now.')}</p>`:''}${opts.map((o,j)=>`<button type="button" class="opt" data-act="pick" data-i="${x}" data-o="${j}">${esc(o)}</button>`).join('')}</div></li>`}).join('')}
function tagsOf(r){const d=diet(r);return[d.vegan?t('Vegan'):d.veg?t('Vegetarian'):'',d.gf?t('Gluten-free'):'',d.quick?t('30 min or less'):''].filter(Boolean)}
function renderDetail(){const r=find(cur),d=$('#detail');if(!r){d.innerHTML='';return}
  const n=st.sv[r.id]||r.serves,on=fav.has(r.id),inPlan=plan.some(p=>p.id===r.id),tags=tagsOf(r),cov=covers[r.id]&&coverData[r.id];
  d.innerHTML=`<button class="back" type="button" data-act="back">← ${t('All recipes')}</button>
  <div class="hero${cov?' photo':''}" style="--tint:${hexOk(r.tint)}">${cov?`<img src="${esc(cov)}" alt="${esc(t('Your photo of {x}',{x:rName(r)}))}">`:art(r,true)}</div>
  <div class="head"><div><h2>${esc(rName(r))}</h2><p class="local">${esc(rLocal(r)?rLocal(r)+' · ':'')}${esc(cName(r.origin))} · ${esc(t(CL[r.course]||''))}</p>${tags.length?`<p class="tags">${tags.map(x=>`<span>${esc(x)}</span>`).join('')}</p>`:''}</div>
  <div class="acts"><button class="butter" type="button" data-act="cook">${t('Start cooking')}</button><button class="ghost" type="button" data-act="fav" aria-pressed="${on}">${heartSvg(on)}${on?t('Saved'):t('Save')}</button><button class="ghost" type="button" data-act="plan" aria-pressed="${inPlan}">${inPlan?t('In your plan'):t('Add to plan')}</button><button class="ghost" type="button" data-act="share">${t('Share')}</button><button class="ghost" type="button" data-act="copy">${t('Copy shopping list')}</button>${r.mine?`<button class="ghost" type="button" data-act="edit">${t('Edit')}</button><button class="ghost" type="button" data-act="del">${t('Delete')}</button>`:''}</div></div>
  ${tr()&&!r.mine&&!full(r)?`<p class="note">${t('This recipe isn’t translated yet, so it is shown in English.')}</p>`:''}
  <dl class="facts"><div><dt>${t('Total time')}</dt><dd>${fmtT(r.time)}</dd></div><div><dt>${t('Hands-on')}</dt><dd>${fmtT(r.active)}</dd></div><div><dt>${t('Level')}</dt><dd>${esc(t(r.level||'—'))}</dd></div><div><dt>${t('Recipe makes')}</dt><dd>${r.serves} ${esc(unitWord(r.unit,r.serves))}</dd></div></dl>
  <div class="cols"><section class="ing" aria-label="${esc(t('Ingredients'))}"><div class="ih"><h3>${t('Ingredients')}</h3><div class="scale"><button type="button" data-act="minus" aria-label="${esc(t('Decrease'))}">−</button><output id="sv" aria-live="polite">${n} ${esc(unitWord(r.unit,n))}</output><button type="button" data-act="plus" aria-label="${esc(t('Increase'))}">+</button></div></div>
  <ul class="ings" id="ings">${ingHtml(r)}</ul><p class="hint" id="cp">${scaleNote(r,n)}</p>${prefs.units!=='metric'?`<p class="hint">${t('Cup amounts are converted from grams and are approximate.')}</p>`:''}</section>
  <section aria-label="${esc(t('Method'))}"><h3>${t('Method')}</h3><ol class="steps">${rSteps(r).map(s=>`<li>${esc(s)}${timeBtns(s,r)}</li>`).join('')}</ol>${rTip(r)?`<p class="tip"><b>${t('Tip.')}</b> ${esc(rTip(r))}</p>`:''}</section></div>
  <section class="mynotes" aria-label="${esc(t('My notes and photos'))}"><h3>${t('My notes and photos')}</h3>
   <label class="sr" for="note">${t('Notes')}</label><textarea id="note" placeholder="${esc(t('How did it go? “Used less sugar, perfect.”'))}">${esc(notes[r.id]||'')}</textarea>
   <div class="photos" id="photos"></div>
   <label class="ghost addph">${t('Add a photo')}<input type="file" accept="image/*" id="photoIn" class="sr"></label></section>`;
  loadPhotos(r.id)}
function timeBtns(s,r){const ts=findTimes(s);return ts.length?`<span class="tbtns">${ts.map(x=>`<button type="button" class="tbtn" data-timer="${x.sec}" data-label="${esc(x.label)}" data-name="${esc(rName(r))}">⏱ ${esc(x.label)}</button>`).join('')}</span>`:''}
function scale(r,dir){const n=Math.max(1,Math.min(500,(st.sv[r.id]||r.serves)+dir));st.sv[r.id]=n;$('#ings').innerHTML=ingHtml(r);$('#sv').textContent=n+' '+unitWord(r.unit,n);$('#cp').textContent=scaleNote(r,n)}
function flash(b,text,back){const o=b.textContent;b.textContent=text;setTimeout(()=>{if(b.isConnected)b.textContent=back||o},1800)}

/* ---------- share ---------- */
async function shareText(title,text,url){
  try{if(navigator.share){await navigator.share(url?{title,text,url}:{title,text});return'shared'}}catch(e){if(e&&e.name==='AbortError')return'cancel'}
  try{await navigator.clipboard.writeText(url?text+'\n\n'+url:text);return'copied'}catch(e){return'fail'}}
function recipeText(r){const n=st.sv[r.id]||r.serves,k=n/r.serves;
  return[rName(r)+(rLocal(r)?' · '+rLocal(r):''),t('Makes {n}',{n:n+' '+unitWord(r.unit,n)})+' · '+fmtT(r.time),'',t('Ingredients').toUpperCase(),linesText(ingLines(r,k)).trim(),'',t('Method').toUpperCase()].concat(rSteps(r).map((s,i)=>(i+1)+'. '+s)).concat(rTip(r)?['',t('Tip.')+' '+rTip(r)]:[]).join('\n')}

/* ---------- photos (IndexedDB) ---------- */
const IDB={p:null,open(){if(!this.p)this.p=new Promise((res,rej)=>{try{const q=indexedDB.open('sofra',1);q.onupgradeneeded=()=>{const s=q.result.createObjectStore('photos',{keyPath:'pid'});s.createIndex('rid','rid')};q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}catch(e){rej(e)}});return this.p},
  async run(mode,fn){const db=await this.open();return new Promise((res,rej)=>{const x=db.transaction('photos',mode),s=x.objectStore('photos');let out;const q=fn(s);if(q)q.onsuccess=()=>{out=q.result};x.oncomplete=()=>res(out);x.onerror=()=>rej(x.error);x.onabort=()=>rej(x.error)})},
  put(p){return this.run('readwrite',s=>s.put(p))},del(pid){return this.run('readwrite',s=>s.delete(pid))},clear(){return this.run('readwrite',s=>s.clear())},
  byRecipe(rid){return this.run('readonly',s=>s.index('rid').getAll(rid))},all(){return this.run('readonly',s=>s.getAll())},get(pid){return this.run('readonly',s=>s.get(pid))}};
const coverData={};
async function loadCovers(){for(const rid of Object.keys(covers)){try{const p=await IDB.get(covers[rid]);if(p&&okImg(p.data))coverData[rid]=p.data;else delete covers[rid]}catch(e){}}renderItems();if(st.view==='recipes')renderDetail()}
const okImg=s=>typeof s==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s)&&s.length<6e6;
let photoList=[];
async function loadPhotos(rid){const box=$('#photos');if(!box)return;let ps=[];try{ps=await IDB.byRecipe(rid)}catch(e){box.innerHTML=`<p class="hint">${t('Photos can’t be saved in this browser.')}</p>`;return}
  if(rid!==cur||!$('#photos'))return;photoList=ps.filter(p=>okImg(p.data)).sort((a,b)=>b.date-a.date);
  box.innerHTML=photoList.map(p=>`<button type="button" class="ph" data-pid="${esc(p.pid)}" aria-label="${esc(t('Open photo'))}"><img src="${esc(p.data)}" alt="">${covers[rid]===p.pid?`<span>${t('Cover')}</span>`:''}</button>`).join('')}
function resizeImage(file){return new Promise((res,rej)=>{const fr=new FileReader();fr.onerror=()=>rej(fr.error);fr.onload=()=>{const im=new Image();im.onerror=()=>rej(new Error('image'));im.onload=()=>{const M=1280,s=Math.min(1,M/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.82))};im.src=fr.result};fr.readAsDataURL(file)})}
async function addPhoto(file,rid){try{const data=await resizeImage(file);const p={pid:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),rid,data,date:Date.now()};await IDB.put(p);if(!covers[rid]){covers[rid]=p.pid;coverData[rid]=data;save.covers();renderItems();renderDetail()}else loadPhotos(rid)}catch(e){alertBox(t('That photo couldn’t be added.'))}}
const pdlg=$('#photoDlg');let openPid=null;
function openPhoto(pid){const p=photoList.find(x=>x.pid===pid);if(!p)return;openPid=pid;const isCov=covers[p.rid]===pid;
  $('#photoBody').innerHTML=`<img src="${esc(p.data)}" alt=""><div class="row"><button type="button" class="ghost" data-ph="cover">${isCov?t('Stop using as cover'):t('Use as cover')}</button><button type="button" class="ghost" data-ph="del">${t('Delete photo')}</button><button type="button" class="butter" data-ph="close">${t('Close')}</button></div>`;
  if(pdlg.showModal)pdlg.showModal();else pdlg.setAttribute('open','')}
const closeP=()=>pdlg.close?pdlg.close():pdlg.removeAttribute('open');
pdlg.addEventListener('click',async e=>{const b=e.target.closest('[data-ph]');if(!b){if(e.target===pdlg)closeP();return}const p=photoList.find(x=>x.pid===openPid);if(!p)return closeP();
  if(b.dataset.ph==='close')closeP();
  else if(b.dataset.ph==='cover'){if(covers[p.rid]===p.pid){delete covers[p.rid];delete coverData[p.rid]}else{covers[p.rid]=p.pid;coverData[p.rid]=p.data}save.covers();closeP();renderItems();renderDetail()}
  else if(b.dataset.ph==='del'){if(!b.dataset.arm){b.dataset.arm='1';b.textContent=t('Tap again to delete');return}await IDB.del(p.pid).catch(()=>{});if(covers[p.rid]===p.pid){delete covers[p.rid];delete coverData[p.rid];save.covers()}closeP();renderItems();renderDetail()}});
function alertBox(msg){const a=$('#toast');a.textContent=msg;a.hidden=false;clearTimeout(alertBox.t);alertBox.t=setTimeout(()=>{a.hidden=true},3500)}

/* ---------- timers ---------- */
const NUM='(\\d+(?:[.,]\\d+)?\\s*[½¼¾]?|[½¼¾])';
const TIME_RE=new RegExp(NUM+'(?:\\s*[–-]\\s*'+NUM+')?\\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?|saat|dakika|dk|saniye|sn)(?![a-zçğıöşü])','gi');
function pnum(s){s=s.replace(',','.').replace(/\s/g,'');const fr={'½':.5,'¼':.25,'¾':.75};const m=s.match(/^(\d*(?:\.\d+)?)([½¼¾])?$/);if(!m)return parseFloat(s)||0;return(parseFloat(m[1])||0)+(m[2]?fr[m[2]]:0)}
function findTimes(text){const out=[];let m;TIME_RE.lastIndex=0;while((m=TIME_RE.exec(text))){const v=pnum(m[1]),u=m[3].toLowerCase(),mult=/^(h|saat)/.test(u)?3600:/^(sec|saniye|sn)/.test(u)?1:60,sec=Math.round(v*mult);if(sec>=10&&sec<=43200&&!out.some(o=>o.sec===sec))out.push({sec,label:fmtDur(sec)})}return out}
let actx=null;
function unlockAudio(){try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume()}catch(e){actx=null}}
function beep(){if(!actx)return;try{const now=actx.currentTime;for(let i=0;i<3;i++){const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=i===2?1175:880;o.connect(g);g.connect(actx.destination);const s=now+i*.28;g.gain.setValueAtTime(.0001,s);g.gain.exponentialRampToValueAtTime(.35,s+.02);g.gain.exponentialRampToValueAtTime(.0001,s+.22);o.start(s);o.stop(s+.24)}}catch(e){}}
function startTimer(sec,label,name){unlockAudio();timers.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),label,name,ends:Date.now()+sec*1000,rang:false});save.timers();
  if(!prefs.notifAsked&&'Notification' in window&&Notification.permission==='default'){prefs.notifAsked=true;save.prefs();try{Notification.requestPermission().catch(()=>{})}catch(e){}}
  renderTimers();tick()}
function notify(x){try{if(!('Notification' in window)||Notification.permission!=='granted')return;const body=t('{x} timer is done',{x:x.label})+(x.name?' · '+x.name:'');if(navigator.serviceWorker&&navigator.serviceWorker.controller)navigator.serviceWorker.ready.then(reg=>reg.showNotification('Sofra',{body,tag:x.id,icon:'icons/icon-192.png'})).catch(()=>{});else new Notification('Sofra',{body,tag:x.id})}catch(e){}}
const clock=ms=>{const s=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),z=s%60;return(h?h+':'+String(m).padStart(2,'0'):m)+':'+String(z).padStart(2,'0')};
function renderTimers(){const box=$('#timers');if(!timers.length){box.hidden=true;box.innerHTML='';return}box.hidden=false;const now=Date.now();
  box.innerHTML=timers.map(x=>{const done=x.ends<=now;return`<div class="tmr${done?' ring':''}" data-id="${esc(x.id)}"><div><b>${done?t('Time’s up!'):clock(x.ends-now)}</b><small>${esc(x.label)}${x.name?' · '+esc(x.name):''}</small></div>${done?`<button type="button" class="butter" data-tm="stop">${t('Stop')}</button>`:`<button type="button" class="ghost" data-tm="add">+1 ${tr()?'dk':'min'}</button><button type="button" class="ghost" data-tm="stop" aria-label="${esc(t('Cancel timer'))}">✕</button>`}</div>`}).join('')}
let tickT=null;
function tick(){clearInterval(tickT);if(!timers.length)return;tickT=setInterval(()=>{const now=Date.now();let ringing=false,changed=false;
  timers.forEach(x=>{if(x.ends<=now){ringing=true;if(!x.rang){x.rang=true;changed=true;notify(x);try{navigator.vibrate&&navigator.vibrate([400,200,400,200,400])}catch(e){}}}});
  if(changed)save.timers();if(ringing&&Math.floor(now/1000)%2===0)beep();
  const box=$('#timers');timers.forEach(x=>{const el=box.querySelector(`[data-id="${CSS.escape(x.id)}"] b`);if(!el)return;if(x.ends<=now&&!el.closest('.ring'))renderTimers();else if(x.ends>now)el.textContent=clock(x.ends-now)});
  if(!timers.length)clearInterval(tickT)},1000)}
$('#timers').addEventListener('click',e=>{const b=e.target.closest('[data-tm]');if(!b)return;const id=b.closest('.tmr').dataset.id,x=timers.find(z=>z.id===id);if(!x)return;
  if(b.dataset.tm==='stop')timers=timers.filter(z=>z.id!==id);else{x.ends=Math.max(x.ends,Date.now())+60000;x.rang=false}save.timers();renderTimers();tick()});
document.addEventListener('click',e=>{const b=e.target.closest('[data-timer]');if(!b)return;e.preventDefault();e.stopPropagation();startTimer(+b.dataset.timer,b.dataset.label,b.dataset.name);flash(b,t('Timer started'))},true);

/* ---------- cook mode ---------- */
const cook={r:null,i:0,ings:false,lock:null,x0:null};
async function lockScreen(){try{if('wakeLock' in navigator&&document.visibilityState==='visible'){cook.lock=await navigator.wakeLock.request('screen');cook.lock.addEventListener('release',()=>{cook.lock=null})}}catch(e){cook.lock=null}}
function openCook(r){cook.r=r;cook.i=0;cook.ings=false;const c=$('#cook');c.hidden=false;document.body.classList.add('cooking');renderCook();lockScreen();c.focus()}
function closeCook(){$('#cook').hidden=true;document.body.classList.remove('cooking');cook.r=null;try{cook.lock&&cook.lock.release()}catch(e){}cook.lock=null}
document.addEventListener('visibilitychange',()=>{if(cook.r&&document.visibilityState==='visible'&&!cook.lock)lockScreen()});
function renderCook(){const r=cook.r;if(!r)return;const S=rSteps(r),i=cook.i,n=st.sv[r.id]||r.serves,k=n/r.serves,ts=findTimes(S[i]);
  $('#cook').innerHTML=`<div class="ck-top"><button type="button" class="ck-x" data-ck="close" aria-label="${esc(t('Close cook mode'))}">✕</button><div class="ck-t"><b>${esc(rName(r))}</b><span>${t('Step {a} of {b}',{a:i+1,b:S.length})} · ${n} ${esc(unitWord(r.unit,n))}</span></div><button type="button" class="ghost" data-ck="ings" aria-pressed="${cook.ings}">${t('Ingredients')}</button></div>
  <div class="ck-bar" aria-hidden="true"><span style="width:${((i+1)/S.length*100).toFixed(1)}%"></span></div>
  <div class="ck-body">${cook.ings?`<ul class="ck-ings">${ingLines(r,k).map(l=>l.head!=null?`<li class="grp">${esc(l.head)}</li>`:`<li>${esc(l.text)}</li>`).join('')}</ul>`:''}
   <p class="ck-step" aria-live="polite">${esc(S[i])}</p>
   ${ts.length?`<div class="ck-timers">${ts.map(x=>`<button type="button" class="butter" data-timer="${x.sec}" data-label="${esc(x.label)}" data-name="${esc(rName(r))}">⏱ ${t('Start a {x} timer',{x:esc(x.label)})}</button>`).join('')}</div>`:''}
   ${i===S.length-1&&rTip(r)?`<p class="tip"><b>${t('Tip.')}</b> ${esc(rTip(r))}</p>`:''}</div>
  <div class="ck-nav"><button type="button" class="ghost big" data-ck="prev"${i===0?' disabled':''}>← ${t('Back')}</button>${i<S.length-1?`<button type="button" class="butter big" data-ck="next">${t('Next step')} →</button>`:`<button type="button" class="butter big" data-ck="close">${t('Done. Enjoy!')}</button>`}</div>
  ${'wakeLock' in navigator?'':`<p class="ck-hint">${t('This browser can’t keep the screen on. Turn off auto-lock while you cook.')}</p>`}`}
function cookGo(d){const S=rSteps(cook.r);cook.i=Math.max(0,Math.min(S.length-1,cook.i+d));renderCook()}
$('#cook').addEventListener('click',e=>{const b=e.target.closest('[data-ck]');if(!b)return;const a=b.dataset.ck;if(a==='close')closeCook();else if(a==='next')cookGo(1);else if(a==='prev')cookGo(-1);else if(a==='ings'){cook.ings=!cook.ings;renderCook()}});
$('#cook').addEventListener('keydown',e=>{if(e.key==='Escape')closeCook();else if(e.key==='ArrowRight')cookGo(1);else if(e.key==='ArrowLeft')cookGo(-1)});
$('#cook').addEventListener('touchstart',e=>{cook.x0=e.touches[0].clientX;cook.y0=e.touches[0].clientY},{passive:true});
$('#cook').addEventListener('touchend',e=>{if(cook.x0==null)return;const dx=e.changedTouches[0].clientX-cook.x0,dy=e.changedTouches[0].clientY-cook.y0;cook.x0=null;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5)cookGo(dx<0?1:-1)});

/* ---------- pantry view ---------- */
const BASICS=['flour','sugar','eggs','butter','milk','oil','oliveoil','onion','garlic','tomatopaste','lemon','rice','pasta','yogurt'];
function usedItems(){const used=new Map();all().forEach(r=>needs(r).forEach(n=>{if(n.p)used.set(n.k,(used.get(n.k)||0)+1)}));return used}
function matchRecipes(){const res=[];for(const r of all()){const ns=needs(r);if(!ns.length)continue;const miss=[];let score=0;
  for(const n of ns){if(n.p&&pantry.has(n.k))continue;const i=r.ing[n.x],can=subsFor(r,i,1).length>0;miss.push({name:n.p?pLabel(n.p):cleanName(rIng(r,n.x)),can});score+=can?.5:1}
  res.push({r,miss,score,have:ns.length-miss.length,total:ns.length})}
  return res.sort((a,b)=>a.score-b.score||b.have-a.have||sortR(a.r,b.r))}
function renderPantry(){const used=usedItems(),q=st.pq.trim().toLowerCase();
  const secs=(PAN.sections||[]).filter(s=>s[0]!=='basic').map(s=>{const its=PITEMS.filter(p=>p.sec===s[0]&&used.has(p.k)&&(!q||p.en.toLowerCase().includes(q)||p.tr.toLowerCase().includes(q)));return its.length?`<h3>${esc(secLabel(s[0]))}</h3><div class="pchips">${its.map(p=>`<button type="button" class="pchip" data-pk="${p.k}" aria-pressed="${pantry.has(p.k)}">${esc(pLabel(p))}</button>`).join('')}</div>`:''}).join('');
  let out='';if(!pantry.size)out=`<p class="empty">${t('Tick a few things you have, or tap “Add the basics”, to see what you can make.')}</p>`;
  else{const m=matchRecipes(),groups=[[0,t('Ready to cook')],[1,t('Missing one thing')],[2,t('Missing two things')],[3,t('Missing three things')]];
    out=groups.map(([g,label])=>{const list=m.filter(x=>x.miss.length===g);if(!list.length)return'';const shown=list.slice(0,g===0?60:24);
      return`<p class="gh">${esc(label)} <span>${list.length}</span></p><div class="items">${shown.map(x=>card(x.r,x.miss.length?`<small class="miss">${x.miss.map(z=>esc(z.name)+(z.can?' <em>'+t('can swap')+'</em>':'')).join(', ')}</small>`:`<small class="ok">${t('You have everything')}</small>`)).join('')}</div>`}).join('')||`<p class="empty">${t('Nothing is close yet. Tick a few more things.')}</p>`}
  $('#view').innerHTML=`<div class="pv"><section class="pv-left"><h2>${t('What can I make?')}</h2><p class="lead">${t('Tick what’s in your kitchen. Salt, pepper and water are taken for granted.')}</p>
   <div class="pv-tools"><label class="sr" for="pq">${t('Find an ingredient')}</label><input id="pq" type="search" value="${esc(st.pq)}" placeholder="${esc(t('Find an ingredient'))}"><button type="button" class="ghost" data-pa="basics">${t('Add the basics')}</button><button type="button" class="ghost" data-pa="clear"${pantry.size?'':' disabled'}>${t('Clear all')}</button></div>
   <p class="hint">${t('{n} ticked',{n:pantry.size})}</p>${secs}</section>
   <section class="pv-right" aria-live="polite"><h2>${t('You can make')}</h2>${out}</section></div>`}

/* ---------- plan and shopping list ---------- */
const famOf=u=>u==='g'||u==='kg'?'g':u==='ml'||u==='l'?'ml':u==='tsp'||u==='tbsp'?'tsp':'n';
const toBase=(q,u)=>u==='kg'||u==='l'?q*1000:u==='tbsp'?q*3:q;
function fmtBase(q,fam,en){if(fam==='g')return q>=1000?amount(q/1000,'kg',en):amount(q,'g',en);if(fam==='ml')return q>=1000?amount(q/1000,'l',en):amount(q,'ml',en);
  if(fam==='tsp')return q>=3&&Math.abs(q/3-Math.round(q/3*4)/4)<.01?amount(q/3,'tbsp',en):amount(q,'tsp',en);return fmtNum(q)}
const keyOf=s=>s.toLowerCase().replace(/\b(large|small|medium|ripe|fresh|very|finely|thinly|hot|warm|cold|soft|softened|melted)\b/g,'').replace(/(\w)s\b/g,'$1').replace(/\s+/g,' ').trim();
function shopList(){const items=new Map(),swapped=[];
  for(const p of plan){const r=find(p.id);if(!r)continue;const k=(p.sv||r.serves)/r.serves,sw=swapsOf(r);
    r.ing.forEach((i,x)=>{if(typeof i==='string')return;const en=i[2],pm=pantryMap(en);if(pm&&pm.sec==='basic')return;
      if(sw[x]!=null&&sw[x]>=0){const os=optsFor(r,i,k);if(sw[x]<os.length-1)swapped.push({text:os[sw[x]],r:rName(r)});return}
      const disp=cleanName(rIng(r,x)),fam=famOf(i[1]),key=keyOf(cleanName(en))+'|'+(i[0]?fam:'-');
      if(!items.has(key))items.set(key,{key,name:disp,en,fam,q:0,loose:!i[0],sec:pm?pm.sec:'other',pk:pm&&pm.k,rs:new Set()});
      const it=items.get(key);if(i[0])it.q+=toBase(i[0]*k,i[1]);it.rs.add(rName(r))})}
  return{items:[...items.values()],swapped}}
function renderPlan(){const days=DAYS.map(([d,l])=>{const es=plan.map((p,ix)=>({p,ix})).filter(o=>(o.p.day||'')===d);if(!es.length)return'';
    return`<p class="gh">${esc(t(l))}</p>${es.map(({p,ix})=>{const r=find(p.id);if(!r)return'';const n=p.sv||r.serves;
      return`<div class="pl" style="--tint:${hexOk(r.tint)}"><a class="pic" href="#${esc(r.id)}">${coverImg(r)||art(r)}</a><div class="pl-m"><a href="#${esc(r.id)}"><b>${esc(rName(r))}</b></a>
       <div class="pl-c"><div class="scale"><button type="button" data-pl="minus" data-ix="${ix}" aria-label="${esc(t('Decrease'))}">−</button><output>${n} ${esc(unitWord(r.unit,n))}</output><button type="button" data-pl="plus" data-ix="${ix}" aria-label="${esc(t('Increase'))}">+</button></div>
       <label class="sr" for="day-${ix}">${t('Day')}</label><select id="day-${ix}" data-pl="day" data-ix="${ix}">${DAYS.map(([v,dl])=>`<option value="${v}"${v===(p.day||'')?' selected':''}>${esc(t(dl))}</option>`).join('')}</select>
       <button type="button" class="ghost" data-pl="remove" data-ix="${ix}">${t('Remove')}</button></div></div></div>`}).join('')}`}).join('');
  const {items,swapped}=shopList(),secs=PAN.sections||[];
  const have=st.pskip?items.filter(i=>i.pk&&pantry.has(i.pk)):[],need=items.filter(i=>!have.includes(i));
  const row=i=>{const amt=i.loose?'':fmtBase(i.q,i.fam,i.en);return`<li><label><input type="checkbox" data-shop="${esc(i.key)}"${shopDone.has(i.key)?' checked':''}><span class="q">${esc(amt)}</span><span>${esc(i.name)}<small>${esc([...i.rs].join(', '))}</small></span></label></li>`};
  const grouped=secs.concat([['other','Other','Diğer']]).map(s=>{const g=need.filter(i=>i.sec===s[0]).sort((a,b)=>a.name.localeCompare(b.name));return g.length?`<li class="grp">${esc(secLabel(s[0])==='other'?t('Other'):secLabel(s[0]))}</li>${g.map(row).join('')}`:''}).join('');
  $('#view').innerHTML=`<div class="plv"><section class="plv-left"><h2>${t('Your week')}</h2>${plan.length?days:`<p class="empty">${t('Your plan is empty. Open any recipe and tap “Add to plan”.')}</p>`}</section>
   <section class="shop"><div class="shop-h"><h2>${t('Shopping list')}</h2>${plan.length?`<div class="acts"><button type="button" class="ghost" data-pl="share">${t('Share list')}</button><button type="button" class="ghost" data-pl="untick"${shopDone.size?'':' disabled'}>${t('Untick all')}</button></div>`:''}</div>
   ${plan.length?`<label class="skip"><input type="checkbox" id="pskip"${st.pskip?' checked':''}> ${t('Leave out what’s ticked in my pantry')}</label>
   <ul class="ings shopl">${grouped||`<li class="hint">${t('Nothing to buy.')}</li>`}</ul>
   ${swapped.length?`<p class="gh">${t('Your swaps')}</p><ul class="ings shopl">${swapped.map(s=>`<li><span>${esc(s.text)} <small>${esc(s.r)}</small></span></li>`).join('')}</ul>`:''}
   ${have.length?`<details><summary>${t('Already in your pantry ({n})',{n:have.length})}</summary><ul class="ings shopl">${have.map(row).join('')}</ul></details>`:''}
   <p class="hint">${t('Amounts are added up across your recipes. Items without an amount are “to taste”.')}</p>`:`<p class="hint">${t('Add recipes to your plan and their ingredients are listed here, added together.')}</p>`}</section></div>`}
function shopText(){const{items,swapped}=shopList();const have=st.pskip?items.filter(i=>i.pk&&pantry.has(i.pk)):[];const lines=[t('Shopping list')+' · Sofra'];
  items.filter(i=>!have.includes(i)&&!shopDone.has(i.key)).forEach(i=>lines.push('- '+((i.loose?'':fmtBase(i.q,i.fam,i.en)+' ')+i.name)));swapped.forEach(s=>lines.push('- '+s.text));return lines.join('\n')}

/* ---------- more view: settings and backup ---------- */
function renderMore(){const L=(v,l)=>`<button type="button" class="chip-l" data-pref="lang" data-v="${v}" aria-pressed="${prefs.lang===v}">${l}</button>`,U=(v,l)=>`<button type="button" class="chip-l" data-pref="units" data-v="${v}" aria-pressed="${prefs.units===v}">${esc(t(l))}</button>`;
  const pi=st.pendingImport;
  $('#view').innerHTML=`<div class="more"><section><h2>${t('Language')}</h2><div class="seg">${L('en','English')}${L('tr','Türkçe')}</div><p class="hint">${t('Menus switch fully. Recipes from the Turkish kitchen are fully translated; others show their name and description in Turkish and the rest in English for now.')}</p></section>
   <section><h2>${t('Measures')}</h2><div class="seg">${U('metric','Grams & millilitres')}${U('us','US cups')}${U('tr','Turkish su bardağı (200 ml)')}</div><p class="hint">${t('Cup amounts are converted from grams using typical weights and are approximate. Spoons stay as they are.')}</p></section>
   <section><h2>${t('Backup')}</h2><p>${t('Your own recipes, favourites, plan, pantry, swaps, notes and photos live only in this browser. Save a backup file now and then, and restore it on a new phone.')}</p>
    <div class="acts"><button type="button" class="butter" data-bk="export">${t('Save backup file')}</button>${navigator.canShare?`<button type="button" class="ghost" data-bk="share">${t('Share backup file')}</button>`:''}<label class="ghost">${t('Restore from file')}<input type="file" accept="application/json,.json" id="importIn" class="sr"></label></div>
    <p class="hint" id="bkStatus" aria-live="polite"></p>
    ${pi?`<div class="importbox"><p>${t('Backup from {d}: {a} own recipes, {b} favourites, {c} photos, {e} planned meals.',{d:esc(pi.when),a:pi.data.mine.length,b:pi.data.fav.length,c:pi.data.photos.length,e:pi.data.plan.length})}</p><div class="acts"><button type="button" class="butter" data-bk="merge">${t('Add to what’s here')}</button><button type="button" class="ghost" data-bk="replace">${t('Replace everything here')}</button><button type="button" class="ghost" data-bk="cancel">${t('Cancel')}</button></div></div>`:''}</section>
   <section><h2>${t('Put Sofra on your phone')}</h2><p><b>iPhone:</b> ${t('open Sofra in Safari, tap Share, then Add to Home Screen.')}</p><p><b>Android:</b> ${t('open Sofra in Chrome and tap Install app, or ⋮ then Add to Home screen.')}</p><p class="hint">${t('Timers ring while Sofra is open. Phones pause web apps in the background, so keep it on screen for the alarm.')}</p></section>
   <section><h2>${t('About')}</h2><p>${t('{n} recipes from {c} kitchens.',{n:R.length,c:new Set(R.map(r=>r.origin)).size})} <a href="https://github.com/Furkanork/Sofra">GitHub</a></p></section></div>`}
async function makeBackup(){let photos=[];try{photos=(await IDB.all()).filter(p=>okImg(p.data))}catch(e){}
  return{app:'sofra',version:1,created:new Date().toISOString(),mine,fav:[...fav],plan,pantry:[...pantry],notes,covers,swaps,prefs:{lang:prefs.lang,units:prefs.units},photos}}
const bkName=()=>'sofra-backup-'+new Date().toISOString().slice(0,10)+'.json';
async function exportBackup(share){const s=$('#bkStatus');try{const b=await makeBackup(),blob=new Blob([JSON.stringify(b)],{type:'application/json'});
  if(share){const f=new File([blob],bkName(),{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'Sofra backup'});s.textContent=t('Backup shared.');return}}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=bkName();document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);s.textContent=t('Backup saved as {f}.',{f:bkName()})}
  catch(e){if(!(e&&e.name==='AbortError'))s.textContent=t('The backup couldn’t be saved here.')}}
function cleanBackup(b){if(!b||b.app!=='sofra')return null;const str=(v,n)=>typeof v==='string'?v.slice(0,n||2000):'';
  const okIng=i=>typeof i==='string'?str(i,200):Array.isArray(i)&&i.length===3?[Number(i[0])||0,/^(g|kg|ml|l|tsp|tbsp)$/.test(i[1])?i[1]:'',str(i[2],200)]:null;
  const mineC=arr(b.mine).filter(r=>r&&typeof r.id==='string'&&/^my-[a-z0-9-]{1,80}$/.test(r.id)&&typeof r.name==='string').slice(0,500).map(r=>{const look=LOOKS[r.look]?r.look:'cake';return{id:r.id,mine:true,name:str(r.name,80),local:str(r.local,80),origin:str(r.origin,40)||'My kitchen',course:CL[r.course]?r.course:'mains',look,time:Math.max(1,Math.min(10000,+r.time||60)),active:Math.max(1,Math.min(10000,+r.active||20)),serves:Math.max(1,Math.min(500,Math.round(+r.serves)||4)),unit:str(r.unit,20)||'servings',level:'Home recipe',tint:LOOKS[look].tint,art:LOOKS[look].art,ing:arr(r.ing).map(okIng).filter(x=>x!=null).slice(0,200),steps:arr(r.steps).map(s=>str(s,1000)).filter(Boolean).slice(0,100),tip:str(r.tip,240)}}).filter(r=>r.ing.length&&r.steps.length);
  const ids=new Set(R.map(r=>r.id).concat(mineC.map(r=>r.id)));
  const strMap=(o,n)=>Object.fromEntries(Object.entries(obj(o)).filter(([k,v])=>typeof v==='string'&&ids.has(k)).map(([k,v])=>[k,v.slice(0,n)]));
  return{when:str(b.created,30).slice(0,10)||'?',data:{mine:mineC,fav:arr(b.fav).filter(x=>ids.has(x)),plan:arr(b.plan).filter(p=>p&&ids.has(p.id)).map(p=>({id:p.id,sv:Math.max(1,Math.min(500,Math.round(+p.sv)||1)),day:DAYS.some(d=>d[0]===p.day)?p.day:''})),
    pantry:arr(b.pantry).filter(k=>PBY[k]),notes:strMap(b.notes,5000),covers:strMap(b.covers,40),
    swaps:Object.fromEntries(Object.entries(obj(b.swaps)).filter(([k])=>ids.has(k)).map(([k,v])=>[k,Object.fromEntries(Object.entries(obj(v)).filter(([x,o])=>/^\d+$/.test(x)&&Number.isInteger(o)&&o>=-1&&o<20))])),
    prefs:{lang:b.prefs&&b.prefs.lang==='tr'?'tr':'en',units:b.prefs&&['metric','us','tr'].includes(b.prefs.units)?b.prefs.units:'metric'},
    photos:arr(b.photos).filter(p=>p&&typeof p.pid==='string'&&/^[\w-]{1,40}$/.test(p.pid)&&ids.has(p.rid)&&okImg(p.data)).map(p=>({pid:p.pid,rid:p.rid,data:p.data,date:+p.date||Date.now()}))}}}
async function applyImport(mode){const d=st.pendingImport&&st.pendingImport.data;if(!d)return;const s=$('#bkStatus');
  try{if(mode==='replace'){LS.set('sofra-mine',d.mine);LS.set('sofra-fav',d.fav);LS.set('sofra-plan',d.plan);LS.set('sofra-pantry',d.pantry);LS.set('sofra-notes',d.notes);LS.set('sofra-covers',d.covers);LS.set('sofra-swaps',d.swaps);try{await IDB.clear()}catch(e){}}
    else{const m=mine.filter(r=>!d.mine.some(x=>x.id===r.id)).concat(d.mine);LS.set('sofra-mine',m);LS.set('sofra-fav',[...new Set([...fav,...d.fav])]);LS.set('sofra-plan',plan.concat(d.plan.filter(p=>!plan.some(q=>q.id===p.id))));LS.set('sofra-pantry',[...new Set([...pantry,...d.pantry])]);
      LS.set('sofra-notes',Object.assign({},d.notes,notes));LS.set('sofra-covers',Object.assign({},d.covers,covers));LS.set('sofra-swaps',Object.assign({},d.swaps,swaps))}
    for(const p of d.photos){try{await IDB.put(p)}catch(e){}}
    Object.assign(prefs,d.prefs);save.prefs();location.reload()}catch(e){s.textContent=t('That backup couldn’t be restored.')}}

/* ---------- views and routing ---------- */
const VIEWS=['pantry','plan','more'];
function setView(v){st.view=v;document.body.dataset.view=v;$('#main').hidden=v!=='recipes';$('#view').hidden=v==='recipes';$('#chips').hidden=v!=='recipes';
  document.querySelectorAll('#tabs a').forEach(a=>a.setAttribute('aria-current',a.dataset.v===v?'page':'false'));
  const pc=$('#planCount');pc.textContent=plan.length?String(plan.length):'';
  if(v==='pantry')renderPantry();else if(v==='plan')renderPlan();else if(v==='more')renderMore()}
function route(scroll){const id=decodeURIComponent(location.hash.slice(1));
  if(VIEWS.includes(id)){setView(id);if(scroll)window.scrollTo({top:0});return}
  setView('recipes');const r=id&&find(id);
  if(r){cur=r.id;document.body.classList.add('open')}else{document.body.classList.remove('open');if(!cur||!find(cur))cur=(vis()[0]||all().slice().sort(sortR)[0]||{}).id}
  renderItems();renderDetail();
  if(scroll&&innerWidth<900)window.scrollTo({top:r?$('#main').offsetTop:0})}
function applyStatic(){document.documentElement.lang=prefs.lang;
  document.querySelectorAll('[data-t]').forEach(el=>{el.textContent=t(el.dataset.t)});
  document.querySelectorAll('[data-tp]').forEach(el=>{el.placeholder=t(el.dataset.tp)});
  document.querySelectorAll('[data-ta]').forEach(el=>{el.setAttribute('aria-label',t(el.dataset.ta))});
  const fc=$('#f-course');if(fc)fc.innerHTML=COURSES.map(c=>`<option value="${c[0]}">${esc(t(c[1]))}</option>`).join('')}
function rerender(){applyStatic();renderChips();route(false)}

/* ---------- events ---------- */
$('#q').addEventListener('input',e=>{st.q=e.target.value;if(st.view!=='recipes'){setHash('');return}renderItems()});
$('#chips').addEventListener('click',e=>{const b=e.target.closest('[data-cui],[data-diet],[data-surprise]');if(!b)return;if(b.dataset.surprise){const v=vis().filter(r=>r.id!==cur),pool=v.length?v:all();setHash(pool[Math.floor(Math.random()*pool.length)].id);return}if(b.dataset.diet){const d=b.dataset.diet;st.diet.has(d)?st.diet.delete(d):st.diet.add(d)}else st.cui=b.dataset.cui;renderChips();renderItems()});
$('#chips').addEventListener('change',e=>{if(e.target.id==='course'){st.course=e.target.value;renderItems()}});
$('#items').addEventListener('click',e=>{if(e.target.id==='clear'){st.q='';st.cui='all';st.course='';st.diet.clear();$('#q').value='';renderChips();renderItems()}});
let noteT=null;
$('#detail').addEventListener('input',e=>{if(e.target.id!=='note')return;const id=cur,v=e.target.value;clearTimeout(noteT);noteT=setTimeout(()=>{if(v.trim())notes[id]=v.slice(0,5000);else delete notes[id];save.notes()},400)});
$('#detail').addEventListener('change',e=>{if(e.target.id==='photoIn'&&e.target.files&&e.target.files[0]){addPhoto(e.target.files[0],cur);e.target.value=''}});
$('#detail').addEventListener('click',async e=>{const r=find(cur);if(!r)return;
  const ph=e.target.closest('.ph');if(ph){openPhoto(ph.dataset.pid);return}
  const li=e.target.closest('.steps li');if(li&&!e.target.closest('button')){li.classList.toggle('done');return}
  const b=e.target.closest('[data-act]');if(!b)return;const act=b.dataset.act;
  if(act==='back')setHash('');
  else if(act==='cook')openCook(r);
  else if(act==='minus'||act==='plus')scale(r,act==='plus'?1:-1);
  else if(act==='swap'||act==='unswap'||act==='pick'){const M=swapsOf(r),x=+b.dataset.i;if(act==='swap')M[x]=-1;else if(act==='unswap')delete M[x];else M[x]=+b.dataset.o;if(!Object.keys(M).length)delete swaps[r.id];save.swaps();
    $('#ings').innerHTML=ingHtml(r);const f=$('#ings').querySelector('[data-i="'+x+'"]');if(f)f.focus()}
  else if(act==='fav'){fav.has(r.id)?fav.delete(r.id):fav.add(r.id);save.fav();renderChips();renderItems();renderDetail()}
  else if(act==='plan'){const ix=plan.findIndex(p=>p.id===r.id);if(ix>=0)plan.splice(ix,1);else plan.push({id:r.id,sv:st.sv[r.id]||r.serves,day:''});save.plan();$('#planCount').textContent=plan.length?String(plan.length):'';renderDetail()}
  else if(act==='share'){const res=await shareText(rName(r),recipeText(r),location.origin+location.pathname+'#'+r.id);if(res==='copied')flash(b,t('Copied'));else if(res==='fail')flash(b,t('Sharing isn’t available here'))}
  else if(act==='copy'){const k=(st.sv[r.id]||r.serves)/r.serves,txt=rName(r)+'\n'+linesText(ingLines(r,k));try{await navigator.clipboard.writeText(txt);flash(b,t('Copied'))}catch(err){flash(b,t('Copy blocked here'))}}
  else if(act==='edit')openForm(r);
  else if(act==='del'){if(!b.dataset.arm){b.dataset.arm='1';b.textContent=t('Tap again to delete');setTimeout(()=>{if(b.isConnected){delete b.dataset.arm;b.textContent=t('Delete')}},3000);return}
    mine=mine.filter(x=>x.id!==r.id);fav.delete(r.id);plan=plan.filter(p=>p.id!==r.id);save.mine();save.fav();save.plan();cur=null;renderChips();setHash('')}});
$('#view').addEventListener('input',e=>{if(e.target.id==='pq'){st.pq=e.target.value;const pos=e.target.selectionStart;renderPantry();const n=$('#pq');n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}}});
$('#view').addEventListener('change',async e=>{const el=e.target;
  if(el.dataset.pl==='day'){const p=plan[+el.dataset.ix];if(p){p.day=el.value;save.plan();renderPlan()}}
  else if(el.id==='pskip'){st.pskip=el.checked;renderPlan()}
  else if(el.dataset.shop){el.checked?shopDone.add(el.dataset.shop):shopDone.delete(el.dataset.shop);save.shop()}
  else if(el.id==='importIn'&&el.files&&el.files[0]){const s=$('#bkStatus');try{const txt=await el.files[0].text(),c=cleanBackup(JSON.parse(txt));if(!c){s.textContent=t('That file isn’t a Sofra backup.');return}st.pendingImport=c;renderMore()}catch(x){s.textContent=t('That file isn’t a Sofra backup.')}}});
$('#view').addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.pk){const k=b.dataset.pk;pantry.has(k)?pantry.delete(k):pantry.add(k);save.pantry();renderPantry();const nb=$('#view').querySelector(`[data-pk="${k}"]`);if(nb)nb.focus();return}
  if(b.dataset.pa==='basics'){BASICS.forEach(k=>{if(PBY[k])pantry.add(k)});save.pantry();renderPantry();return}
  if(b.dataset.pa==='clear'){pantry.clear();save.pantry();renderPantry();return}
  const pl=b.dataset.pl;if(pl){const ix=+b.dataset.ix,p=plan[ix];
    if(pl==='minus'||pl==='plus'){if(!p)return;const r=find(p.id);p.sv=Math.max(1,Math.min(500,(p.sv||r.serves)+(pl==='plus'?1:-1)));save.plan();renderPlan()}
    else if(pl==='remove'){plan.splice(ix,1);save.plan();setView('plan')}
    else if(pl==='untick'){shopDone.clear();save.shop();renderPlan()}
    else if(pl==='share'){const res=await shareText(t('Shopping list'),shopText());if(res==='copied')flash(b,t('Copied'));else if(res==='fail')flash(b,t('Sharing isn’t available here'))}
    return}
  if(b.dataset.pref){prefs[b.dataset.pref]=b.dataset.v;save.prefs();rerender();return}
  const bk=b.dataset.bk;if(bk==='export')exportBackup(false);else if(bk==='share')exportBackup(true);else if(bk==='cancel'){st.pendingImport=null;renderMore()}else if(bk==='merge'||bk==='replace'){if(bk==='replace'&&!b.dataset.arm){b.dataset.arm='1';b.textContent=t('Tap again: this replaces everything');return}applyImport(bk)}});
window.addEventListener('hashchange',()=>route(true));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&cook.r)closeCook()});

/* ---------- add / edit form ---------- */
const dlg=$('#dlg'),F=id=>$('#f-'+id);
function toText(r){return r.ing.map(i=>typeof i==='string'?i:[i[0]||'',i[1],i[2]].filter(Boolean).join(' ')).join('\n')}
function openForm(r){editing=r?r.id:null;$('#fmTitle').textContent=r?t('Edit recipe'):t('Add a recipe');
  F('name').value=r?r.name:'';F('local').value=r?r.local||'':'';F('origin').value=r?r.origin:'';F('course').value=r?r.course:'mains';F('look').value=r&&LOOKS[r.look]?r.look:'plate';F('serves').value=r?r.serves:4;F('unit').value=r?r.unit:'servings';F('time').value=r?r.time:60;F('active').value=r?r.active:20;F('ing').value=r?toText(r):'';F('steps').value=r?r.steps.join('\n'):'';F('tip').value=r?r.tip||'':'';
  if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','')}
const FR={'½':.5,'¼':.25,'¾':.75,'⅓':1/3,'⅔':2/3};
function parseIng(s){s=s.trim();if(!s)return null;if(s[0]==='#')return s;
  const m=s.match(/^(\d+(?:[.,]\d+)?(?:\s*[½¼¾⅓⅔])?|\d+\/\d+|[½¼¾⅓⅔])\s*(g|kg|ml|l|tbsp|tsp)?\.?\s+(.+)$/i);if(!m)return[0,'',s];
  let v=m[1].replace(',','.'),q=0;if(v.includes('/')){const[a,b]=v.split('/');q=a/b}else{const fr=v.match(/[½¼¾⅓⅔]/);q=(parseFloat(v)||0)+(fr?FR[fr[0]]:0)}
  return[q,(m[2]||'').toLowerCase(),m[3]]}
const closeDlg=()=>dlg.close?dlg.close():dlg.removeAttribute('open');
$('#add').addEventListener('click',()=>openForm(null));
$('#cancel').addEventListener('click',closeDlg);
$('#fm').addEventListener('submit',e=>{e.preventDefault();const name=F('name').value.trim();if(!name)return;
  const look=F('look').value,L=LOOKS[look]||LOOKS.cake;
  let id=editing;if(!id){const base='my-'+(name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'recipe');id=base;let i=2;while(find(id))id=base+'-'+i++}
  const r={id,mine:true,name,local:F('local').value.trim(),origin:F('origin').value.trim()||'My kitchen',course:CL[F('course').value]?F('course').value:'mains',look,time:Math.max(1,+F('time').value||60),active:Math.max(1,+F('active').value||20),serves:Math.max(1,Math.round(+F('serves').value)||4),unit:F('unit').value.trim()||'servings',level:'Home recipe',tint:L.tint,art:L.art,
    ing:F('ing').value.split('\n').map(parseIng).filter(Boolean),steps:F('steps').value.split('\n').map(s=>s.trim()).filter(Boolean),tip:F('tip').value.trim()};
  const k=mine.findIndex(x=>x.id===id);if(k>=0)mine[k]=r;else mine.push(r);save.mine();delete st.sv[id];delete needCache[id];
  closeDlg();renderChips();
  if(location.hash==='#'+id)route(true);else location.hash=id});

/* ---------- start ---------- */
applyStatic();renderChips();route(false);renderTimers();tick();loadCovers();
window.SofraDebug={t,diet,needs,findTimes,amount,shopList,matchRecipes,pantryMap,cleanBackup};
})();
