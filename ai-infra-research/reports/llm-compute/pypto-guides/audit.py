from pathlib import Path
import json,html
root=Path(__file__).parent
base=json.loads((root/'baseline.json').read_text())['reports']
edition=json.loads((root/'edition.json').read_text())['reports']
manifest=json.loads((root/'manifest.json').read_text())
# A1 only deletes framing/recap chapters; A2 rewrites and regroups mechanisms.
drop={'1:inherited','1:objects','1:relations','1:overview','2:overview','3:scope','3:evidence','3:experiment','3:overview','4:objects','4:calls','4:overview','5:failure','5:overview','6:declaration','6:overview'}
used={}
for report in edition:
 for c in report['chapters']:
  for part in c['parts']:
   key=part.split('@')[0]
   used.setdefault(key,[]).append((report['file']+'#'+c['id'],c['title']))
extra={
'1:inherited':('compilation.html#tensor','张量角色与 shape 定义并入第一节；图例移入 info'),
'1:objects':('compilation.html#overview','对象层级并入总览，保留 OP / Kernel / Task / 指令区别'),
'1:relations':('compilation.html#overview','关系图例移入常驻可访问的 info，删独立教学页'),
'1:outline':('compilation.html#outline','区域提取与报告04合并，保留跨边界输入输出'),
'1:kernel':('compilation.html#kernels','纯核与混合分支由报告04的图承担；Task 在总览定义'),
'1:memory':('memory-pipeline.html#objects','存储入门归入第二篇，避免两处重复引入'),
'2:overview':('memory-pipeline.html#address','重复的检查流程去除，约束与地址在正文分别展开'),
'3:scope':('memory-pipeline.html#tiling','用户参数与编译选择边界随具体分块解释'),
'3:evidence':('diagnosis.html#link','提示、IR、地址、trace 的对应统一在调查篇解释'),
'3:experiment':('diagnosis.html#experiment','保留分块实验的具体假设，合并重复实验步骤'),
'3:overview':('memory-pipeline.html#sync','总览重复的机制由分块、流水、同步三节承载'),
'4:objects':('compilation.html#inline','Function/Call 在内联定义，Kernel/Task 在核函数和总览定义'),
'4:calls':('compilation.html#inline','两个调用点与内联前后合为一节'),
'4:overview':('compilation.html#identity','变换总结并入对应依据，删第二个流程总览'),
'5:contract':('diagnosis.html#instance','工作负载与计时条件并入调查对象'),
'5:failure':('diagnosis.html#repro','编译失败分支并入最小复现，保留失败类别区别'),
'5:overview':('diagnosis.html#experiment','观察/假设/验证不再独立复述；作为各节的具体边界'),
'6:contract':('diagnosis.html#conditions','定义与真实性质例子合为一节'),
'6:declaration':('diagnosis.html#coverage','声明与实际运行检查并入验证范围'),
'6:overview':('diagnosis.html#first','不再用未知 P/Q/R 复述流程，保留具体检查区间')}
rows=[]
for r in base:
 for p in r['pages'][1:]:
  k=f"{r['number']}:{p['id']}"
  if k in used:
   dest='；'.join(a for a,b in used[k]);reason='保留图示，合并为同一读者问题下的状态切换'
   if k=='2:pipeline':reason='按视图别名与流水缓冲拆分，分别放入对应机制'
  else:dest,reason=extra[k]
  rows.append({'source':k,'title':p['title'],'a1':'移出主线' if k in drop else '保留','a2':dest,'reason':reason})
assert len(rows)==61
rawchars=lambda ps:sum(len(''.join(p.get('p',[]))) for p in ps)
variants=[{'id':'A0','name':'原六篇','reports':6,'chapters':61,'states':sum(len(p['states']) for r in base for p in r['pages'][1:]),'proseChars':sum(rawchars(r['pages']) for r in base)},
{'id':'A1','name':'只删重复背景与总结','reports':6,'chapters':61-len(drop),'states':sum(len(p['states']) for r in base for p in r['pages'][1:] if f"{r['number']}:{p['id']}" not in drop),'proseChars':sum(rawchars([p for p in r['pages'][1:] if f"{r['number']}:{p['id']}" not in drop]) for r in base)},
{'id':'A2','name':'合并并重写主线','reports':3,'chapters':sum(len(r['chapters']) for r in edition),'states':sum(r['states'] for r in manifest),'proseChars':sum(rawchars(r['chapters']) for r in edition)}]
questions=[
('对象身份','Function、Call、Kernel、Task 分别是什么？','compilation.html#inline','compilation.html#overview'),
('图例语义','数据依赖、调用、跨阶段对应能否区分？','compilation.html#overview','compilation.html#outline'),
('函数变换','内联、提取与拆核的输出如何不同？','compilation.html#inline','compilation.html#kernels'),
('共享约束','生命周期不重叠为什么还不能直接判定可共享？','memory-pipeline.html#constraints','memory-pipeline.html#aliases'),
('证据边界','最终地址为什么不能定位首次复用 Pass？','memory-pipeline.html#evidence','diagnosis.html#link'),
('层级区别','流水深度、保留缓冲数、任务数能否互换？','memory-pipeline.html#pipeline','memory-pipeline.html#deps'),
('等待原因','没有 Ready 为什么不能判断资源等待？','diagnosis.html#wait','diagnosis.html#instance'),
('检查状态','失效、失败和没采集检查是同一件事吗？','diagnosis.html#coverage','diagnosis.html#first'),
('偏离范围','缺失快照或非单调检查怎样影响定位？','diagnosis.html#first','diagnosis.html#checks'),
('收益证明','局部变化怎样通过实验验证收益？','diagnosis.html#critical','diagnosis.html#experiment')]
(root/'ablation-results.json').write_text(json.dumps({'method':'Deterministic editorial ablation; no reader study or comprehension scores.','variants':variants,'mapping':rows,'reviewQuestions':questions},ensure_ascii=False,indent=2)+'\n')
md=['# 六篇图解报告的内容消融与合并试读','', '日期：2026-10-12。技术依据沿用原报告标注的 2026-10-10 材料，本次不重新宣称源码版本核验。','', '[三篇试读与三组对照](comparison.html)。原六篇仍保留；baseline.json 保存本轮修改前的全部章节、正文、图示状态与 HTML 哈希。','', '## 实验方法','', '本次是可复查的编辑消融，不是读者理解度实验。固定原有技术问题与证据范围，依次比较：A0 原六篇；A1 仅删除背景、图例与总结页；A2 按计算结构、存储约束、异常调查合并并重写。用十个固定问题核对内容是否仍有明确去处。字数按正文段落的 Unicode 字符数计，含原有内联标签；不计图注、释义和折叠材料，不等同于阅读时长。','', '|版本|篇数|正文节数|图示状态|正文字符数|','|---|---:|---:|---:|---:|']
for v in variants:md.append(f"|{v['id']} {v['name']}|{v['reports']}|{v['chapters']}|{v['states']}|{v['proseChars']}|")
md+=['','## 结果与取舍','','A1 将正文从61节减至45节，但删除图例后，跨阶段对应、调用与存储绑定的区别不再有统一说明；分散在六篇中的相同机制仍重复出现。因此没有把“仅删除”作为最终版本。','','A2 将正文合并为31节，减少30节（49.2%）；图示状态从111减至76。图例移入 info，独有机制保留为同章状态，重复调查步骤集中到第三篇。十个问题均找到明确正文或图例落点，见下表；这是内容覆盖审查，不代表读者测试通过。','','保留一个编译结构总览，因为它回答 OP、Kernel、Task 与指令属于什么层级；删除其他重复总览。保留非单调、规划器分支、类型转换的共享限制等反例，因为删去会改变适用范围。原始来源摘录继续可访问。','','## 标题与符号自查','','- 03 改为“分块、流水缓冲与任务依赖如何影响执行”。','- 04 改为“函数内联、区域提取与混合核拆分”，不再以 Callable 统称代替具体变换。','- 05 改为“从任务等待与性能下降追踪编译证据”。','- 06 改为用户认可的“Pass 的前置条件、产出性质与首次偏离定位”。','- 01 的图形介绍改为对象名称；02 标题已明确对象与过程，保留。','- 原06的 P/Q/R 没有真实对象身份，移除；明确标出 SSA 保证、类型检查和地址检查。快照使用“初始 IR、变换①后”等名称，并说明是构造步骤。','- 原02的 S1–S7 改为“语句1–语句7”，避免与快照编号混用。A/B/C Tile、矩阵 X/W/Y 和任务 A/B 在各自正文定义，不机械删除有定义的变量。','','## 固定问题的覆盖复核','','|检查项|问题|精简版落点|','|---|---|---|']
for label,q,a,b in questions:md.append(f'|{label}|{q}|[主要说明]({a}) / [补充]({b})|')
md+=['','## 逐节删并记录','','|原章节|原标题|A1|A2 去向与理由|','|---|---|---|---|']
for r in rows:md.append(f"|{r['source']}|{r['title']}|{r['a1']}|[查看]({r['a2'].split('；')[0]})：{r['reason']}|")
md+=['','## 尚未验证','','未组织读者实验，没有理解准确率、阅读时长或偏好评分。按仓库约定未默认执行浏览器自动化，布局与视觉验收待用户反馈。静态脚本、状态、链接和 SVG 验证记录见 validation.json；不能据此声称视觉验收通过。','','## 复现','','运行 `node build.cjs` 生成三篇离线 HTML；运行 `python3 audit.py` 生成对照入口、统计及本报告；运行 `node validate.cjs` 检查精简版，再运行 `python3 validate-svg.py` 核对 SVG。baseline.json 是本轮固定基线，生成器不覆盖它。']
(root/'MERGE-REVIEW.md').write_text('\n'.join(md)+'\n')
# A compact report index with actual alternate reading paths, not just a count table.
style='body{background:#111;color:#ddd;font:16px/1.8 system-ui;max-width:1100px;margin:auto;padding:45px 24px}h1{font-size:34px;font-weight:500}h2{font-size:23px;font-weight:500}a{color:#bdd0e3}button{background:#202020;border:1px solid #666;color:#ddd;border-radius:4px;padding:10px 20px;margin-right:10px;cursor:pointer}button[aria-pressed=true]{background:#ddd;color:#111}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}.cards a{display:block;border-top:2px solid #888;padding:18px 0;text-decoration:none;font-size:21px}.muted{color:#999;font-size:14px}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:12px;border-bottom:1px solid #333}.rows{columns:2;column-gap:48px}.rows li{break-inside:avoid;margin-bottom:8px}section{margin-top:40px}button:focus-visible,a:focus-visible{outline:2px solid #fff} @media(max-width:700px){.cards{grid-template-columns:1fr}.rows{columns:1}}'
head='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PyPTO 图解 · 内容消融对照</title><style>'+style+'</style><h1>PyPTO 图解：三篇合并试读版</h1><p>从六篇61节正文，精简为三篇31节。保留机制与适用边界，合并重复介绍和调查步骤。</p><p class="muted">这是编辑消融结果，尚无读者理解度或阅读时长测试。<a href="MERGE-REVIEW.md">查看逐节删并记录与局限</a></p><div class="cards">'
for i,r in enumerate(edition):head+=f'<a href="{r["file"]}"><span class="muted">0{i+1} / {len(r["chapters"])} 节</span><br>{r["title"]}</a>'
head+='</div><section><h2>三组阅读路径对照</h2><p class="muted">A0 的原六篇入口已同步术语修订；不可变的修改前内容保存在 baseline.json。A1 是删节阅读路径，A2 是实际生成的合并 HTML。</p><div>'
for i,v in enumerate(variants):head+=f'<button data-v="{i}" aria-pressed="{str(i==2).lower()}">{v["id"]} {v["name"]}</button>'
head+='</div><p id="metric"></p><ol class="rows" id="route"></ol></section>'
routes=[]
for variant in range(3):
 items=[]
 if variant<2:
  for r in base:
   for p in r['pages'][1:]:
    if variant==1 and f"{r['number']}:{p['id']}" in drop:continue
    items.append({'title':f"{r['number']:02d} · {p['title']}",'href':f"../{r['name']}/index.html#{p['id']}"})
 else:
  for r in edition:
   for p in r['chapters']:items.append({'title':p['title'],'href':r['file']+'#'+p['id']})
 routes.append(items)
script='const variants='+json.dumps(variants,ensure_ascii=False)+';const routes='+json.dumps(routes,ensure_ascii=False)+''';function show(i){document.querySelectorAll('[data-v]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.v===i)));const v=variants[i];document.getElementById('metric').textContent=`${v.reports} 篇 · ${v.chapters} 节正文 · ${v.states} 种图示状态 · ${v.proseChars} 个正文字符`;const ol=document.getElementById('route');ol.replaceChildren(...routes[i].map(r=>{const li=document.createElement('li'),a=document.createElement('a');a.href=r.href;a.textContent=r.title;li.append(a);return li}));}document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>show(+b.dataset.v));show(2);'''
(root/'comparison.html').write_text(head+'<script>'+script+'</script></html>')
print(variants)
