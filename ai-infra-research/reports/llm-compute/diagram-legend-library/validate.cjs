const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const root=path.resolve(__dirname,'../../..'),html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const data=JSON.parse(html.match(/<script id="legendData" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const listed=JSON.parse(fs.readFileSync(path.join(root,'catalog/assets.json'))).assets.filter(a=>a.form==='交互图解').map(a=>a.id).sort();
assert.deepEqual(data.sources.filter(s=>s.kind!=='demo').map(s=>s.id).sort(),listed);
assert.equal(new Set(data.items.map(e=>e.id)).size,data.items.length);
for(const source of data.sources){const bytes=fs.readFileSync(path.join(root,source.file));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),source.sha256);assert(data.items.some(e=>e.refs.some(r=>r.id===source.id)));}
for(const item of data.items){assert(item.svg.includes('viewBox='));assert(!/undefined|NaN/.test(item.svg));for(const ref of item.refs){const s=data.sources.find(s=>s.id===ref.id);assert(s);if(ref.anchor){const text=fs.readFileSync(path.join(root,s.file),'utf8');assert(ref.anchor.startsWith('step-')||text.includes(ref.anchor),`${item.id}: ${ref.anchor}`)}}}
class El{constructor(){this.value='';this.dataset={};this.hidden=false;this.open=false;this.listeners={};this.innerHTML='';this.textContent=''}addEventListener(k,f){this.listeners[k]=f}showModal(){this.open=true}close(){this.open=false;this.listeners.close?.()} }
const els={};const get=id=>els[id]??=new El();get('legendData').textContent=JSON.stringify(data);get('source').value='all';const handlers={};
const context=vm.createContext({Blob,URL,document:{getElementById:get,addEventListener(k,f){handlers[k]=f}},location:{hash:'',pathname:'/index.html',search:''},history:{replaceState(){}}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'visual-system.js'),'utf8'),context);
const js=html.match(/<script>\s*'use strict';([\s\S]*?)<\/script>/)[1];vm.runInContext(js,context);
const run=s=>vm.runInContext(s,context);assert.equal(run('shown.length'),data.items.filter(e=>e.layer==='system').length);

for(const source of data.sources){get('source').value=source.id;run('render()');assert(run('shown.length')>0);assert(run('shown.every(e=>e.refs.some(r=>r.id===$("source").value))'));}
get('source').value='all';get('search').value='MemRef';run('render()');assert(run('shown.some(e=>e.id==="system-memref")'));
get('search').value='不存在的测试字符串';run('render()');assert.equal(run('shown.length'),0);assert.equal(get('empty').hidden,false);
run("category='全部';$('search').value='';$('source').value='all';render()");assert.equal(run('shown.length'),data.items.filter(e=>e.layer==='system').length);
for(const cat of ['对象','关系']){run(`category=${JSON.stringify(cat)};render()`);assert(run('shown.length')>0);assert(run('shown.every(e=>e.cat===category)'));}
run("category='全部';$('search').value='';$('source').value='all';render()");run('show(shown[0].id)');assert(get('detail').open);assert(get('previous').disabled);for(let i=1;i<data.items.filter(e=>e.layer==='system').length;i++)handlers.keydown({key:'ArrowRight',preventDefault(){}});assert(get('next').disabled);assert.equal(run('selected'),data.items.filter(e=>e.layer==='system').length-1);handlers.keydown({key:'ArrowRight',preventDefault(){}});assert.equal(run('selected'),data.items.filter(e=>e.layer==='system').length-1);get('close').onclick();assert(!get('detail').open);
console.log(`PASS: ${data.sources.length} sources, ${data.items.length} unique legends, source hashes/links, search, filters, empty/reset, dialog keyboard boundaries. Static and simulated DOM only.`);

run("layer='system';category='全部';render();show('pattern-compute')");assert(get('variantControls').innerHTML.includes('data-option="expanded"'));
get('variantControls').listeners.change({target:{dataset:{option:'expanded'},value:'true'}});assert(run('currentOptions.expanded'));assert.equal(get('download').href,get('detailImg').src);
const before=run('selected');handlers.keydown({key:'ArrowRight',target:{tagName:'SELECT'},preventDefault(){throw Error('native control intercepted')}});assert.equal(run('selected'),before);
run("show('system-value')");assert.equal(get('variantControls').innerHTML,'');
const V=require('./visual-system.js');
const cells=s=>(s.match(/data-element="true"/g)||[]).length;
assert.equal(cells(V.data({id:'a',label:'a',shape:[2,4]},0,0,{expanded:true})),8);
assert.equal(cells(V.data({id:'v',label:'v',shape:[6],values:[1,2,3,4,5,6]},0,0,{expanded:true})),6);
const combined=V.render('system-value',{expanded:true,parallel:'TP',role:'gradient',state:'complete',selected:true});
for(const token of ['data-decoration="distribution"','#79D4F2','#B58AF7','data-object="value-0"'])assert(combined.includes(token));
assert.equal(cells(V.render('pattern-compute',{expanded:true})),8+12+6);
for(const mode of ['shard','replica','partial'])for(const expanded of [false,true]){const svg=V.render('pattern-distribution',{mode,expanded});assert.equal(cells(svg),expanded?({shard:16,replica:32,partial:16}[mode]):0);assert(!/NaN|undefined/.test(svg));}
assert(V.render('pattern-storage').includes('data-kind="view"'));
assert(V.render('pattern-storage').includes('data-object="B0"'));
assert(V.data({id:'v',label:'v',shape:[6]},0,0,{expanded:true}).includes('x="122"'));
assert(V.data({id:'v',label:'v',shape:[3]},0,0,{expanded:true}).includes('x="50"'));
assert(!combined.includes('data-decoration="state"'));assert(!combined.includes('data-decoration="selection"'));
assert(!html.includes('<section class="principles"'));assert(!html.includes('<p class="desc"'));
run("show('system-value')");assert.equal(get('variantControls').innerHTML,'');
run("show('system-op')");assert.equal(get('variantControls').innerHTML,'');
assert.equal(Object.keys(data.coverage).length,46);for(const ids of Object.values(data.coverage))assert(ids.length>0);assert(html.includes('id="layers"'));assert.equal(data.items.filter(e=>e.layer==='pattern').length,5); 
assert(data.items.find(e=>e.id==='system-op').variants.some(v=>v.id==='ir-op')); 
console.log('PASS: pattern dimensions, stable IDs, local colors, removed state/selection decorations; original OP/communication SVGs, view identity, exact cell counts/vector lengths, live export, native keyboard guard.');

assert(!data.items.some(e=>['system-multiply','system-communication','system-function'].includes(e.id)));
assert.deepEqual(data.items.find(e=>e.id==='system-add').legacy,['add','multiply']);
assert(data.items.find(e=>e.id==='system-op').legacy.includes('communication'));
assert(data.items.find(e=>e.id==='system-kernel').svg.includes('fill-opacity=".1"'));
assert(data.items.find(e=>e.id==='system-task').svg.includes('fill="#9EF04B"'));
const instruction=data.items.find(e=>e.id==='system-instruction').svg;
assert(instruction.includes('data-icon="instruction"'));assert(instruction.includes('DataCopy'));assert(instruction.includes('fill="#9EF04B"'));assert(data.items.find(e=>e.id==='system-task').svg.includes('data-icon="task"')); 
run("layer='pattern';category='全部';render()");assert.equal(run('shown.length'),5);assert(run("shown.every(e=>e.cat==='组合模式')"));
run("show('system-value')");assert.equal(run('layer'),'system');
console.log('PASS: merged cards, kernel fill, green task/instruction glyphs, pattern tab and cross-tab detail navigation.');

const rankCard=data.items.find(e=>e.id==='system-rank');
const rankSvgs=[...rankCard.svg.matchAll(/href="data:image\/svg\+xml;base64,([^"]+)"/g)].map(m=>Buffer.from(m[1],'base64').toString());
const board=s=>s.match(/<rect class="rank-outline"[^>]*>/)[0];
const pins=s=>s.match(/<circle class="rank-pin"[^>]*>/g);
assert.equal(rankSvgs.length,2);assert.equal(board(rankSvgs[0]),board(rankSvgs[1]));assert.deepEqual(pins(rankSvgs[0]),pins(rankSvgs[1]));
console.log('PASS: Rank representations share identical board geometry, fill, corner radius and four pins.');

assert(!data.items.some(e=>e.id==='container'));assert(data.excluded.container);assert(!data.coverage.container);

for(const id of ['categories','count','reset'])assert(!html.includes('id=\"'+id+'\"'));

const decodeVariants=id=>[...data.items.find(e=>e.id===id).svg.matchAll(/href="data:image\/svg\+xml;base64,([^"]+)"/g)].map(m=>Buffer.from(m[1],'base64').toString());
const arithmeticSvg=data.items.find(e=>e.id==='system-add').svg.replace(/<defs>[\s\S]*?<\/defs>/,'');
const arithmeticCircles=[...arithmeticSvg.matchAll(/<circle[^>]*>/g)].map(m=>m[0].replace(/cx="[^"]+"/, 'cx="0"'));
assert.equal(arithmeticCircles.length,2);
assert.equal(arithmeticCircles[0],arithmeticCircles[1]);
assert(arithmeticCircles.every(s=>s.includes('r="24"')));
assert.equal((arithmeticSvg.match(/style="stroke-width:2"/g)||[]).length,2);
const runtimeGlyphs=['system-task','system-instruction'].map(id=>data.items.find(e=>e.id===id).svg);
assert.equal(runtimeGlyphs[0].match(/<rect[^>]*>/)[0],runtimeGlyphs[1].match(/<rect[^>]*>/)[0]);
for(const svg of runtimeGlyphs)assert(svg.includes('font-size="20"'));
console.log('PASS: arithmetic diameter/symbol strokes and task/instruction dimensions/type match.');

assert.deepEqual(data.items.slice(0,5).map(e=>e.id),['system-value','token','system-op','system-add','expert']);
assert(!data.items.some(e=>['data-roles','tile-cache','block-progress'].includes(e.id)));
for(const id of ['weight','aggregate','gradient','optimizer','tile','kv','completed-block','pending-block'])assert(data.coverage[id].includes('system-value'));
assert.equal(decodeVariants('system-value').length,8);

const approval=JSON.parse(fs.readFileSync(path.join(__dirname,'style-approval.json'),'utf8'));
assert.equal(approval.items.filter(e=>e.decision==='approved').length,13);
assert.equal(approval.items.filter(e=>e.decision==='revise').length,3);
for(const e of approval.items)assert.equal(data.items.find(x=>x.id===e.id).svg,e.decision==='approved'?e.candidate:e.before);
console.log('PASS: 13 approved SVGs applied exactly; 3 revision requests retain originals.');

const extraction=JSON.parse(fs.readFileSync(path.join(__dirname,'layer-extract.json'),'utf8'));
for(const e of extraction.extracts){if(['sample','sample-gray'].includes(e.id)){assert.equal(data.items.find(x=>x.id==='system-value').incorporated.find(x=>x.id==='layer-'+e.id).svg,e.svg);continue;}const item=data.items.find(x=>x.id==='layer-'+e.id);assert(item);assert.equal(item.svg,e.svg);run('show('+JSON.stringify(item.id)+')');assert.equal(get('variantControls').innerHTML,'');assert.equal(get('detailImg').src,get('download').href);}
assert.equal(data.items.length,34);
assert.equal(run("href('layer-stack-demo')"),'../../../../layer_stack/pangu-layer-stack_2.html');
console.log('PASS: all 9 approved Layer Stack snapshots, pattern grouping, source link and exact SVG export.');
