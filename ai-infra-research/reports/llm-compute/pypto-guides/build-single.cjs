const fs=require('fs'),path=require('path');const root=__dirname;
const files=['compilation.html','memory-pipeline.html','diagnosis.html'],prefixes=['structure','memory','diagnosis'];
const labels=['计算结构与编译变换','存储复用与流水约束','运行证据与编译检查'];
const titles=['从张量计算到函数、Tile 与核函数','生命周期、地址复用与流水缓冲约束','从任务等待到编译检查与首次偏离定位'];
const docs=files.map(f=>fs.readFileSync(path.join(root,f),'utf8'));
const inputs=docs.map(s=>JSON.parse(s.split('<script>const DATA=')[1].split(';\n// Offline reader:')[0]));
const chapters=[];const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rewrite=s=>s.replace(/第二篇/g,'存储与流水部分').replace(/第三篇/g,'异常调查与检查部分');
for(let i=0;i<inputs.length;i++)for(const ch of inputs[i].chapters){
 const n=chapters.length+1;
 const refs=ch.refs.map(r=>{if(!r.href||r.href.startsWith('http'))return r;const[f,anchor]=r.href.split('#'),target=path.resolve(root,f);if(!fs.existsSync(target))return r;
  if(!f.endsWith('.md'))return r;
  let text=fs.readFileSync(target,'utf8');if(anchor){const at=text.indexOf(`id="${anchor}"`);if(at>=0){let start=text.lastIndexOf('<',at),end=text.indexOf('<a id=',at+anchor.length+5);text=text.slice(start,end<0?undefined:end);}}
  return {...r,excerpt:text};
 });
 chapters.push({...ch,id:prefixes[i]+'-'+ch.id,part:i+1,en:`${String(n).padStart(2,'0')} / ${labels[i]}`,p:ch.p.map(rewrite),refs});
}
const title='PyPTO 函数变换、内存复用与问题定位';
let html=docs[0].split('<script>const DATA=')[0];
html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${title}</title>`);
html=html.replace(/<section class="cover"[\s\S]*?<\/section>/,`<section class="cover" id="cover"><div><div class="badge">AI INFRA · PYPTO / 完整图解报告</div><h1>PyPTO 函数变换、内存复用<br>与问题定位</h1><p>从函数边界与调用接口的变化出发，理解内存复用和流水约束，再用运行证据与编译检查定位问题。</p><p class="meta">原第 2–6 篇合并 · 函数变换 · 存储与流水 · 问题定位</p><button id="start">开始阅读 →</button></div><div id="cover-art"></div></section>`);
html=html.replace('</style></head>', '.source-excerpt{white-space:pre-wrap;font:12px/1.8 ui-monospace,monospace;color:#bbb;max-height:340px;overflow:auto}</style></head>');
html=html.replace('← / → 翻页。','← / → 按顺序切换图示状态，到达本节边界后进入相邻章节。');
let reader=fs.readFileSync(path.join(root,'reader.js'),'utf8');
reader=reader.replace("(r.href?`<a", "(r.excerpt?`<details><summary>${esc(r.title)}</summary><pre class=\"source-excerpt\">${esc(r.excerpt)}</pre></details>`:r.href?`<a");
html+='<script>const DATA='+JSON.stringify({title,chapters,catalog:inputs[0].catalog}).replace(/</g,'\\u003c')+';\n'+reader+'</script></body></html>';
fs.writeFileSync(path.join(root,'index.html'),html);
fs.writeFileSync(path.join(root,'single-manifest.json'),JSON.stringify([{file:'index.html',title,chapters:chapters.map(c=>({id:c.id,title:c.title,states:c.states.length})),states:chapters.reduce((n,c)=>n+c.states.length,0)}],null,2));
// All old three-volume URLs now enter the same report and preserve chapter selection.
files.forEach((f,i)=>fs.writeFileSync(path.join(root,f),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>PyPTO 完整报告</title><script>const h=location.hash.slice(1);location.replace('index.html#'+(h&&h!=='cover'?'${prefixes[i]}-'+h:'cover'));</script><p><a href="index.html">阅读完整报告</a></p></html>`));
console.log(`One standalone report: ${chapters.length} chapters, ${chapters.reduce((n,c)=>n+c.states.length,0)} states.`);
