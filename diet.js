/* Sofra diet labels, worked out from English ingredient names.
   These are a best guess, not a guarantee: the page tells people to check ingredients themselves. */
(function(){
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

window.SofraDiet={diet,OPT,SERVE_HEAD,MEAT,ANIMAL,GLUTEN};
})();
