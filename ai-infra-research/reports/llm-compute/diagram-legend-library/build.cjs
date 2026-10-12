const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'../../..'), reports=path.join(root,'reports/llm-compute');
const assets=JSON.parse(fs.readFileSync(path.join(root,'catalog/assets.json'))).assets.filter(a=>a.form==='交互图解');
const sources=assets.map(a=>({id:a.id,title:a.title,file:a.sources[0].path.replace('ai-infra-research/',''),sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,a.sources[0].path.replace('ai-infra-research/','')))).digest('hex')}));
function load(file,cut){const html=fs.readFileSync(path.join(reports,file),'utf8');const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];let extra='';const ctx=vm.createContext({document:{head:{insertAdjacentHTML(_,s){extra+=s}},getElementById(){return {}}},window:{}});const stop=js.indexOf(cut);if(stop<0)throw Error(file+': cut missing');vm.runInContext(js.slice(0,stop),ctx);const css=()=>[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g),...extra.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n').replaceAll(':root','svg');return {ctx,css,run:s=>vm.runInContext(s,ctx)}}
const compiler=load('pypto-compilation-guide/index.html','function draw()');
const training=load('training-parallel-communication-v1.html','function draw()');
const inference=load('llm-inference-dense-to-clusters-v1.html','function draw(');
const dense=load('dense-ffn-to-moe-v1.html','function inspect(');
const transformer=load('transformer-layer-guide-v3.html','function render(');
const checks=load('pypto-pass-contracts-guide/index.html','let page=0');
const memory=load('pypto-memory-reuse-guide/index.html','let page=0');
// Library-specific approved variants; source reports remain unchanged.
compiler.run(`kernel=(x,y,w,h,label,target)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="18" fill="#fff" fill-opacity=".1"/><text x="'+(x+14)+'" y="'+(y+30)+'" style="fill:white;font-weight:650;font-size:18px">'+label+'</text><rect x="'+(x+w-59)+'" y="'+(y+14)+'" width="43" height="24" rx="2" fill="#000"/><text x="'+(x+w-37.5)+'" y="'+(y+31)+'" text-anchor="middle" style="fill:white;font-size:14px">'+target+'</text>'`);
const rows=[];const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function add(id,cat,title,desc,engine,expression,refs,view='0 0 320 180',note=''){
 const body=engine.run(expression);let defs='';try{defs=engine.run('typeof defs==="function"?defs():typeof defs==="string"?defs:""')}catch{}
 if(!defs){try{defs=engine.run("svg('')").match(/<defs>[\s\S]*?<\/defs>/)?.[0]||''}catch{}}
 const defined=new Set([...defs.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
 const css=engine.css().replace(/marker-end:\s*url\(#([^)]*)\)/g,(all,id)=>defined.has(id)?all:'marker-end:none');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}" role="img" aria-label="${esc(title)}"><style>${css} svg{--text:#e8e8e8;--muted:#ababab;font-family:Inter,"PingFang SC",system-ui,sans-serif} svg text{font-family:inherit} .hit{cursor:default}</style>${defs}${body}</svg>`;
 rows.push({id,cat,title,desc,note,refs,svg});
}
const C='pypto-compilation-guide',T='training-parallel-communication',I='llm-inference-dense-to-clusters',D='dense-ffn-to-moe',F='transformer-layer-guide',M='pypto-guides';
const ref=(id,anchor='')=>({id,anchor});
add('activation','数据与状态','输入与中间值','绿色网格表示输入、激活和计算中间值。形状由标签说明，底纹格数不表示实际元素数量。',compiler,"grid(65,55,'X','x','i','[T,H]',false,190,70)",[ref(C,'inherited'),ref(T,'vocab'),ref(I),ref(D),ref(F,'step-2')]);
add('weight','数据与状态','模型参数','蓝紫色网格表示权重与偏置。路由参数属于这一类，动态路由系数属于中间值。',compiler,"grid(65,55,'W','w','w','[H,F]',false,190,70)",[ref(C,'inherited'),ref(T,'vocab'),ref(I),ref(D),ref(F,'step-2')]);
add('aggregate','数据与状态','聚合结果','黄色网格表示均值、最大值、指数和等聚合数据；具体含义与归约维度需在图中标明。',compiler,"grid(65,55,'sum','x','a','归约结果',false,190,70)",[ref(C,'inherited'),ref(T,'vocab'),ref(I),ref(D),ref(F)]);
add('gradient','数据与状态','梯度','青色网格表示损失对参数或激活的导数；应标明被求导的对象。',training,"tensorNode(45,70,230,'∂L / ∂W',P,'grad')",[ref(T,'vocab'),ref(D),ref(F,'step-12')]);
add('optimizer','数据与状态','优化器状态','灰色数据块表示优化器维护的状态，例如 Adam 的一阶矩，与梯度分别保存。',training,"tensorNode(45,70,230,'m · [H,F]',O,'optimizer')",[ref(T,'vocab')]);
add('matrix','数据与状态','展开矩阵','方格按行列排列；标签解释序列长度、隐藏维度等轴的含义。未标数值的格子是结构示意。',transformer,"matrix(65,45,190,90,'x',B,4,8)",[ref(F,'step-2'),ref(D),ref(T,'vocab'),ref(I)]);
add('vector','数据与状态','数值向量','显式数值示例中，一格对应一个元素，固定格宽使长度与元素数量成比例。',training,"vector(82,77,[1,2,3,4,5,6],B,'sample','数值向量')",[ref(T,'vocab')]);
add('tile','数据与状态','Tile 值','小圆角网格块可携带形状、类型和内存空间信息；Tile 值与其引用的存储分别表示。',compiler,"grid(55,52,'C tile','tile','i','[32,64] · Vec',true,210,76)",[ref(C,'tile'),ref(M,'memory-objects')]);
add('kv','数据与状态','KV cache','绿色数据节点表示推理过程中缓存的 K、V 状态；普通 KV 与 MLA 的存储结构应结合具体报告区分。',inference,"tensor(160,50,'K cache · V cache',250,B)+tensor(160,105,'当前 token 的 K / V',250,B)",[ref(I)]);
add('token','数据与状态','Token 标识','独立标签表示离散 token 或其编号，不能把该标签直接当作隐藏特征矩阵。',transformer,"box(115,62,90,48,'token','token')",[ref(F,'step-1'),ref(D),ref(I)]);
add('model-op','计算与程序','模型计算模块','中灰胶囊表示计算操作或折叠子层，例如 Norm、Attention、FFN；名称说明层级。',training,"op(30,65,'Attention','compute',260)",[ref(T,'vocab'),ref(I),ref(D),ref(F,'step-2')]);
add('ir-op','计算与程序','IR 操作','紫色胶囊带函数标记，表示 tensor.matmul 或 tile.matmul 等 IR 操作，不等同一条设备指令。',compiler,"op(30,65,'tile.matmul','op',260)",[ref(C,'objects'),ref(M,'structure-tile')]);
add('add','计算与程序','逐元素相加','圆形加号表示对应位置相加；残差合并使用此图元。输入 shape 的匹配条件由计算语义确定。',transformer,"add(160,88)",[ref(F,'step-2'),ref(D),ref(I),ref(T,'vocab')]);
add('multiply','计算与程序','逐元素／广播乘法','圆形乘号表示逐元素相乘；标量系数乘向量时广播到各特征。矩阵乘法使用明确命名的计算节点。',inference,"circle(160,88,true)",[ref(I),ref(D),ref(T,'vocab')]);
add('expert','计算与程序','MoE 专家','专家胶囊内部以三组参数小格概括 SwiGLU 参数，边界标识专家身份。',dense,"expert('e1',90,40,140,92,true)",[ref(D),ref(I)],'0 0 320 180','保留来源报告的专家边界颜色；不同报告的色值可能不同，语义以标签为准。');
add('router','计算与程序','Router','Router 是有独立参数的计算模块。它生成专家选择与合并系数，图形仍采用计算胶囊。',inference,"op(160,65,'Router',260)",[ref(I),ref(D)]);
add('communication','计算与程序','通信操作','深灰胶囊外的白色虚线轮廓表示通信操作。AllGather、AllReduce 等名称规定数据交换语义。',training,"comm(30,65,'AllGather','gather',260)",[ref(T,'vocab'),ref(I)]);
add('callable','计算与程序','函数范围','分隔名称栏的容器表示函数的定义范围；函数内部可包含操作与控制流。',compiler,"boundary(45,30,230,120,'Function · projection')+op(65,85,'tile.matmul','op',190)",[ref(C,'outline'),ref(M,'structure-outline')]);
add('loop','计算与程序','循环','左括线与虚线边界表示重复执行范围；×4 表示示例迭代次数。',compiler,"loop(40,28,240,124,'for k · ×4')+op(62,85,'tile.matmul','op',195)",[ref(C,'objects'),ref(M,'structure-control')]);
add('kernel','计算与程序','核函数 · Kernel','10% 白色填充的函数范围与目标标签表示核函数；函数体可包含 OP 与循环。普通函数不自动等同于设备端入口。',compiler,"kernel(35,25,250,130,'projection','AIC')+op(69,84,'MatMul','op',182)",[ref(C,'objects'),ref(M,'structure-kernels')]);
add('task','计算与程序','任务 · Task','带 TASK 标签的卡片表示一次核函数调度；参数与依赖属于具体任务实例。卡片宽度不表示耗时。',compiler,"task(45,55,'T0 → projection',230).replace('#242424','#1e2a18').replace('stroke=\"#999\"','stroke=\"#B1EF6B\"')",[ref(C,'objects'),ref(M,'diagnosis-instance')]);
add('instruction','计算与程序','设备指令类别','紧凑窄条表达核函数内部执行动作。此处搬运、计算和同步是类别示意，不是实测指令序列。',compiler,"instruction(55,32,'搬运',210)+instruction(55,77,'计算',210)+instruction(55,122,'同步',210)",[ref(C,'objects')]);
add('ir','计算与程序','中间表示 · IR','中性灰范围内展示局部数据流。完整 IR 还包含函数、控制流、类型等信息。',compiler,"doc(80,67,'局部数据流')",[ref(C,'objects'),ref(M,'diagnosis-conditions')]);
add('pass','计算与程序','编译步骤 · Pass','中性灰窄矩形标注具名编译步骤；它分析或改写 IR，不表示运行时任务。',compiler,"pass(30,70,'ConvertTensorToTileOps')",[ref(C,'objects'),ref(M,'diagnosis-conditions')]);
add('rank-training','部署与并行','Rank 容器 · 训练图','容器内表示一个进程持有的数据与计算。训练报告的教学配置假设一个进程独占一张设备。',training,"frame(40,25,240,130,'Rank 0')+tensorNode(65,88,190,'W₀',G,'weight')",[ref(T,'vocab')]);
add('rank-inference','部署与并行','Rank 标识 · 推理图','带四角圆点的板卡形标识指定组内的进程编号；设备绑定另行说明，外形不编码硬件规格。',inference,"rankNode(70,30,180,120,'rank 0',true)",[ref(I)]);
add('container','部署与并行','Layer／Stage／集群边界','细框表达结构或部署范围，标签决定具体层级；边界的包含关系不自动表示执行时间。',inference,"frame(35,25,250,130,'Stage 0')+op(160,86,'Layer',180)",[ref(I),ref(T)]);
for(const [id,title,desc] of [['data','编译数据依赖','浅灰实线与双折角箭头连接计算值和消费该值的操作。'],['call','调用／引用','灰色长虚线、开口箭头表达 Task 对核函数的调用或程序中的函数调用。'],['dependency','任务依赖','实线开口箭头表达前置任务完成条件，线长不表示等待时间。'],['binding','存储绑定','以圆端点连接逻辑值与存储引用，表达存放关系。'],['mapping','跨阶段对应','点线与空心菱形表示已核对或明确标注的教学对应；本身不增加运行依赖。']])add(id,'连线与关系',title,desc,compiler,`line(45,90,275,90,'${id}')`,[ref(C,'relations'),ref(M)]);
add('forward','连线与关系','模型前向依赖','实线箭头连接产生数据与消费数据的计算节点。颜色和箭头外形保留模型报告的约定。',transformer,"arrow(45,90,275,90)",[ref(F,'step-2'),ref(D),ref(I),ref(T)]);
add('backward','连线与关系','反向求导关系','青色虚线指向上游，表示反向传播关系；简写图不能代替完整求导计算图。',transformer,"arrow(275,90,45,90,'gradient')",[ref(F,'step-12'),ref(D),ref(T)]);
add('parameter-read','连线与关系','固定参数读取','推理报告用蓝紫色虚线表示读取参数；应与青色梯度反向关系区分。',inference,"arrow(45,90,275,90,G,true)",[ref(I)]);
add('memref','内存与检查','存储引用 · MemRef','暖沙色槽形标识存储引用；多个值可共享引用，MemRef 与底层分配身份及物理硬件分别理解。',compiler,"buffer(40,62,'MemRef · B0',240)",[ref(C,'objects'),ref(M,'memory-objects')]);
add('address','内存与检查','地址区间','带刻度的区间表示某一内存空间内的字节范围，必须同时标明空间、偏移与单位。',compiler,"address(45,30,230,'Vec · 地址域',.5)",[ref(C,'memory'),ref(M,'memory-address')]);
add('lifetime','内存与检查','静态生命周期','条带沿定义／使用位置延展，用于说明哪些值需要同时保留；横轴不是设备运行时间。',memory,"lifeChart(false,130)",[ref(M,'memory-lifetime')],'30 40 740 310');
for(const [id,status,title,desc] of [['verified','ok','检查通过','勾号表示指定检查在该快照通过；仅覆盖所述性质与检查范围。'],['failed','fail','检查失败','叉号表示指定检查失败；需要结合前后快照与检查覆盖定位偏离区间。'],['invalidated','off','验证记录失效','实线圆与横线表示旧验证保证不再适用，需要重新检查。'],['unknown','unknown','缺少检查记录','虚线圆与横线表示未获得检查记录，不能解释为通过或失败。']])add(id,'内存与检查',title,desc,checks,`mark(160,88,'${status}','first',28)`,[ref(M,'diagnosis-first')]);
const runtime=load('pypto-runtime-evidence-guide/index.html','let page=0');
add('time-event','内存与检查','执行时间区间','事件条对应时间轴上的执行区间；只有标注单位与时间证据后，长度才可以用于比较耗时。',runtime,"bar(45,65,230,'任务执行','wait')",[ref(M,'diagnosis-wait')]);
add('wait-interval','内存与检查','调度到开始的间隔','dispatch 与 start 之间的区间表示待解释的时间间隔，单凭间隔不能判定依赖、排队或资源竞争。',runtime,"bar(45,65,230,'dispatch → start','wait','#555555')",[ref(M,'diagnosis-wait')]);
add('completed-block','数据与状态','已完成归约的分块','训练通信示例通过加粗边框与底色强调已完成归约的分块；颜色仍表示所承载的数据。',training,"vector(82,77,[10,20,30,40,50,60],P,'done','归约完成','complete')",[ref(T,'ring')]);
add('pending-block','数据与状态','未完成归约的分块','与完成态使用相同颜色、尺寸与元素数量；细边框与较浅底色表示尚未完成归约。示例值为本地贡献或部分和，不能等同于未参与或未选中。',training,"vector(82,77,[1,2,3,4,5,6],P,'pending','未完成归约','pending')",[ref(T)]);
add('expert-inactive','计算与程序','未选中的专家','降低轮廓与参数网格的亮度，表达当前 token 路由中未选中的专家；专家参数仍然存在。',dense,"expert('e2',90,40,140,92,false)",[ref(D)]);
const V=require('./visual-system.js');
for(const id of ['add','multiply'])rows.find(r=>r.id===id).svg=V.wrap(V.node(id,id+'-example','',136,66),320,180);
for(const [id,label] of [['instruction','DataCopy'],['task','任务 0 → projection']]){
 const row=rows.find(r=>r.id===id);
 row.svg=V.wrap(V.node(id,id+'-example',label,30,60),320,180);
 row.desc=id==='instruction'?'亮绿色实心条与终端图标表示设备执行动作。DataCopy 为搬运指令的示意名称，不代表某个 ISA 的具体操作码。':'亮绿色实心条与调度图标表示一次核函数调度，任务 0 是示例中的第 0 个任务实例，projection 是目标核函数。与设备指令共用样式，但语义层级不同。';
}
const rankRow=rows.find(r=>r.id==='rank-training');
const compactRank=rows.find(r=>r.id==='rank-inference');
// Both representations share the exact same board, pins, scale and label style.
rankRow.svg=compactRank.svg.replace('aria-label="Rank 标识 · 推理图"','aria-label="Rank 容器 · 训练图"').replace('class="rank-label" x="160" y="90"','class="rank-label" x="160" y="65"').replace('</svg>',inference.run("tensor(160,94,'W₀',126,G)")+'</svg>');
const system=require("./system-catalog.cjs").filter(e=>!['system-multiply','system-communication','system-function'].includes(e.id));
Object.assign(system.find(e=>e.id==='system-add'),{title:'逐元素加／乘',legacy:['add','multiply']});
Object.assign(system.find(e=>e.id==='system-op'),{title:'计算与通信操作'});
const byId=Object.fromEntries(rows.map(r=>[r.id,r]));
function montage(entries,cols=2,dividers=false){const cw=220,ch=160,w=cw*cols,h=Math.ceil(entries.length/cols)*ch;return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${dividers?`<g data-layout="3x3" fill="none" stroke="#353535" stroke-width="1"><rect x=".5" y=".5" width="${w-1}" height="${h-1}"/>${Array.from({length:cols-1},(_,i)=>`<path d="M${(i+1)*cw} 0V${h}"/>`).join('')}${Array.from({length:Math.ceil(entries.length/cols)-1},(_,i)=>`<path d="M0 ${(i+1)*ch}H${w}"/>`).join('')}</g>`:''}${entries.map(([label,svg],i)=>`<image x="${i%cols*cw}" y="${Math.floor(i/cols)*ch+20}" width="220" height="130" href="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"/><text x="${i%cols*cw+110}" y="${Math.floor(i/cols)*ch+18}" text-anchor="middle" fill="#ababab" font-size="12" font-family="system-ui">${label}</text>`).join('')}</svg>`}
const overrides={'system-value':['matrix','vector','tile','activation','weight','aggregate','gradient','optimizer','kv','completed-block','pending-block'],'system-op':['model-op','ir-op','router','communication'],'system-rank':['rank-training','rank-inference']};
const extra=[['expert','MoE 专家',['expert','expert-inactive']],['token','Token',['token']],['ir','中间表示 · IR',['ir']],['task-dependency','任务依赖',['dependency']],['backward','反向求导关系',['backward']],['parameter-read','参数读取',['parameter-read']],['lifetime','静态生命周期',['lifetime']],['checks','检查结果',['verified','failed','invalidated','unknown']],['runtime-intervals','执行与等待区间',['time-event','wait-interval']]];
for(const [id,title,ids] of extra)system.push({id, title,cat:['task-dependency','backward','parameter-read'].includes(id)?'关系':'对象',legacy:ids,layer:'system',desc:ids.map(k=>byId[k].desc).join(' '),note:''});
for(const e of system){
 const ids=overrides[e.id]||e.legacy||[];e.legacy=ids;
 const refs=[...(e.refs||[]),...ids.flatMap(id=>byId[id].refs)];
 e.refs=refs.filter((r,i)=>refs.findIndex(x=>x.id===r.id&&x.anchor===r.anchor)===i);
 e.variants=ids.map(id=>({id,title:byId[id].title,desc:byId[id].desc}));
 if(e.id==='system-value'){e.title='数据';e.svg=montage([['折叠表示',e.svg],...ids.map(id=>[byId[id].title,byId[id].svg])],4);}
 else if(!e.id.startsWith('pattern-'))e.svg=ids.length===1?byId[ids[0]].svg:montage(ids.map(id=>[byId[id].title,byId[id].svg]));
 if(['system-task','system-instruction'].includes(e.id))e.desc=byId[ids[0]].desc;
 if(e.id==='system-storage'){e.title=byId.address.title;e.desc=byId.address.desc;}
}
for(const e of system)if(e.cat==='组合模式')e.layer='pattern';
const order=['system-value','token','system-op','system-add','expert','system-loop','system-kernel','system-task','system-instruction','system-rank','system-memref','system-storage','lifetime','ir','system-pass','relation-data','parameter-read','backward','relation-call','task-dependency','relation-binding','relation-mapping','checks','runtime-intervals','pattern-compute','pattern-distribution','pattern-storage'];
if(system.some(e=>!order.includes(e.id)))throw Error('Unplanned legend order');
system.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));

// Function scope is represented by the kernel container, not a separate card.
const kernelCard=system.find(e=>e.id==='system-kernel');
kernelCard.legacy.push('callable');
kernelCard.refs.push(...byId.callable.refs.filter(r=>!kernelCard.refs.some(x=>x.id===r.id&&x.anchor===r.anchor)));
kernelCard.desc=byId.kernel.desc;
const excluded={'container':'用户要求移除：Layer／Stage／集群边界不作为通用图例。'};
const coverage=Object.fromEntries(rows.filter(r=>!excluded[r.id]).map(r=>[r.id,system.filter(e=>e.legacy.includes(r.id)).map(e=>e.id)]));
if(Object.values(coverage).some(ids=>!ids.length))throw Error('Uncovered source legend');
// Apply only user-approved review snapshots; preserve rejected/pending originals.
const approvalPath=path.join(__dirname,'style-approval.json');
if(fs.existsSync(approvalPath)){
 const approval=JSON.parse(fs.readFileSync(approvalPath,'utf8'));
 for(const decision of approval.items){
  const item=system.find(e=>e.id===decision.id);
  if(!item)throw Error('Unknown approved legend: '+decision.id);
  if(decision.decision==='approved')item.svg=decision.candidate;
 }
}
// Approved Layer Stack extractions are self-contained snapshots with source provenance.
const layerExtract=JSON.parse(fs.readFileSync(path.join(__dirname,'layer-extract.json'),'utf8'));
const layerFile='../layer_stack/pangu-layer-stack_2.html';
sources.push({id:'layer-stack-demo',title:'Layer Stack · 正式 Demo',file:layerFile,url:'../../../../layer_stack/pangu-layer-stack_2.html',sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,layerFile))).digest('hex'),kind:'demo'});
const layerItems=layerExtract.extracts.map(e=>({id:'layer-'+e.id,title:e.title,cat:e.id.endsWith('-pattern')?'组合模式':['forward','backward','parameter'].includes(e.id)?'关系':'对象',layer:e.id.endsWith('-pattern')?'pattern':'system',desc:e.note,note:'提取位置：'+e.source,refs:[{id:'layer-stack-demo'}],legacy:[],svg:e.svg,provenance:layerExtract.sources}));
const firstPattern=system.findIndex(e=>e.layer==='pattern');
system.splice(firstPattern,0,...layerItems.filter(e=>e.layer==='system'));
system.push(...layerItems.filter(e=>e.layer==='pattern'));
// Data identity owns its role, sampling and progress representations.
const dataCard=system.find(e=>e.id==='system-value');
const samples=layerItems.filter(e=>['layer-sample','layer-sample-gray'].includes(e.id));
const roleExamples=[['激活','#B1EF6B'],['参数','#BCA0F3'],['聚合','#F2C45F'],['梯度','#79D4F2'],['优化器','#B0B0B0']];
const roleSvg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 180">${roleExamples.map(([label,color],i)=>`<g transform="translate(${i*96+6} 55)"><rect width="84" height="48" rx="4" fill="#111" stroke="${color}"/>${Array.from({length:8},(_,j)=>`<rect x="${6+j%4*19}" y="${6+Math.floor(j/4)*19}" width="15" height="15" fill="${color}" fill-opacity=".25"/>`).join('')}<text x="42" y="76" text-anchor="middle" fill="${color}" font-size="13" font-family="system-ui">${label}</text></g>`).join('')}</svg>`;
const dataTiles=[
 ['折叠值 / Tile',V.render('system-value')],['展开矩阵',byId.matrix.svg],['数值向量',byId.vector.svg],
 ['数据角色',roleSvg],['KV cache',byId.kv.svg],['分块状态',montage([['归约完成',byId['completed-block'].svg],['未完成归约',byId['pending-block'].svg]])],
 ['局部异常采样',samples[0].svg],['灰度采样矩阵',samples[1].svg]
];
dataCard.tiles=dataTiles.map(([title,svg],i)=>({id:`data-${i+1}`,title,svg}));
dataCard.svg=montage(dataTiles,3);
dataCard.refs.push({id:'layer-stack-demo'});
dataCard.variants.push(...samples.map(e=>({id:e.id,title:e.title,desc:e.desc})));
dataCard.note='同一数据对象的表示与角色集中展示；Tile 的形状和类型属于值的元数据。角色网格不编码元素数量；展开矩阵与数值向量保留各自尺度。采样示例不代表完整张量或实测数据。';
dataCard.incorporated=samples.map(e=>({id:e.id,svg:e.svg,provenance:e.provenance}));
for(const e of samples)system.splice(system.findIndex(x=>x.id===e.id),1);

const out={sources,items:system,coverage,excluded};
fs.writeFileSync(path.join(__dirname,'coverage.json'),JSON.stringify(coverage,null,2));
fs.writeFileSync(path.join(__dirname,'inventory.json'),JSON.stringify({sources,items:out.items.map(({svg,...r})=>r)},null,2));
const template=fs.readFileSync(path.join(__dirname,'template.html'),'utf8');
fs.writeFileSync(path.join(__dirname,'index.html'),template.replace('/* VISUAL_SYSTEM */',()=>fs.readFileSync(path.join(__dirname,'visual-system.js'),'utf8')).replace('/* LEGEND_DATA */',JSON.stringify(out).replace(/</g,'\\u003c')));
console.log(`${sources.length} reports / ${system.length} cards covering ${Object.keys(coverage).length} source legends (${Object.keys(excluded).length} explicitly excluded)`);
