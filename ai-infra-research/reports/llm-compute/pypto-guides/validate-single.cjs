const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const root=__dirname,manifest=JSON.parse(fs.readFileSync(path.join(root,'single-manifest.json'))),results=[];
for(const report of manifest){
 const file=path.join(root,report.file),html=fs.readFileSync(file,'utf8'),js=html.match(/<script>([\s\S]*)<\/script>/)[1];new vm.Script(js);
 assert(!/<script[^>]*src=|<link[^>]*rel=["']stylesheet|\bfetch\(/.test(html));assert(!html.includes('/Users/'));
 const keyHandlers={};const elements={};function element(id){return elements[id]??={id,hidden:true,textContent:'',innerHTML:'',offsetLeft:0,scrollTop:0,dataset:{},classList:{toggle(){},add(){},remove(){}},setAttribute(k,v){this[k]=v},removeAttribute(k){delete this[k]},addEventListener(){},scrollTo(){},querySelector(q){if(q==='svg')return {setAttribute(){}};if(q==='[data-key]'){const m=this.innerHTML.match(/data-key="([^"]+)"/);return m?{dataset:{key:m[1]}}:null}return null;}}}
 const ctx=vm.createContext({document:{getElementById:element,body:{classList:{toggle(){}}},querySelectorAll(){return []},querySelector(){return element('query')},addEventListener(type,handler){keyHandlers[type]=handler}},history:{replaceState(){}},location:{hash:''},window:{addEventListener(){},scrollTo(){}},innerWidth:1400,console});
 vm.runInContext(js,ctx);const data=JSON.parse(JSON.stringify(vm.runInContext('DATA',ctx)));assert(!data.catalog['1'],'Finalized report 01 must not be embedded');for(const ch of data.chapters)for(const st of ch.states)assert.notEqual(st.source,1);let states=0,hits=0;
 for(let i=1;i<=data.chapters.length;i++){
  vm.runInContext(`render(${i})`,ctx);const p=data.chapters[i-1];assert.equal(elements.title.textContent,p.title);
  for(let m=0;m<p.states.length;m++){
   elements.modes.onclick({target:{closest(){return {dataset:{mode:String(m)}}}}});const st=p.states[m];assert(elements.canvas.innerHTML.includes(st.body));assert(elements.formula.textContent.startsWith(st.formula||''));
   const g=data.catalog[st.source].glossary;
   for(const match of st.body.matchAll(/data-key="([^"]+)"/g)){const k=match[1];assert(g[k],k);vm.runInContext(`select(${JSON.stringify(k)})`,ctx);assert.equal(elements['node-title'].textContent,g[k][0]);hits++;}
   vm.runInContext('scale(1.3)',ctx);assert(vm.runInContext('zoom>1',ctx));elements.fit.onclick();assert(vm.runInContext('zoom===1 && view.x===0 && view.y===0',ctx));states++;
  }
  for(const r of p.refs){if(!r.href||r.href.startsWith('http'))continue;const [name,hash]=r.href.split('#'),target=path.resolve(root,name);assert(fs.existsSync(target),r.href);if(hash&&name.endsWith('.md'))assert(fs.readFileSync(target,'utf8').includes(`id="${hash}"`),r.href);}
 }
 elements.start.onclick();assert.equal(vm.runInContext('page',ctx),1);elements.next.onclick();assert.equal(vm.runInContext('page',ctx),2);elements.prev.onclick();assert.equal(vm.runInContext('page',ctx),1);
 // Keyboard follows the entire chapter-state sequence in both directions.
 const sequence=[[0,0]];data.chapters.forEach((ch,i)=>ch.states.forEach((_,m)=>sequence.push([i+1,m])));
 const key=(name,editable=false)=>{let prevented=false;keyHandlers.keydown({key:name,target:{matches:()=>false,isContentEditable:editable},preventDefault(){prevented=true}});return prevented};
 const position=()=>JSON.stringify(vm.runInContext('[page,mode]',ctx));
 vm.runInContext('render(0)',ctx);key('ArrowLeft');assert.equal(position(),'[0,0]');
 for(const pos of sequence.slice(1)){assert(key('ArrowRight'));assert.equal(position(),JSON.stringify(pos));}
 key('ArrowRight');assert.equal(position(),JSON.stringify(sequence.at(-1)));
 for(const pos of sequence.slice(0,-1).reverse()){key('ArrowLeft');assert.equal(position(),JSON.stringify(pos));}
 vm.runInContext('render(2)',ctx);key('ArrowRight');assert.equal(position(),'[2,1]');key('ArrowRight');assert.equal(position(),'[3,0]');key('ArrowLeft');assert.equal(position(),'[2,1]');
 assert(!key('ArrowRight',true));assert.equal(position(),'[2,1]');
 for(const [oldId,newId] of Object.entries({'structure-identity':'structure-kernels','diagnosis-link':'diagnosis-instance','diagnosis-checks':'diagnosis-coverage'})){
  vm.runInContext(`location.hash=${JSON.stringify('#'+oldId)}`,ctx);
  assert.equal(vm.runInContext('pages[chapterFromHash()].id',ctx),newId);
 }
 results.push({file:report.file,chapters:data.chapters.length,states,hits,script:'pass',simulatedReader:'pass',keyboardSequence:'62 positions forward/backward, boundaries, outline chapter modes and editable exclusion pass',localSources:'pass',sha256:crypto.createHash('sha256').update(html).digest('hex')});
}
assert.equal(results.reduce((a,b)=>a+b.states,0),61);assert.equal(results.reduce((a,b)=>a+b.chapters,0),24);
const result={checkedAt:new Date().toISOString(),scope:'Static syntax, offline dependencies, all chapter/mode rendering with a simulated DOM, glossary selection, next/previous, fit/zoom and local source targets. No browser layout or reader study.',reports:results,uniqueChapterIds:new Set(manifest[0].chapters.map(c=>c.id)).size,limitations:['No browser visual acceptance','No reader comprehension/time measurements','Source implementation versions not refreshed']};
fs.writeFileSync(path.join(root,'single-validation.json'),JSON.stringify(result,null,2));console.log(results);
