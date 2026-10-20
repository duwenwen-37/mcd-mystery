export const PEOPLE=['阿圆','小林','米粒','大可'];
export const METRICS={kcal:{label:'能量',unit:'kcal'},protein:{label:'蛋白质',unit:'g'},sodium:{label:'钠',unit:'mg'}};
export function validatePack(pack){
 if(!pack||pack.version!==1||!Array.isArray(pack.foods)||pack.foods.length<4||pack.foods.length>500)throw Error('数据包需要 4–500 款餐品，version 必须为 1');
 if(!pack.source||!['demo','official-snapshot'].includes(pack.source.kind))throw Error('缺少数据来源类型');
 if(typeof pack.source.fetchedAt!=='string'||!Number.isFinite(Date.parse(pack.source.fetchedAt)))throw Error('缺少有效获取日期');
 if(pack.source.kind==='official-snapshot'&&(!pack.source.tool||!pack.source.note))throw Error('官方快照必须注明 Tool 和核对说明');
 const seen=new Set();
 for(const f of pack.foods){
  if(!f||typeof f.id!=='string'||!f.id.trim()||seen.has(f.id))throw Error('餐品 ID 缺失或重复'); seen.add(f.id);
  if(typeof f.name!=='string'||!f.name.trim()||f.name.length>80)throw Error('餐品名称无效');
  if(f.basis!=='per-serving')throw Error('仅接受明确为每份的数据，不把每100g和每份混算');
  if(!Number.isFinite(f.kcal)||f.kcal<=0||!Number.isFinite(f.protein)||f.protein<0)throw Error('每款餐品需要有效能量与蛋白质；未知不能填零');
  if(f.sodium!==undefined&&(!Number.isFinite(f.sodium)||f.sodium<0))throw Error('钠数据无效');
 }
 return pack;
}
export function rng(seed){let h=2166136261;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export function shuffle(a,r){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function permutations(a){if(a.length<2)return[a];return a.flatMap((v,i)=>permutations(a.filter((_,j)=>j!==i)).map(p=>[v,...p]));}
export function satisfies(clue,assignment,foods){
 const a=assignment[clue.a],b=assignment[clue.b];
 if(clue.kind==='not')return a!==clue.food;
 if(clue.kind==='above')return foods[a][clue.metric]>foods[b][clue.metric];
 if(clue.kind==='sum')return Math.abs(foods[a][clue.metric]+foods[b][clue.metric]-clue.value)<0.00001;
 throw Error('未知线索');
}
export function solve(puzzle,clues=puzzle.clues){return permutations([0,1,2,3]).filter(a=>clues.every(c=>satisfies(c,a,puzzle.foods)));}
function clueText(c,foods){
 if(c.kind==='not')return `${PEOPLE[c.a]}拿的不是「${foods[c.food].name}」。`;
 const m=METRICS[c.metric];
 if(c.kind==='above')return `${PEOPLE[c.a]}那份餐品的${m.label}，比${PEOPLE[c.b]}那份高。`;
 return `${PEOPLE[c.a]}和${PEOPLE[c.b]}的餐品，${m.label}合计为 ${Number(c.value.toFixed(2))} ${m.unit}。`;
}
export function makePuzzle(pack,seed='今日案件'){
 validatePack(pack);const r=rng(seed);const all=shuffle(pack.foods,r);
 // Avoid impossible games when every food has identical numeric profiles.
 let chosen;
 for(let offset=0;offset<Math.min(all.length,100);offset++){
  const fs=Array.from({length:4},(_,i)=>all[(offset+i)%all.length]);
  if(new Set(fs.map(f=>`${f.kcal}|${f.protein}`)).size>=3){chosen=fs;break;}
 }
 if(!chosen)throw Error('餐品数据差异不足，无法生成有趣案件；请补充不同餐品');
 const foods=chosen.map(f=>({...f})); const truth=shuffle([0,1,2,3],r);const candidates=[];
 const metrics=['kcal','protein']; if(foods.every(f=>Number.isFinite(f.sodium)))metrics.push('sodium');
 for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)for(const metric of metrics){
  const x=foods[truth[a]][metric],y=foods[truth[b]][metric];
  if(x!==y)candidates.push({kind:'above',a:x>y?a:b,b:x>y?b:a,metric});
  candidates.push({kind:'sum',a,b,metric,value:x+y});
 }
 for(let a=0;a<4;a++)for(let food=0;food<4;food++)if(food!==truth[a])candidates.push({kind:'not',a,food});
 let remain=permutations([0,1,2,3]),clues=[];
 // Pick the most informative true clue, with deterministic shuffling to vary ties.
 const pool=shuffle(candidates,r);
 while(remain.length>1&&clues.length<9){
  let best=null,left=remain;
  for(const c of pool){if(clues.includes(c))continue;const survivors=remain.filter(a=>satisfies(c,a,foods));if(survivors.length<left.length){best=c;left=survivors;}}
  if(!best)throw Error('无法形成唯一解');clues.push(best);remain=left;
 }
 // Remove redundant clues; each retained clue has a reason to exist.
 for(let i=clues.length-1;i>=0;i--){const reduced=clues.filter((_,j)=>j!==i);if(solve({foods,clues:reduced}).length===1)clues=reduced;}
 const p={version:1,seed:String(seed).slice(0,80),source:{...pack.source},people:[...PEOPLE],foods,clues:clues.map(c=>({...c,text:clueText(c,foods)}))};
 if(solve(p).length!==1)throw Error('唯一解校验失败');return p;
}
export function checkAnswer(p,a){if(!Array.isArray(a)||a.length!==4||new Set(a).size!==4||a.some(x=>!Number.isInteger(x)||x<0||x>3))return{valid:false,correct:false,message:'请给四个人各分配一款不同的餐品。'};const failed=p.clues.filter(c=>!satisfies(c,a,p.foods));return{valid:true,correct:failed.length===0,message:failed.length?`还有 ${failed.length} 条线索没对上，再检查一下。`:'小票归位，案件告破！',failed};}
export function explain(p){const solution=solve(p)[0];return{solution,assignments:p.people.map((name,i)=>`${name} → ${p.foods[solution[i]].name}`),checks:p.clues.map(c=>({text:c.text,holds:satisfies(c,solution,p.foods)}))};}
