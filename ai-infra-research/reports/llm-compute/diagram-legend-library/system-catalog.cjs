const V=require('./visual-system.js');
const C='pypto-compilation-guide',M='pypto-guides',T='training-parallel-communication';
const records=[
 ['system-value','对象','数据值','同一个值通过稳定 ID 关联折叠表示、矩阵展开与数值向量。参数、激活、聚合结果和梯度是数据角色；shape 是对象元数据。',[C,T],['activation','weight','aggregate','gradient','optimizer','matrix','vector','tile','kv','completed-block','pending-block']],
 ['system-op','对象','计算操作','具名计算操作采用统一胶囊。模型层操作与 IR 操作通过名称、所属层级和来源区分，跨阶段对应需要变换证据。',[C,T],['model-op','ir-op','router']],
 ['system-add','对象','逐元素相加','圆形加号保留独立形态；输入形状与广播条件由操作定义决定。',[C,T],['add']],
 ['system-multiply','对象','逐元素相乘','圆形乘号表示逐元素或广播相乘；矩阵乘法使用 MatMul 操作。',[T],['multiply']],
 ['system-communication','对象','通信操作','胶囊加虚线轮廓标识通信操作，具体集合通信语义由名称明确。',[T],['communication']],
 ['system-function','对象','函数定义','名称栏与函数体范围分开；折叠和展开对应同一函数身份。',[C,M],['callable']],
 ['system-kernel','对象','核函数','设备端入口函数；执行目标属于元数据，任务实例另行表示。',[C,M],['kernel']],
 ['system-task','对象','调度任务','一次核函数调度具有独立任务身份；不与函数定义或设备指令合并。',[C,M],['task']],
 ['system-instruction','对象','设备指令','窄条保留执行动作层级；没有真实指令记录时只展示类别示意。',[C],['instruction']],
 ['system-loop','对象','循环范围','左括线与虚线范围表达控制结构；迭代次数不是设备数量。',[C,M],['loop']],
 ['system-rank','对象','Rank 进程','部署容器具有稳定进程身份；设备绑定和并行组分别记录，容器外形不代表硬件规格。',[T],['rank-training','rank-inference','container']],
 ['system-memref','对象','存储引用','槽形表示 MemRef，记录底层分配身份、偏移与访问范围；多个引用可关联同一分配。',[C,M],['memref']],
 ['system-storage','对象','底层存储分配','独立记录分配 ID、内存空间和字节容量；逻辑值与分配不是同一对象。',[M],['address']],
 ['system-pass','对象','编译步骤','窄矩形表达分析或变换步骤；名称和版本用于追溯，不表示运行任务。',[C,M],['pass']],
 ['relation-data','关系','数据依赖','从生产者指向消费者；线长不编码运行耗时。',[C,T],['data','forward']],
 ['relation-call','关系','调用','虚线开口箭头连接调用方与函数定义，区别于值的数据依赖。',[C],['call']],
 ['relation-binding','关系','存储绑定','圆端点连接值或视图与存储引用；不是计算顺序。',[C,M],['binding']],
 ['relation-mapping','关系','跨阶段对应','点线空心菱形表示有证据支持的对应；不暗示新增运行依赖。',[C,M],['mapping']],
 ['pattern-compute','组合模式','参数化计算','X [2,4] 与参数 W [4,3] 输入 MatMul，输出 Y [2,3]。参数和输入作为独立数据对象连接操作；展开使用统一 24 单位格距。',[C,T],['activation','weight','model-op','data']],
 ['pattern-distribution','组合模式','分片／复制／部分结果','同一布局比较三种分布语义：分片覆盖不同索引范围，复制持有同一逻辑值，部分结果需要归约组合。TP 外侧标记不覆盖内部数据角色色。',[T],['rank-training','weight','aggregate','communication']],
 ['pattern-storage','组合模式','值／视图／存储','连续 FP16 数据 V [4,4] 占 32 B；后两行视图 [2,4] 引用同一分配的 [16,32) B。值、视图、MemRef 与底层分配分别标识。',[M,C],['tile','memref','address','binding']],
];
module.exports=records.map(([id,cat,title,desc,refs,legacy])=>({id,cat,title,desc,refs:refs.map(id=>({id})),legacy,layer:'system',note:'统一规则 v1 · 基于来源图元整理的设计规则与教学示例，并非来源报告的原始截图或实际运行记录。',svg:V.render(id)}));
