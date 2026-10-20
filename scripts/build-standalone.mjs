import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let html=fs.readFileSync(path.join(root,'web/index.html'),'utf8');const css=fs.readFileSync(path.join(root,'web/style.css'),'utf8');let core=fs.readFileSync(path.join(root,'lib/puzzle.mjs'),'utf8').replace(/\bexport /g,'');let app=fs.readFileSync(path.join(root,'web/app.mjs'),'utf8').replace(/^import .*;\n/,'').replace(/\bexport /g,'');
const data=n=>JSON.stringify(JSON.parse(fs.readFileSync(path.join(root,'examples',n+'.json'),'utf8'))).replace(/</g,'\\u003c');
const original="[official,demo]=await Promise.all(['official-pack','demo-pack'].map(async n=>{const r=await fetch(`../examples/${n}.json`);if(!r.ok)throw Error('无法加载餐品数据');return validatePack(await r.json());}));";
if(!app.includes(original))throw Error('单文件构建入口已变化');
app=app.replace(original,`official=validatePack(${data('official-pack')});demo=validatePack(${data('demo-pack')});`);
html=html.replace('<link rel="stylesheet" href="./style.css">',`<style>${css}</style>`).replace('<script type="module" src="./app.mjs"></script>',()=>`<script type="module">\n${core}\n${app}\n</script>`).replace('href="./index.html"','href="#"');
fs.writeFileSync(path.join(root,'play.html'),html);console.log('已构建 play.html；无需安装，双击可离线玩。');
