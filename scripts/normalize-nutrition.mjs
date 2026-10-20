import fs from 'node:fs';
import crypto from 'node:crypto';
import {validatePack} from '../lib/puzzle.mjs';
export function normalize(result){
 let response=result.structuredContent;
 if(!response){const text=(result.content||[]).filter(c=>c.type==='text'||typeof c.text==='string').map(c=>c.text).join('\n');const at=text.indexOf('## Original Response');if(at>=0){try{response=JSON.parse(text.slice(at+'## Original Response'.length).trim());}catch{throw Error('无法读取官方响应，请检查格式变化');}}}
 if(!response||response.success===false||response.code!==200||typeof response.data!=='string')throw Error('不是成功的营养表响应');
 const lines=response.data.trim().split(/\r?\n/);const header=lines.shift().match(/^\[(\d+)\]\{([^}]+)\}:$/);if(!header)throw Error('营养表格式已变化，请人工核对');
 const fields=header[2].split(',');const rows=lines.filter(l=>l.trim()).map(line=>{const parts=line.trim().split(',');if(parts.length!==fields.length)throw Error('发现含逗号或异常行，停止避免错列');return Object.fromEntries(fields.map((f,i)=>[f,parts[i]]));});
 if(rows.length!==Number(header[1]))throw Error('餐品条数校验失败');
 const whitelist=new Map([['猪柳麦满分','🍔'],['猪柳蛋麦满分','🍔'],['中薯条','🍟'],['大薯条','🍟'],['小薯条','🍟'],['圆筒冰淇淋','🍦'],['麦乐鸡5块','🍗'],['大杯玉米杯','🌽'],['香芋派','🥧'],['双层吉士汉堡','🍔'],['麦香鱼','🐟'],['麦辣鸡腿汉堡','🍔'],['板烧鸡腿堡','🍔'],['巨无霸','🍔'],['纯牛奶（盒装）','🥛'],['苹果片','🍎']]);
 const seen=new Set(),foods=[];
 for(const row of rows){if(!whitelist.has(row.productName)||seen.has(row.productName))continue;seen.add(row.productName);
  const nums=['energyKcal','protein','sodium'].map(k=>{if(!/^\d+(\.\d+)?$/.test(row[k]||''))throw Error('缺失或异常数值，不填零');return Number(row[k]);});
  foods.push({id:'mcd-'+crypto.createHash('sha256').update(row.productName).digest('hex').slice(0,12),name:row.productName,emoji:whitelist.get(row.productName),basis:'per-serving',kcal:nums[0],protein:nums[1],sodium:nums[2]});
 }
 const time=response.datetime?.replace(' ','T')+'+08:00';
 return validatePack({version:1,source:{kind:'official-snapshot',fetchedAt:time,tool:'list-nutrition-foods',endpoint:'https://mcp.mcd.cn',note:'真实只读响应白名单提取；每份口径参照麦当劳中国官网营养计算器说明。仅用于游戏，不代表当前门店在售。',basisReference:'https://www.mcdonalds.com.cn/product/french-fries',rawDataSha256:crypto.createHash('sha256').update(response.data).digest('hex'),receivedRows:rows.length},foods});
}
if(process.argv[1]?.endsWith('normalize-nutrition.mjs')){try{const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('用法：node scripts/normalize-nutrition.mjs private/响应.json examples/official-pack.json');const pack=normalize(JSON.parse(fs.readFileSync(input,'utf8')));fs.writeFileSync(output,JSON.stringify(pack,null,2)+'\n');console.log(`已提取 ${pack.foods.length} 款公开餐品；未复制凭据、追踪号或账户信息。`);}catch(e){console.error(e.message);process.exitCode=1;}}
