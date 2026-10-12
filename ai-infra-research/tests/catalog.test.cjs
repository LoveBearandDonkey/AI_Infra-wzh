const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../web/catalog-core.js');
const root=path.join(__dirname,'..');
const assets=JSON.parse(fs.readFileSync(path.join(root,'catalog/assets.json'))).assets.filter(a=>a.type==='knowledge');
const initial=()=>C.parseState('',assets);
test('NPU Pattern uses the requested communication entry and updated title',()=>{
 const a=JSON.parse(fs.readFileSync(path.join(root,'catalog/assets.json'))).assets.find(a=>a.id==='npu-memory-atlas-training');
 assert.equal(a.title,'NPU 训练内存与 EP 通信');
 for(const config of [{mode:'standalone'},{mode:'standalone',fileMode:true}]){
  const href=C.sourceHref(a,config);
  assert.match(href,/^patterns\/npu-memory-atlas\/variants\/index_comm\.html\?v=[a-f0-9]{12}$/);
  assert.equal(new URL(href,'https://example.github.io/AI_Infra/ai-infra-research/patterns.html').pathname,'/AI_Infra/ai-infra-research/patterns/npu-memory-atlas/variants/index_comm.html');
  assert(!/127\.0\.0\.1|localhost/.test(href));
 }
 assert.ok(fs.existsSync(path.join(root,a.content)));
});
test('Layer Atlas Pattern uses the specified entry in both static modes',()=>{
 const a=JSON.parse(fs.readFileSync(path.join(root,'catalog/assets.json'))).assets.find(a=>a.id==='pangu-layer-atlas');
 assert.equal(a.type,'pattern');
 const expected='../layer_stack/pangu-layer-stack_%E5%89%AF%E6%9C%AC.html';
 assert.equal(C.sourceHref(a,{mode:'standalone',fileMode:true,fileRoots:{'ai-infra':'../'}}),expected);
 assert.ok(C.sourceHref(a,{mode:'standalone'}).startsWith(expected+'?v='));
 assert.ok(fs.existsSync(path.join(root,'..',a.sources[0].path)));
});
test('23 manually curated entries after explicit exclusions',()=>{
 assert.equal(assets.length,23);assert.equal(assets.filter(a=>a.sources[0].repository==='pto').length,10);
 assert.equal(new Set(assets.map(a=>a.id)).size,23);
 assert.ok(!assets.some(a=>a.id==='a5-pmu-design'));
 assert.ok(!assets.some(a=>['pypto-trusted-iteration','devkit-agent-journey','devkit-tui-visual'].includes(a.id)));
 assert.ok(assets.every(a=>!a.sources.some(s=>s.path.includes('model_skill-dss3.2new'))));
});
test('multi-topic assets appear in every assigned category',()=>{
 const pangu=assets.find(a=>a.id==='pangu-training-user-research');
 assert.deepEqual(pangu.topics,['training','experience']);
 assert.ok(C.filterAssets(assets,{...initial(),topic:'training'}).includes(pangu));
 assert.ok(C.filterAssets(assets,{...initial(),topic:'experience'}).includes(pangu));
 const mind=assets.find(a=>a.id==='ascend-mind-platform');
 assert.deepEqual(mind.topics,['ecosystem','training','inference']);
});
test('multiword search matches design uses and sources',()=>{
 assert.equal(C.filterAssets(assets,{...initial(),query:'训练 用户研究'})[0].id,'pangu-training-user-research');
 assert.ok(C.filterAssets(assets,{...initial(),query:'Mind'}).length);
 assert.equal(C.filterAssets(assets,{...initial(),query:'不存在xyz'}).length,0);
});
test('domain, form and topic intersect',()=>{
 const found=C.filterAssets(assets,{...initial(),domain:'Pangu',form:'研究汇报',topic:'experience'});
 assert.deepEqual(found.map(a=>a.id),['pangu-training-user-research']);
});
test('competitive analysis and authors are explicit',()=>{
 const dynamo=assets.find(a=>a.id==='dynamo-product-analysis');
 assert.ok(dynamo.topics.includes('competitive'));
 assert.equal(dynamo.author,'Yuanfeng');
 const devkit=assets.find(a=>a.id==='devkit-tui-competitive-analysis');
 assert.equal(devkit.author,'Xindi');
 assert.ok(assets.filter(a=>a.id!==dynamo.id&&a.id!==devkit.id).every(a=>a.author==='Yucheng'));
});
test('URL state round-trips unicode and preserves empty results',()=>{
 const s={topic:'training',domain:'Pangu',form:'研究汇报',query:'算子 & 训练',asset:'pangu-training-user-research'};
 assert.deepEqual(C.parseState(C.stateQuery(s),assets),s);
 assert.equal(C.parseState('?topic=evil&domain=nope&form=oops',assets).topic,'all');
});
test('source path encoding preserves special characters, not URL syntax',()=>{
 assert.equal(C.encodePath('a/中 文?#.html'),'a/%E4%B8%AD%20%E6%96%87%3F%23.html');
 const config={serviceBase:'http://127.0.0.1:8766/',ptoBase:'./'};
 assert.ok(C.sourceHref(assets.find(a=>a.sources[0].repository==='pto'),config).startsWith('./'));
 assert.ok(C.sourceHref(assets.find(a=>a.id==='pangu-training-user-research'),config).includes('/sources/pangu-research/index.html?v='));
 assert.ok(C.sourceHref(assets.find(a=>a.id==='deepseek-migration'),config).includes('/sources/pypto/'));
 assert.match(C.sourceHref(assets.find(a=>a.id==='pangu-communication'),config),/communication-operator-visual-whitepaper\.html\?v=[a-f0-9]{12}$/);
 const standalone={mode:'standalone',serviceBase:'./',ptoBase:null};
 assert.match(C.sourceHref(assets.find(a=>a.id==='transformer-layer-guide'),standalone),/^reports\/llm-compute\/transformer-layer-guide-v3\.html\?v=/);
});
test('HTML metadata escaping covers all attribute delimiters',()=>{
 assert.equal(C.escapeHtml('<a "x" \'y\' &>'),'&lt;a &quot;x&quot; &#39;y&#39; &amp;&gt;');
});
test('generated page has every required DOM target once and valid inline JS',()=>{
 const doc=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const app=fs.readFileSync(path.join(root,'web/gallery.js'),'utf8');
 const markup=doc.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
 const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const m of app.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(m[1]),m[1]);
 for(const m of doc.matchAll(/<script>([\s\S]*?)<\/script>/g))new Function(m[1]);
 assert.ok(!doc.includes('/Users/'));
 assert.ok(!doc.includes('/* CATALOG_JSON */'));
 assert.ok(!doc.includes('<link rel="stylesheet"'));
 assert.ok(doc.includes('/* PTO design system · tokens/foundation.css */'));
});
