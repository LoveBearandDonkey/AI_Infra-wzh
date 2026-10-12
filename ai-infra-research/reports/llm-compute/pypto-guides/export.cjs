const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const names=['pypto-compilation-guide','pypto-memory-reuse-guide','pypto-compiler-decisions-guide','pypto-callable-evolution-guide','pypto-runtime-evidence-guide','pypto-pass-contracts-guide'];
function exportReports(){return names.map((name,i)=>{
 const html=fs.readFileSync(path.join(root,name,'index.html'),'utf8'),js=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 const fields={};const ctx=vm.createContext({document:{head:{insertAdjacentHTML(){}},getElementById(id){return fields[id]??={textContent:''}}},window:{}});
 let code=js.slice(0,i===0?js.indexOf('function draw()'):js.indexOf('let page=0'));
 if(i!==0)code+='\nlet page=0,mode=0,bounds={w:800,h:540};';
 vm.runInContext(code,ctx);const pages=JSON.parse(JSON.stringify(vm.runInContext('pages',ctx)));
 for(let n=1;n<pages.length;n++){const p=pages[n];p.states=[];
  for(let m=0;m<(p.modes?.length||1);m++){
   const body=vm.runInContext(`page=${n};mode=${m};diagram(${JSON.stringify(p.id)})`,ctx);let formula=p.f,extra='';
   if(i===2){fields.formula={textContent:p.f};vm.runInContext('updateFormula()',ctx);formula=fields.formula.textContent;}
   if(i===1&&p.id==='evidence'){const ev=vm.runInContext(`EVIDENCE.functions[${m}]`,ctx);formula=ev.name+' · Vec\n'+ev.boxes.map(b=>`${b.base}: [${b.offset},${b.offset+b.size})`).join('\n');extra=ev.source.map((l,j)=>`${ev.src_start+j}  ${l}`).join('\n')}
   if(i===0&&p.id==='evidence'){const ev=JSON.parse(js.match(/window.CASE_EVIDENCE = (\{.*\});/)[1]);formula=ev.text;}
   p.states.push({label:p.modes?.[m]||p.nav,body,bounds:JSON.parse(JSON.stringify(vm.runInContext('bounds',ctx))),formula,extra});
  }
 }
 return {number:i+1,name,sha256:crypto.createHash('sha256').update(html).digest('hex'),pages,glossary:JSON.parse(JSON.stringify(vm.runInContext('glossary',ctx))),refs:JSON.parse(JSON.stringify(vm.runInContext('refs',ctx))),defs:vm.runInContext('defs',ctx),cover:vm.runInContext('coverDiagram()',ctx)};
})}
module.exports={exportReports};
if(require.main===module){const output=process.argv[2]||path.join(__dirname,'current.json');fs.writeFileSync(output,JSON.stringify({capturedAt:new Date().toISOString(),reports:exportReports()},null,2));console.log(output)}
