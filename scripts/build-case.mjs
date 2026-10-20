import fs from 'node:fs';
import {makePuzzle,explain} from '../lib/puzzle.mjs';
const args=process.argv.slice(2);const get=(key,fallback)=>{const i=args.indexOf(key);return i>=0?args[i+1]:fallback;};
try{const input=get('--input','examples/demo-pack.json'),out=get('--output','examples/case.json'),seed=get('--seed',new Date().toISOString().slice(0,10));const pack=JSON.parse(fs.readFileSync(input,'utf8'));const p=makePuzzle(pack,seed);fs.writeFileSync(out,JSON.stringify(p,null,2)+'\n');console.log(`已生成 ${out}；来源 ${p.source.kind}；${p.clues.length} 条线索，唯一解通过。`);if(args.includes('--answer'))console.log(explain(p).assignments.join('\n'));}catch(e){console.error(e.message);process.exitCode=1;}
