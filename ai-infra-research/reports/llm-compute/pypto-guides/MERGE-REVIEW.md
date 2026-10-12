# 六篇图解报告的内容消融与合并试读

日期：2026-10-12。技术依据沿用原报告标注的 2026-10-10 材料，本次不重新宣称源码版本核验。

[三篇试读与三组对照](comparison.html)。原六篇仍保留；baseline.json 保存本轮修改前的全部章节、正文、图示状态与 HTML 哈希。

## 实验方法

本次是可复查的编辑消融，不是读者理解度实验。固定原有技术问题与证据范围，依次比较：A0 原六篇；A1 仅删除背景、图例与总结页；A2 按计算结构、存储约束、异常调查合并并重写。用十个固定问题核对内容是否仍有明确去处。字数按正文段落的 Unicode 字符数计，含原有内联标签；不计图注、释义和折叠材料，不等同于阅读时长。

|版本|篇数|正文节数|图示状态|正文字符数|
|---|---:|---:|---:|---:|
|A0 原六篇|6|61|111|11841|
|A1 只删重复背景与总结|6|45|87|8819|
|A2 合并并重写主线|3|31|76|4202|

## 结果与取舍

A1 将正文从61节减至45节，但删除图例后，跨阶段对应、调用与存储绑定的区别不再有统一说明；分散在六篇中的相同机制仍重复出现。因此没有把“仅删除”作为最终版本。

A2 将正文合并为31节，减少30节（49.2%）；图示状态从111减至76。图例移入 info，独有机制保留为同章状态，重复调查步骤集中到第三篇。十个问题均找到明确正文或图例落点，见下表；这是内容覆盖审查，不代表读者测试通过。

保留一个编译结构总览，因为它回答 OP、Kernel、Task 与指令属于什么层级；删除其他重复总览。保留非单调、规划器分支、类型转换的共享限制等反例，因为删去会改变适用范围。原始来源摘录继续可访问。

## 标题与符号自查

- 03 改为“分块、流水缓冲与任务依赖如何影响执行”。
- 04 改为“函数内联、区域提取与混合核拆分”，不再以 Callable 统称代替具体变换。
- 05 改为“从任务等待与性能下降追踪编译证据”。
- 06 改为用户认可的“Pass 的前置条件、产出性质与首次偏离定位”。
- 01 的图形介绍改为对象名称；02 标题已明确对象与过程，保留。
- 原06的 P/Q/R 没有真实对象身份，移除；明确标出 SSA 保证、类型检查和地址检查。快照使用“初始 IR、变换①后”等名称，并说明是构造步骤。
- 原02的 S1–S7 改为“语句1–语句7”，避免与快照编号混用。A/B/C Tile、矩阵 X/W/Y 和任务 A/B 在各自正文定义，不机械删除有定义的变量。

## 固定问题的覆盖复核

|检查项|问题|精简版落点|
|---|---|---|
|对象身份|Function、Call、Kernel、Task 分别是什么？|[主要说明](compilation.html#inline) / [补充](compilation.html#overview)|
|图例语义|数据依赖、调用、跨阶段对应能否区分？|[主要说明](compilation.html#overview) / [补充](compilation.html#outline)|
|函数变换|内联、提取与拆核的输出如何不同？|[主要说明](compilation.html#inline) / [补充](compilation.html#kernels)|
|共享约束|生命周期不重叠为什么还不能直接判定可共享？|[主要说明](memory-pipeline.html#constraints) / [补充](memory-pipeline.html#aliases)|
|证据边界|最终地址为什么不能定位首次复用 Pass？|[主要说明](memory-pipeline.html#evidence) / [补充](diagnosis.html#link)|
|层级区别|流水深度、保留缓冲数、任务数能否互换？|[主要说明](memory-pipeline.html#pipeline) / [补充](memory-pipeline.html#deps)|
|等待原因|没有 Ready 为什么不能判断资源等待？|[主要说明](diagnosis.html#wait) / [补充](diagnosis.html#instance)|
|检查状态|失效、失败和没采集检查是同一件事吗？|[主要说明](diagnosis.html#coverage) / [补充](diagnosis.html#first)|
|偏离范围|缺失快照或非单调检查怎样影响定位？|[主要说明](diagnosis.html#first) / [补充](diagnosis.html#checks)|
|收益证明|局部变化怎样通过实验验证收益？|[主要说明](diagnosis.html#critical) / [补充](diagnosis.html#experiment)|

## 逐节删并记录

|原章节|原标题|A1|A2 去向与理由|
|---|---|---|---|
|1:inherited|先保留数据与计算的视觉身份|移出主线|[查看](compilation.html#tensor)：张量角色与 shape 定义并入第一节；图例移入 info|
|1:objects|新增图元：程序结构与运行任务|移出主线|[查看](compilation.html#overview)：对象层级并入总览，保留 OP / Kernel / Task / 指令区别|
|1:relations|箭头先说明关系，再连接对象|移出主线|[查看](compilation.html#overview)：关系图例移入常驻可访问的 info，删独立教学页|
|1:tensor|从 XW 开始，明确输入与输出|保留|[查看](compilation.html#tensor)：保留图示，合并为同一读者问题下的状态切换|
|1:outline|把 InCore 计算区域提取为独立函数|保留|[查看](compilation.html#outline)：区域提取与报告04合并，保留跨边界输入输出|
|1:tile|数据角色不变，读写与 Tile 操作显式化|保留|[查看](compilation.html#tile)：保留图示，合并为同一读者问题下的状态切换|
|1:loop|沿 K 维切块，把一次乘法展开成累加|保留|[查看](compilation.html#loop)：保留图示，合并为同一读者问题下的状态切换|
|1:kernel|函数定义与一次任务提交分开看|保留|[查看](compilation.html#kernels)：纯核与混合分支由报告04的图承担；Task 在总览定义|
|1:memory|值绑定到缓冲，缓冲再获得地址|保留|[查看](memory-pipeline.html#objects)：存储入门归入第二篇，避免两处重复引入|
|1:evidence|对照真实 IR，核对 Tensor→Tile 变换|保留|[查看](compilation.html#evidence)：保留图示，合并为同一读者问题下的状态切换|
|1:overview|回到完整图：计算、程序与存储同时展开|移出主线|[查看](compilation.html#overview)：保留图示，合并为同一读者问题下的状态切换|
|2:objects|Tile 值、MemRef 与片上内存地址|保留|[查看](memory-pipeline.html#objects)：保留图示，合并为同一读者问题下的状态切换|
|2:lifetime|通过定义与使用关系分析生命周期|保留|[查看](memory-pipeline.html#lifetime)：保留图示，合并为同一读者问题下的状态切换|
|2:conflicts|生命周期干涉限制缓冲区复用|保留|[查看](memory-pipeline.html#lifetime)：保留图示，合并为同一读者问题下的状态切换|
|2:reuse|通过 MemRef 共享减少底层分配|保留|[查看](memory-pipeline.html#reuse)：保留图示，合并为同一读者问题下的状态切换|
|2:constraints|内存复用需要同时满足多项安全约束|保留|[查看](memory-pipeline.html#constraints)：保留图示，合并为同一读者问题下的状态切换|
|2:pipeline|流水并发与别名关系影响复用判定|保留|[查看](memory-pipeline.html#aliases)：按视图别名与流水缓冲拆分，分别放入对应机制|
|2:address|为复用后的分配确定片上内存地址|保留|[查看](memory-pipeline.html#address)：保留图示，合并为同一读者问题下的状态切换|
|2:planner|内存规划器配置决定 Pass 的职责|保留|[查看](memory-pipeline.html#address)：保留图示，合并为同一读者问题下的状态切换|
|2:evidence|从 cast 编译产物核对 MemRef 与地址|保留|[查看](memory-pipeline.html#evidence)：保留图示，合并为同一读者问题下的状态切换|
|2:overview|内存复用分析：从生命周期到地址布局|移出主线|[查看](memory-pipeline.html#address)：重复的检查流程去除，约束与地址在正文分别展开|
|3:scope|编译决策连接程序结构与执行约束|移出主线|[查看](memory-pipeline.html#tiling)：用户参数与编译选择边界随具体分块解释|
|3:tiling|分块改变循环次数与各空间的数据量|保留|[查看](memory-pipeline.html#tiling)：保留图示，合并为同一读者问题下的状态切换|
|3:cost|合法候选还需比较搬运、计算与写回成本|保留|[查看](memory-pipeline.html#tiling)：保留图示，合并为同一读者问题下的状态切换|
|3:pipeline|流水展开为后续重叠提供独立值与存储约束|保留|[查看](memory-pipeline.html#pipeline)：保留图示，合并为同一读者问题下的状态切换|
|3:capacity|请求深度与可保留缓冲份数可能不同|保留|[查看](memory-pipeline.html#pipeline)：保留图示，合并为同一读者问题下的状态切换|
|3:reuse|共享地址可增加迭代间的读后写约束|保留|[查看](memory-pipeline.html#sync)：保留图示，合并为同一读者问题下的状态切换|
|3:deps|任务依赖依据存储区域与读写冒险推导|保留|[查看](memory-pipeline.html#deps)：保留图示，合并为同一读者问题下的状态切换|
|3:evidence|编译提示、地址变化与运行等待需要逐项对应|移出主线|[查看](diagnosis.html#link)：提示、IR、地址、trace 的对应统一在调查篇解释|
|3:experiment|一次实验检验一个可证伪的性能假设|移出主线|[查看](diagnosis.html#experiment)：保留分块实验的具体假设，合并重复实验步骤|
|3:overview|并行与流水需要结合结构、存储和执行证据分析|移出主线|[查看](memory-pipeline.html#sync)：总览重复的机制由分块、流水、同步三节承载|
|4:objects|先区分函数定义、调用点和执行实例|移出主线|[查看](compilation.html#inline)：Function/Call 在内联定义，Kernel/Task 在核函数和总览定义|
|4:calls|一个 Inline helper 被两处调用|移出主线|[查看](compilation.html#inline)：两个调用点与内联前后合为一节|
|4:inline|调用点被替换为各自的函数体副本|保留|[查看](compilation.html#inline)：保留图示，合并为同一读者问题下的状态切换|
|4:outline|计算区域变成函数，边界值形成接口|保留|[查看](compilation.html#outline)：保留图示，合并为同一读者问题下的状态切换|
|4:signature|Tensor→Tile 变换可能同时改变调用接口|保留|[查看](compilation.html#tile)：保留图示，合并为同一读者问题下的状态切换|
|4:mixed|混合 InCore 被分解为 AIC 与 AIV|保留|[查看](compilation.html#kernels)：保留图示，合并为同一读者问题下的状态切换|
|4:pure|纯 Cube 或纯 Vector 不必拆成两个函数|保留|[查看](compilation.html#kernels)：保留图示，合并为同一读者问题下的状态切换|
|4:control|相同操作名可以出现在不同控制范围|保留|[查看](compilation.html#control)：保留图示，合并为同一读者问题下的状态切换|
|4:identity|函数名是定位线索，不能独立证明来源|保留|[查看](compilation.html#identity)：保留图示，合并为同一读者问题下的状态切换|
|4:overview|沿计算范围追踪，同时保留每次边界变化|移出主线|[查看](compilation.html#identity)：变换总结并入对应依据，删第二个流程总览|
|5:contract|先确认比较的是同一项工作|保留|[查看](diagnosis.html#instance)：工作负载与计时条件并入调查对象|
|5:instance|从函数汇总定位到一次任务执行|保留|[查看](diagnosis.html#instance)：保留图示，合并为同一读者问题下的状态切换|
|5:wait|dispatch 到 start 的间隔是观察结果|保留|[查看](diagnosis.html#wait)：保留图示，合并为同一读者问题下的状态切换|
|5:hypothesis|同一段空闲可以有不同解释|保留|[查看](diagnosis.html#wait)：保留图示，合并为同一读者问题下的状态切换|
|5:critical|依赖下界和实际完成时间回答不同问题|保留|[查看](diagnosis.html#critical)：保留图示，合并为同一读者问题下的状态切换|
|5:link|建立 Task 到编译产物的可靠对应|保留|[查看](diagnosis.html#link)：保留图示，合并为同一读者问题下的状态切换|
|5:compile|相邻 IR 证明结构变化，不能单独证明性能原因|保留|[查看](diagnosis.html#link)：保留图示，合并为同一读者问题下的状态切换|
|5:failure|没有可运行产物时，转向编译诊断|移出主线|[查看](diagnosis.html#repro)：编译失败分支并入最小复现，保留失败类别区别|
|5:experiment|把假设变成一个可以被否定的实验|保留|[查看](diagnosis.html#experiment)：保留图示，合并为同一读者问题下的状态切换|
|5:overview|将观察、推断与验证结论分开交付|移出主线|[查看](diagnosis.html#experiment)：观察/假设/验证不再独立复述；作为各节的具体边界|
|6:contract|Pass 的契约描述输入要求与输出保证|保留|[查看](diagnosis.html#conditions)：定义与真实性质例子合为一节|
|6:chain|后续 Pass 需要的性质应有明确来源|保留|[查看](diagnosis.html#conditions)：保留图示，合并为同一读者问题下的状态切换|
|6:declaration|声明产生性质，不等于已经运行检查|移出主线|[查看](diagnosis.html#coverage)：声明与实际运行检查并入验证范围|
|6:coverage|自动验证与逐 Pass 验证覆盖范围不同|保留|[查看](diagnosis.html#coverage)：保留图示，合并为同一读者问题下的状态切换|
|6:window|性质可以被建立、失效并重新建立|保留|[查看](diagnosis.html#coverage)：保留图示，合并为同一读者问题下的状态切换|
|6:first|对同一谓词比较相邻快照|保留|[查看](diagnosis.html#first)：保留图示，合并为同一读者问题下的状态切换|
|6:nonmonotone|失败可能在后续变换中暂时消失|保留|[查看](diagnosis.html#first)：保留图示，合并为同一读者问题下的状态切换|
|6:blindspots|验证器通过只覆盖其实际检查的规则|保留|[查看](diagnosis.html#checks)：保留图示，合并为同一读者问题下的状态切换|
|6:repro|保留触发条件，缩小无关程序范围|保留|[查看](diagnosis.html#repro)：保留图示，合并为同一读者问题下的状态切换|
|6:overview|用明确性质连接诊断与变换边界|移出主线|[查看](diagnosis.html#first)：不再用未知 P/Q/R 复述流程，保留具体检查区间|

## 尚未验证

未组织读者实验，没有理解准确率、阅读时长或偏好评分。按仓库约定未默认执行浏览器自动化，布局与视觉验收待用户反馈。静态脚本、状态、链接和 SVG 验证记录见 validation.json；不能据此声称视觉验收通过。

## 复现

运行 `node build.cjs` 生成三篇离线 HTML；运行 `python3 audit.py` 生成对照入口、统计及本报告；运行 `node validate.cjs` 检查精简版，再运行 `python3 validate-svg.py` 核对 SVG。baseline.json 是本轮固定基线，生成器不覆盖它。
