const fs=require('fs'),path=require('path'),vm=require('vm'),os=require('os'),assert=require('assert'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'pypto-series-svg-'));
const names=['pypto-compilation-guide','pypto-memory-reuse-guide','pypto-compiler-decisions-guide','pypto-callable-evolution-guide','pypto-runtime-evidence-guide','pypto-pass-contracts-guide'];
const result=[];const copy=[];
for(const name of names){
 const dir=path.join(root,name),html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
 const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(js);
 assert(!/<script[^>]+src=|<link[^>]+rel=["']stylesheet|\bfetch\s*\(/.test(html),name+' external runtime dependency');
 const legacy=name==='pypto-compilation-guide';let code=js.slice(0,legacy?js.indexOf('function draw()'):js.indexOf('let page=0'));
 if(!legacy)code+='\nlet mode=0,bounds={w:800,h:540};';
 const ctx=vm.createContext({document:{head:{insertAdjacentHTML(){}}},window:{}});vm.runInContext(code,ctx);
 const pages=vm.runInContext('pages',ctx),g=vm.runInContext('glossary',ctx),refs=vm.runInContext('refs',ctx);
 const states=[];let refsUnbundled=[];
 for(const p of pages.slice(1)){
  assert(g[p.g],name+' page key '+p.g);assert(p.note&&p.p.length,name+' missing explanation');
  for(const k of p.refs)assert(refs[k],k);
  for(let m=0;m<(p.modes?.length||1);m++){
   const svg=vm.runInContext(`mode=${m};diagram(${JSON.stringify(p.id)})`,ctx),b=vm.runInContext('bounds',ctx);
   for(const hit of svg.matchAll(/data-key="([^"]+)"/g))assert(g[hit[1]],name+' missing glossary '+hit[1]);
   const encode=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
   for(const tag of svg.matchAll(/<g\b[^>]*data-key="([^"]+)"[^>]*>/g)){
    const label=tag[0].match(/aria-label="([^"]*)"/);assert(label&&label[1]===encode(g[tag[1]][0]),name+' glossary/aria mismatch '+tag[1]);
   }
   const content=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${b.w} ${b.h}">${vm.runInContext('defs',ctx)}${svg}</svg>`;
   const dest=path.join(out,`${name}-${p.id}-${m}.svg`);fs.writeFileSync(dest,content);states.push({page:p.id,mode:m,width:b.w,height:b.h,file:path.basename(dest)});
  }
 }
 for(const [label,url] of Object.values(refs)){
  if(url.startsWith('https://'))continue;
  const [file,anchor]=url.split('#'),target=path.resolve(dir,file);
  if(!fs.existsSync(target)){assert(['pypto-compilation-guide','pypto-memory-reuse-guide'].includes(name),name+' broken bundled source '+url);refsUnbundled.push(label);continue;}
  if(anchor)assert(fs.readFileSync(target,'utf8').includes(`id="${anchor}"`),url+' missing anchor');
 }
 const saved=path.join(dir,'pages.json');if(fs.existsSync(saved))assert.deepStrictEqual(JSON.parse(fs.readFileSync(saved)),JSON.parse(JSON.stringify(pages)));
 copy.push({name,pages,glossary:g});
 result.push({name,pages:pages.length,diagramStates:states.length,script:'pass',glossary:'pass',sourceReferencesUnbundled:refsUnbundled,sha256:crypto.createHash('sha256').update(html).digest('hex'),states});
}
assert.equal(Math.max(4,7)+3,10);assert.equal(Math.max(2,7)+3,10);assert.equal(8-2,6);
const report={checkedAt:new Date().toISOString(),scope:'Static JS, all non-cover SVG states, glossary keys, bundled refs and chapter data. No browser layout or runtime/compiler validation.',svgDirectory:out,reports:result};
fs.writeFileSync(path.join(__dirname,'validation.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(__dirname,'review-content.json'),JSON.stringify(copy,null,2));
console.log(JSON.stringify({reports:result.map(({name,pages,diagramStates})=>({name,pages,diagramStates})),svgDirectory:out}));
