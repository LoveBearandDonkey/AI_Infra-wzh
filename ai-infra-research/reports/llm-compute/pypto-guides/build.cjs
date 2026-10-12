const fs=require('fs'),path=require('path');const {exportReports}=require('./export.cjs');
const root=path.resolve(__dirname,'..'),reports=exportReports(),config=JSON.parse(fs.readFileSync(path.join(__dirname,'edition.json')));
const shell=fs.readFileSync(path.join(root,'pypto-pass-contracts-guide/index.html'),'utf8').split('<script>')[0];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const catalog={};for(const r of reports.filter(r=>r.number!==1))catalog[r.number]={glossary:r.glossary,defs:r.defs,name:r.name};
const manifest=[];
for(const edition of config.reports){
 const chapters=edition.chapters.map((ch,j)=>{
  const states=[];const refs=[];const notes=[];
  for(const part of [...ch.parts,...(ch.textSources||[])]){const [rn,entry]=part.split(':'),[id,selection]=entry.split('@'),r=reports[+rn-1],p=r.pages.find(p=>p.id===id);
   for(const [m,st]of p.states.entries()){if(!ch.parts.includes(part)||(selection!==undefined&&m!==+selection))continue;
    const sv=st.body;states.push({...st,source:+rn,original:id,label:(ch.parts.length>1?p.nav+' · ':'')+st.label});
   }
   notes.push(p.note);
   for(const k of p.refs){const [title,url]=r.refs[k];let href=url;
    if(!/^https?:/.test(url)){
     const [f,anchor]=url.split('#'),target=path.resolve(root,r.name,f);
     href=fs.existsSync(target)?path.relative(__dirname,target)+(anchor?'#'+anchor:''):null;
    }
    if(!refs.some(x=>x.title===title))refs.push({title,href});
   }
  }
  return {...ch,states,refs,notes:[...new Set(notes)],en:`${String(j+1).padStart(2,'0')} / PYPTO · 合并报告`};
 });
 let html=shell.replace(/<title>[\s\S]*?<\/title>/,`<title>${edition.title} · 合并报告</title>`)
 .replace(/<section class="cover"[\s\S]*?<\/section>/,`<section class="cover" id="cover"><div><div class="badge">AI INFRA · PYPTO / 合并报告</div><h1>${edition.title}</h1><p>沿程序结构、存储约束与运行证据，理解 PyPTO 的编译与执行机制。</p><p class="meta">${chapters.length} 节正文 · 教学示例与历史材料分别标注<br>合并修订 · 2026-10-12<br><a href="index.html">返回报告目录</a></p><button id="start">开始阅读 →</button></div><div id="cover-art"></div></section>`);
 html=html.replace('<h2 id="explain-title"></h2>','<h2 id="explain-title" hidden></h2>');
 html=html.replace('<div class="copy" id="copy"></div>','<div class="copy" id="copy"></div><details class="sources"><summary>本节符号与示例前提</summary><div id="assumptions"></div></details>');
 html=html.replace(/<strong>图例与阅读说明<\/strong>[\s\S]*?<p id="scope-note"><\/p>/,'<strong>图例与阅读说明</strong><p>绿色网格为输入或中间值，蓝紫网格为权重；紫色胶囊为 IR 操作，中性灰条为 Pass。实线数据箭头连接值与操作；长虚线表示调用；菱形点线表示跨阶段对应；圆端点表示存储绑定。容器表示包含范围。IR 快照是某编译阶段保存的程序表示，不是运行时刻。状态圆中的 ✓ 为保证成立或检查通过，× 为检查失败，实线圆 − 为当前未保证，虚线圆 − 为未知；当前正文区分声明与结果。</p><p id="scope-note"></p>');
 const payload=JSON.stringify({title:edition.title,chapters,catalog}).replace(/</g,'\\u003c');
 const runtime=fs.readFileSync(path.join(__dirname,'reader.js'),'utf8');
 html+=`<script>const DATA=${payload};\n${runtime}</script></body></html>`;
 fs.writeFileSync(path.join(__dirname,edition.file),html);
 manifest.push({file:edition.file,title:edition.title,chapters:chapters.map(x=>({id:x.id,title:x.title,question:x.question,parts:x.parts,states:x.states.length})),states:chapters.reduce((s,c)=>s+c.states.length,0)});
}
fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(manifest.map(x=>({file:x.file,chapters:x.chapters.length,states:x.states})));

require('./build-single.cjs');
