(function () {
  'use strict';
  const C=window.CatalogCore, esc=C.escapeHtml;
  const allAssets=JSON.parse(document.getElementById('catalogData').textContent).assets;
  const config=JSON.parse(document.getElementById('runtimeConfig').textContent);
  const isSkills=config.collection==='skills', isPatterns=config.collection==='patterns';
  const assets=allAssets.filter(a=>isSkills?a.type==='method':isPatterns?a.type==='pattern':a.type==='knowledge');
  config.fileMode=location.protocol==='file:';
  if(config.mode==='pto' && typeof window.PTO_BASE_PREFIX==='string')config.ptoBase=window.PTO_BASE_PREFIX.replace(/\/?$/,'/');
  const $=id=>document.getElementById(id);
  let state=C.parseState(location.search,assets), health=null;
  const documentFigures={
    'atlas-950-explorer':{src:'__ATLAS_950_COVER__',alt:'Atlas 950 概念机柜：用户提供的整柜轴测截图'},
    'pypto-guides':{src:'__PYPTO_GUIDES_COVER__',alt:'内存复用图解：张量生命期与存储分配'},
    'pypto-compilation-guide':{src:'__PYPTO_COMPILATION_COVER__',alt:'PyPTO 编译图解：张量、计算、Kernel 与 Task 的关系'},
    'pangu-layer-atlas-2':{src:'__PANGU_LAYER_ATLAS_2_COVER__',alt:'Pangu Layer Atlas 2：层内计算结构、空间层叠与 L18 异常高亮'},
    'pangu-layer-atlas':{src:'__PANGU_LAYER_ATLAS_COVER__',alt:'Layer Atlas：49 层空间堆叠、异常层高亮、选中 L32 与 Rank 内存联动'},
    'npu-memory-atlas-training':{src:'__NPU_MEMORY_COVER__',alt:'Rank 2 训练内存轴测分层：权重、梯度、优化器态、激活与空余容量'},
    'spatial-systems-ui-style-guide':{src:'__SPATIAL_SYSTEMS_COVER__',alt:'Layer Atlas 空间系统界面：模型层叠、选中层与异常定位'},
    'llm-inference-dense-to-clusters':{src:'__LLM_INFERENCE_COVER__',alt:'LLM 推理封面：Prefill 建立缓存，Decode 循环生成 Token'},
    'training-parallel-communication':{src:'__TRAINING_PARALLEL_COVER__',alt:'多卡训练的四个层级：任务拆分、状态存储、通信语义、实现与链路'},
    'observability-design-style':{src:'__OBSERVABILITY_COVER__',alt:'数据观测工作台：灰度模型层叠、选中层与橙红异常标记'},
    'llm-compute-diagrams':{src:'__LLM_SKILL_COVER__',alt:'大模型计算图解 Skill 示例：从 Dense FFN 到 MoE'},
    'dense-ffn-to-moe':{src:'__DENSE_MOE_COVER__',alt:'从 Dense FFN 到 MoE：输入经 Router 选择专家，再加权合并的浅色封面图解'},
    'inference-knowledge-map':{src:'__DS32_RESIDUAL_THUMBNAIL__',alt:'DeepSeek V3.2 残差主干：Token Embedding 经 61 层 Transformer 到 LM Head'},
    'pangu-training-user-research':{src:'__PANGU_RESEARCH_P7_THUMBNAIL__',alt:'盘古训练用户研究第 7 页：资深 ASC 算子开发工程师画像'},
    'hardware-native-systems':{src:'__HW_NATIVE_LINGQU_THUMBNAIL__',alt:'L7 到 L0 的 8 级递归层级图'}
    ,'transformer-layer-guide':{src:'__TRANSFORMER_LAYER_COVER__',alt:'Transformer Layer 中 Attention、FFN 与两次残差相加的双子层结构图'}
  };
  const topicName=id=>C.topics.find(t=>t.id===id)?.label||id;
  function sourceAvailable(a) {
    if(config.fileMode)return Boolean(config.fileRoots?.[a.sources[0].repository]);
    if(config.mode==='pto'&&a.sources[0].repository==='pto')return true;
    return Boolean(health?.assets?.[a.id]?.available);
  }
  function sourceAction(a) {
    return sourceAvailable(a)?`<a class="btn btn-sm" href="${esc(C.sourceHref(a,config))}" target="_blank" rel="noopener noreferrer" aria-label="阅读原文：${esc(a.title)}（新标签页）">阅读原文 ↗</a>`:'<span class="card-note">来源未连接 · 可查看摘要</span>';
  }
  function detailHref(a){return C.stateQuery({...state,asset:a.id});}
  function coverArt(a) {
    if(documentFigures[a.id])return `<img class="document-figure document-figure-${esc(a.id)}" src="${documentFigures[a.id].src}" alt="${esc(documentFigures[a.id].alt)}">`;
    const frame=content=>`<svg viewBox="0 0 240 150" role="img" aria-label="${esc(a.title)} 主题插画">${content}</svg>`;
    const arts={
      'diagram-legend-library':`<g class="line"><path d="M25 18h190v114H25zM25 56h190M25 94h190M88 18v114M151 18v114"/><rect x="40" y="29" width="32" height="16" rx="2"/><path d="M48 29v16m8-16v16m8-16v16M40 37h32"/><rect x="99" y="29" width="42" height="16" rx="8"/><circle cx="183" cy="37" r="10"/><path d="M177 37h12m-6-6v12M39 75h32m-7-6 7 6-7 6M104 69l6 6-6 6m12-12 6 6-6 6m12-12 6 6-6 6"/><rect x="168" y="65" width="30" height="20" rx="4"/><path d="M40 106h32v14H40zM101 107h36m-36 10h25M171 107l6 6 13-12"/></g>`,
      'pangu-layer-atlas':`<g class="line"><path d="m108 26 73 35v67l-73-35zM92 29l73 35v67M76 32l73 35v67M60 35l73 35v67M44 38l73 35v67"/></g><path class="soft" d="m76 32 73 35v67L76 99z"/><path class="line" d="m76 32 73 35v67L76 99z"/><path class="accent" d="m97 65 15 7v18l-15-7z"/>`,
      'devkit-tui-competitive-analysis':`<rect class="soft" x="28" y="24" width="184" height="102" rx="10"/><path class="line" d="M28 45h184M89 45v81M89 86h123"/><circle class="solid" cx="41" cy="35" r="3"/><circle class="mid" cx="52" cy="35" r="3"/><path class="line" d="m41 61 8 6-8 6m17 0h17M103 59h87M103 72h54M103 99h48M103 112h78"/><rect class="accent" x="41" y="90" width="33" height="6" rx="3"/>`,
      'aicpu-aicore':`<rect class="soft" x="34" y="26" width="172" height="98" rx="18"/><circle class="solid" cx="87" cy="75" r="25"/><circle class="mid" cx="153" cy="75" r="25"/><path class="line" d="M112 75h16M87 50V38M153 50V38M87 112v-12M153 112v-12"/><text x="76" y="79" style="fill:var(--background)">CPU</text><text x="140" y="79">CORE</text>`,
      'hnsw-explainer':`<path class="line thin" d="M34 112h172M56 88h128M78 62h84M104 36h32"/><g class="line"><path d="M52 112 82 88 112 62 120 36M92 112l28-24 28-26M132 112l28-24"/></g><g class="solid"><circle cx="52" cy="112" r="6"/><circle cx="92" cy="112" r="6"/><circle cx="132" cy="112" r="6"/><circle cx="172" cy="112" r="6"/><circle cx="82" cy="88" r="6"/><circle cx="120" cy="88" r="6"/><circle cx="160" cy="88" r="6"/><circle cx="112" cy="62" r="6"/><circle cx="148" cy="62" r="6"/></g><circle class="accent" cx="120" cy="36" r="7"/>`,
      'hardware-native-systems':`<g class="line"><rect x="39" y="28" width="162" height="94" rx="12"/><path d="M53 44h134v20H53zM53 72h62v36H53zM123 72h64v36h-64z"/></g><rect class="solid" x="60" y="51" width="68" height="6" rx="3"/><rect class="accent" x="136" y="51" width="38" height="6" rx="3"/><circle class="mid" cx="84" cy="90" r="11"/><path class="line" d="M142 85h27m-27 10h18"/>`,
      'pangu-communication':`<g class="soft"><rect x="31" y="30" width="48" height="34" rx="8"/><rect x="96" y="30" width="48" height="34" rx="8"/><rect x="161" y="30" width="48" height="34" rx="8"/><rect x="31" y="87" width="48" height="34" rx="8"/><rect x="96" y="87" width="48" height="34" rx="8"/><rect x="161" y="87" width="48" height="34" rx="8"/></g><path class="line" d="M79 47h17m48 0h17M185 64v23M161 104h-17m-48 0H79M55 87V64"/><circle class="accent" cx="120" cy="47" r="7"/><circle class="solid" cx="120" cy="104" r="7"/>`,
      'training-placement':`<g class="line"><rect x="46" y="27" width="148" height="96" rx="12"/><path d="M95 27v96m50-96v96M46 75h148"/></g><g class="mid"><circle cx="70" cy="51" r="8"/><circle cx="120" cy="51" r="8"/><circle cx="170" cy="51" r="8"/><circle cx="70" cy="99" r="8"/><circle cx="120" cy="99" r="8"/></g><circle class="accent" cx="170" cy="99" r="8"/><text x="57" y="119">PP</text><text x="107" y="119">TP</text><text x="157" y="119">EP</text>`,
      'h-anchor-placement':`<path class="line thin" d="M43 35h154M43 62h154M43 89h154M43 116h154M68 26v99M102 26v99M138 26v99M173 26v99"/><path class="line" d="m66 91 36-29 35 25 37-52"/><g class="solid"><circle cx="66" cy="91" r="7"/><circle cx="102" cy="62" r="7"/><circle cx="137" cy="87" r="7"/></g><circle class="accent" cx="174" cy="35" r="8"/>`,
      'pto-toolchain':`<g class="soft"><rect x="25" y="57" width="43" height="36" rx="9"/><rect x="83" y="57" width="43" height="36" rx="9"/><rect x="141" y="57" width="43" height="36" rx="9"/></g><rect class="solid" x="199" y="57" width="19" height="36" rx="7"/><path class="line" d="M68 75h15m43 0h15m43 0h15"/><text x="37" y="79">DSL</text><text x="94" y="79">IR</text><text x="149" y="79">PASS</text>`,
      'ascend-tiling':`<rect class="soft" x="47" y="28" width="146" height="94" rx="12"/><g class="line"><path d="M62 43h116v64H62zM91 43v64m29-64v64m29-64v64M62 75h116"/></g><rect class="accent" x="122" y="77" width="25" height="28" rx="4"/><path class="solid" d="m182 75 18-10v20z"/>`,
      'vlsi-placement':`<g class="line"><rect x="38" y="25" width="164" height="100" rx="10"/><path d="M51 39h53v34H51zM112 39h31v72h-31zM151 39h37v28h-37zM51 81h53v30H51zM151 75h37v36h-37z"/></g><rect class="accent" x="116" y="43" width="23" height="29" rx="3"/>`,
      'a5-pmu-design':`<path class="line thin" d="M39 116h164M39 31v85"/><g class="mid"><rect x="54" y="82" width="16" height="34" rx="3"/><rect x="82" y="61" width="16" height="55" rx="3"/><rect x="110" y="74" width="16" height="42" rx="3"/><rect x="138" y="43" width="16" height="73" rx="3"/><rect x="166" y="55" width="16" height="61" rx="3"/></g><path class="line" d="m55 70 35-20 29 11 27-29 38 8"/><circle class="accent" cx="146" cy="32" r="6"/>`,
      'pto-ux-report':`<rect class="soft" x="35" y="26" width="170" height="98" rx="13"/><path class="line" d="M35 48h170M94 48v76"/><circle class="solid" cx="49" cy="37" r="3"/><circle class="mid" cx="59" cy="37" r="3"/><path class="line" d="M50 67h29M50 79h20M50 102h29M108 68h77M108 82h51M108 101h34"/><rect class="accent" x="108" y="109" width="77" height="5" rx="2.5"/>`,
      'ascend-ecosystem':`<g class="line"><circle cx="120" cy="75" r="48"/><circle cx="120" cy="75" r="31"/><circle cx="120" cy="75" r="14"/><path d="M120 27v34m42-10-30 17m30 31-30-17m-12 41V89M78 99l30-17M78 51l30 17"/></g><circle class="accent" cx="120" cy="75" r="7"/>`,
      'ascend-mind-platform':`<g class="line"><rect x="38" y="29" width="164" height="23" rx="7"/><rect x="52" y="64" width="136" height="23" rx="7"/><rect x="68" y="99" width="104" height="23" rx="7"/><path d="M120 52v12m0 23v12"/></g><rect class="accent" x="150" y="35" width="37" height="11" rx="5"/><text x="51" y="44">APPLICATION</text><text x="65" y="79">PLATFORM</text><text x="81" y="114">HARDWARE</text>`,
      'deepseek-migration':`<rect class="soft" x="30" y="48" width="63" height="54" rx="12"/><rect class="soft" x="147" y="48" width="63" height="54" rx="12"/><path class="line" d="M45 62h33v26H45zM162 62h33v26h-33zM93 75h49m-10-10 10 10-10 10"/><circle class="solid" cx="62" cy="75" r="7"/><circle class="accent" cx="178" cy="75" r="7"/><text x="49" y="119">GPU</text><text x="158" y="119">ASCEND</text>`,
      'inference-knowledge-map':`<path class="line" d="M37 75h45m0 0 35-32m-35 32 35 32m0-64h45m-45 64h45m0-64 35 32-35 32"/><g class="soft"><rect x="27" y="59" width="55" height="32" rx="9"/><rect x="107" y="27" width="55" height="32" rx="9"/><rect x="107" y="91" width="55" height="32" rx="9"/></g><rect class="solid" x="184" y="59" width="29" height="32" rx="9"/><circle class="accent" cx="82" cy="75" r="6"/>`,
      'dynamo-product-analysis':`<circle class="soft" cx="120" cy="75" r="49"/><path class="line" d="M120 42a33 33 0 0 1 31 22m-3-12 3 12-12-1M120 108a33 33 0 0 1-31-22m3 12-3-12 12 1"/><g class="solid"><circle cx="120" cy="42" r="8"/><circle cx="151" cy="75" r="8"/><circle cx="120" cy="108" r="8"/><circle cx="89" cy="75" r="8"/></g><circle class="accent" cx="151" cy="75" r="5"/>`
    };
    return frame(arts[a.id]||arts['hardware-native-systems']);
  }
  function renderCard(a) {
    const source=`${a.author} · ${C.projects[a.sources[0].repository]}`;
    const href=a.type==='method'?detailHref(a):C.sourceHref(a,config);
    return `<article class="card-demo report-card">
      <div class="card-demo-header"><h3 class="card-demo-title"><a href="${esc(href)}">${esc(a.title)}</a></h3><span class="card-kind">${esc(a.form)}</span></div>
      <a class="card-visual-link" href="${esc(href)}" tabindex="-1" aria-hidden="true"><div class="card-visual">${coverArt(a)}</div></a>
      <div class="card-demo-footer card-footer"><span class="card-source">${esc(source)}</span></div></article>`;
  }
  function syncUrl(push=false) {
    const url=C.stateQuery(state);
    if(location.search!==url)(push?history.pushState.bind(history):history.replaceState.bind(history))(null,'',url);
  }
  function renderDetail() {
    const a=assets.find(a=>a.id===state.asset);
    if(a?.type==='method'){
      const isGuide=a.form==='设计规范';
      const guideNote=a.id==='observability-design-style'?'v0.1 · 设计规范草案，尚未完成跨场景验证。':'设计规范参考，结合具体场景使用。';
      const demoAction=a.demoUrl?`<a class="btn btn-sm" href="${esc(a.demoUrl)}" target="_blank" rel="noopener noreferrer">查看完整demo</a>`:'';
      const actions=isGuide?`<a class="btn btn-sm" href="${esc(a.content)}" download>下载 Markdown ↓</a>${demoAction}`:`<a class="btn btn-sm" href="${esc(a.downloadUrl||'methods/llm-compute-diagrams.zip')}" download>下载 Skill ZIP ↓</a>${a.id==='llm-compute-diagrams'?'<a class="btn btn-sm" href="methods/llm-compute-diagrams/assets/reference-guide.html">查看示例 ↗</a>':''}`;
      document.title=a.title+' · AI Infra Skill';
      $('detailView').innerHTML=`<a class="btn btn-sm" href="skills.html">← 返回 Skill 库</a><div class="detail-heading"><p class="hero-kicker">${esc(a.form)} · ${esc(a.author)}</p><h1 id="detailTitle">${esc(a.title)}</h1><p class="hero-description">${esc(a.summary)}</p></div><div class="detail-layout"><div><img class="skill-preview" src="${documentFigures[a.id].src}" alt="${esc(documentFigures[a.id].alt)}"><section class="detail-section"><h2>适用场景</h2><p>${esc(a.designValue)}</p><ul>${a.outline.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><details class="detail-section"><summary>${isGuide?'查看完整设计规范':'查看完整 Skill 指令'}</summary><pre class="skill-source">${esc(config.skillTexts?.[a.id]||'')}</pre></details></div><aside class="panel-shell panel-shell-quiet source-panel"><h2>${isGuide?'使用这份规范':'使用这个 Skill'}</h2><p>${isGuide?'将这份 Markdown 规范作为设计和界面生成的参考，结合具体场景使用。':'下载完整技能包，解压后保留目录结构，添加到你的技能目录。'}</p><div class="skill-actions">${actions}</div><p class="card-note">${isGuide?esc(guideNote):'完整目录结构随包保留；下载的是当前构建版本，不会自动更新。'}</p></aside></div>`;
      return;
    }
    const back=`<a class="btn btn-sm" href="${esc(C.stateQuery({...state,asset:''}))}">← 返回知识库</a>`;
    if(!a){$('detailView').innerHTML=back+'<h1 id="detailTitle">未找到这篇内容</h1><p>条目可能已调整，请返回目录查找。</p>';return;}
    const source=a.sources[0], related=a.related.map(id=>assets.find(x=>x.id===id)).filter(Boolean);
    $('detailView').innerHTML=`${back}<div class="detail-heading"><p class="hero-kicker">${esc(a.topics.map(topicName).join(' / '))} / ${esc(a.form)} / ${esc(a.author)}</p><h1 id="detailTitle">${esc(a.title)}</h1><p class="hero-description">${esc(a.summary)}</p></div>
    <div class="detail-layout"><div><section class="detail-section"><h2>为什么收录</h2><p>${esc(a.designValue)}</p></section><section class="detail-section"><h2>阅读提纲</h2><ul>${a.outline.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section class="detail-section"><h2>来源与验证边界</h2><p>${esc(a.validation.join(' '))}</p><p>这是原材料的策展入口，不代表技术结论已重新核实，也不代表来源项目整体纳入设计成果库。</p></section></div>
    <aside class="panel-shell panel-shell-quiet source-panel"><h2>原始内容</h2><dl><dt>来源项目</dt><dd>${esc(C.projects[source.repository])}</dd><dt>仓内路径</dt><dd>${esc(source.path)}</dd><dt>目录审阅</dt><dd>${esc(a.reviewedAt)} · 设计范围核对</dd><dt>访问范围</dt><dd>内部使用</dd></dl>${sourceAction(a)}<p class="card-note">${health?.assets?.[a.id]?.changed?'来源已变更，摘要尚未重新审阅。':'原文保留在来源仓库；打开时读取当前文件。'}</p><details><summary>来源指纹</summary><p class="source-hash">SHA256 ${esc(source.sha256)}</p></details></aside></div>
    ${related.length?`<section class="detail-section"><h2>继续阅读</h2><div class="report-grid">${related.map(renderCard).join('')}</div></section>`:''}`;
    document.title=a.title+' · AI Infra 知识库';
    const check=health?.assets?.[a.id];
    if(check?.missingDependencies?.length){
      $('detailView').querySelector('.source-panel').insertAdjacentHTML('beforeend',`<details><summary>原文依赖待修复 · ${check.missingDependencies.length} 项</summary><p class="card-note">可能影响原文样式或图示；本轮保留源文件，不修改其历史实现。</p><ul>${check.missingDependencies.map(p=>`<li class="source-hash">${esc(p)}</li>`).join('')}</ul></details>`);
    }
    if(check?.externalDependencies){$('detailView').querySelector('.source-panel').insertAdjacentHTML('beforeend',`<p class="card-note">原文有 ${check.externalDependencies} 项外部资源依赖，离线时可能无法加载。</p>`);}
  }
  function render() {
    const detail=Boolean(state.asset);
    for(const id of ['galleryHero','galleryControls','collection'])$(id).hidden=detail;
    $('detailView').hidden=!detail;
    if(detail){renderDetail();return;}
    document.title=isSkills?'AI Infra Skill 库':isPatterns?'AI Infra Pattern 库':'AI Infra 设计知识库';
    $('searchInput').value=state.query;
    const visible=C.filterAssets(assets,{...state,topic:isSkills?'all':state.topic,domain:'all',form:'all'});
    $('resultCount').textContent=`显示 ${visible.length} / ${assets.length} 篇`;
    $('reportGrid').innerHTML=visible.map(renderCard).join('');
    $('reportGrid').hidden=!visible.length;$('emptyState').hidden=Boolean(visible.length);
    $('emptyState').classList.toggle('is-visible',!visible.length);
    $('categoryTabs').innerHTML=isSkills?'':C.topics.map(t=>`<button class="tab-control-item${t.id===state.topic?' is-selected':''}" type="button" aria-pressed="${t.id===state.topic}" data-topic="${t.id}">${t.label}</button>`).join('');
  }
  $('categoryTabs').addEventListener('click',e=>{const b=e.target.closest('[data-topic]');if(!b)return;state.topic=b.dataset.topic;syncUrl(true);render();$('categoryTabs').querySelector(`[data-topic="${state.topic}"]`).focus();});
  $('searchInput').addEventListener('input',()=>{state.query=$('searchInput').value;syncUrl();render();});
  function reset(){state=C.parseState('',assets);syncUrl(true);render();$('searchInput').focus();}
  $('resetFilters').addEventListener('click',reset);
  window.addEventListener('popstate',()=>{state=C.parseState(location.search,assets);render();});
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.metaKey&&!e.ctrlKey&&!state.asset&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!document.activeElement.isContentEditable){e.preventDefault();$('searchInput').focus();}});
  function setTheme(theme){const label=theme==='dark'?'切换浅色':'切换深色';document.documentElement.dataset.theme=theme;$('themeToggle').setAttribute('aria-pressed',String(theme==='dark'));$('themeToggle').setAttribute('aria-label',label);$('themeToggle').title=label;}
  let theme='light';try{theme=localStorage.getItem('ai-infra-theme')==='dark'?'dark':'light';}catch{}
  setTheme(theme);$('themeToggle').addEventListener('click',()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';setTheme(t);try{localStorage.setItem('ai-infra-theme',t);}catch{}});
  if(config.mode==='pto'){$('launchLink').href=config.ptoBase+'launch-v2.html';$('launchLink').hidden=false;}
  const activeLibrary=$(isSkills?'skillsTab':isPatterns?'patternsTab':'knowledgeTab');
  if(isSkills){document.querySelector('.category-scroll').hidden=true;$('galleryControls').classList.add('skills-controls');}
  activeLibrary.classList.add('is-selected');activeLibrary.setAttribute('aria-current','page');
  if(isSkills){$('pageTitle').textContent='AI Infra Skills';document.querySelector('#galleryHero .hero-description').textContent='将实践沉淀为可复用的技能，让技术理解与设计表达持续积累。';$('searchInput').placeholder='搜索 Skill、用途、关键词…';$('collection').setAttribute('aria-label','Skill 内容');}
  if(isPatterns){$('pageTitle').textContent='AI Infra Patterns';document.querySelector('#galleryHero .hero-description').textContent='积累可复用的可视化与交互模式，从具体场景探索设计表达。';$('searchInput').placeholder='搜索 Pattern、摘要、关键词…';$('collection').setAttribute('aria-label','Pattern 内容');}
  render();
  if(isPatterns){$('connectionStatus').textContent=`共 ${assets.length} 个 Pattern`;return;}
  if(isSkills){$('connectionStatus').textContent=`共 ${assets.length} 个 Skill`;return;}
  if(config.fileMode){$('connectionStatus').textContent=`共 ${assets.length} 篇知识内容 · 本地静态版`;return;}
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),3500);
  fetch(config.serviceBase+'api/health',{signal:controller.signal,cache:'no-store'}).then(r=>{if(!r.ok)throw Error('unavailable');return r.json();}).then(data=>{
    health=data;const connected=assets.filter(a=>data.assets[a.id]?.available).length;
    $('connectionStatus').textContent=`跨仓阅读服务已连接 · ${connected} / ${assets.length} 篇来源可用${Object.values(data.assets).some(x=>x.changed)?' · 部分来源有更新，详见条目':''}`;
    render();
  }).catch(()=>{$('connectionStatus').textContent=config.mode==='pto'?'跨仓阅读服务未连接；PTO 原文仍可打开。运行 ai-infra-research/scripts/serve.py 后刷新可阅读其他来源。':'来源服务未连接：请通过 scripts/serve.py 预览；摘要与检索仍可使用。';}).finally(()=>clearTimeout(timeout));
})();
