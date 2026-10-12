# PyPTO 图解系列统一自查

核对日期：2026-10-10。范围是计划中的六篇报告，67 节（含封面）、111 种正文图示状态。六篇内容已生成；静态验证完成；浏览器布局和视觉验收尚未执行。目标仓库明确不默认进行浏览器自动化或截图，因此不将静态通过写成视觉已验收。

## 1. 哪些可以收录成新的图元

现有 Tensor 网格、OP 胶囊、Callable/Kernel 范围、Task、MemRef、地址区间、Pass、阶段 IR 和六类关系线已足够表达基础对象。**优先收录新的组合模式，而不是给每个术语创造一个新图标。** 以下均为候选，尚未宣称已成为 skill 的正式图元。

| 候选模式 | 本次实例 | 最小语义契约 | 复用边界 |
| --- | --- | --- | --- |
| 生命周期干涉图 | [02：干涉关系](../pypto-memory-reuse-guide/index.html#conflicts) | 节点为不同值，无向边为限定条件下的不可共享关系；说明别名/原地更新假设 | 不能改成执行箭头；不能冒充编译器直接输出 |
| 生命周期与地址联合图 | [02：生命期](../pypto-memory-reuse-guide/index.html#lifetime)、[地址](../pypto-memory-reuse-guide/index.html#address) | 轴单位必填：静态语句位置、字节偏移、所属空间；区分 base、view、高水位 | 不能用静态行号当设备时间；不同空间不能重叠到同一地址轴 |
| 跨阶段一对多对应 | [04：内联](../pypto-callable-evolution-guide/index.html#inline)、[混合拆核](../pypto-callable-evolution-guide/index.html#mixed) | 前后快照、源对象、后继集合、对应依据、未匹配状态 | 内联、提取、拆核是不同关系；名称相似不能自动画映射 |
| 观测区间与缺失时间字段 | [05：等待区间](../pypto-runtime-evidence-guide/index.html#wait) | 明确事件名、时间单位与事件是否采集；已知区间与未知内部原因分开 | 区间宽度不能直接编码根因；Ready 缺失不补估值 |
| 假设与证据缺口 | [05：竞争假设](../pypto-runtime-evidence-guide/index.html#hypothesis)、[关联](../pypto-runtime-evidence-guide/index.html#link) | 观察、多个假设、所需证据、反证条件；未确认关系不画实线事实边 | 是调查关系，不是程序数据流；不预填通过状态 |
| 性质有效范围与重新验证 | [06：验证窗口](../pypto-pass-contracts-guide/index.html#window) | 性质、产生点、失效点、再产生点、实际检查结果 | “无保证”“不适用”“未采集”“失败”必须区别；不是红绿两态 |
| 首次可观测偏离区间 | [06：首次偏离](../pypto-pass-contracts-guide/index.html#first) | 固定谓词与适用范围，保留相邻/缺失快照及通过/失败结果 | 不把检测点当根因；非单调序列禁止默认二分 |

建议先收录“跨阶段对应”“性质有效范围”“观测区间”三项：至少跨两种报告场景复用，能够减少最常见的语义误读。正式提取时应将数据契约、例图和反例一起交付；本次完成候选辨识，不擅自把未做视觉验收的组合加入通用图元库。

## 2. 报告之间是否有前后不一的概念

### 已实施修正

1. **01 的 outlining 输入表述存在歧义。** 原“外部使用的值成为参数”改为“区域外定义且区域内使用的值成为参数；区域内产生、区域外使用的值通过输出接口传回”，与 04 的输入/输出分析一致。
2. **02 的干涉图释义缺少限定条件。** 补充其教学例排除了语义别名与允许的原地更新，避免把“重叠值必须不共享”推广成所有情形的规则；正文已有原地端点例外。
3. **01 的 K 分块示例补充 C 初值为 0。** 与 03 的首次乘法、后续累加说明保持一致。
4. **02–06 的图元无障碍标签同步到各篇释义。** 共享图元的闭包原先仍取旧 glossary，导致图形点击解释已改成“证据关联”，aria-label 却可能仍写“跨阶段 IR 对应”。现在显式同步共享 glossary。
5. **04 和 06 的来源摘录校正。** 04 单独摘录跨核传输段落，避免夹入同文档中过时的 SplitVectorKernel 减半说明；06 roundtrip 引用改为真正包含往返检查及跳过条件的行段。

### 一致性核对表

| 概念 | 跨篇统一结论 | 核对章节 |
| --- | --- | --- |
| Callable / Function / Kernel / Task | Callable 为图解统称；定义、调用点和动态调度实例分开；不强制一一对应 | 01 objects/kernel；04 objects/calls；05 instance |
| Tensor / Tile / MemRef | 计算值与底层存储身份分开；共享地址不合并逻辑值 | 01 tile/memory；02 objects/reuse；03 reuse |
| 生命周期 / 运行时间 | 语句顺序用于静态分析，不等同设备执行时间 | 02 lifetime/pipeline；03 pipeline；05 wait/compile |
| 干涉 / 地址重叠 / 错误 | 干涉限制特定共享；同 base 重叠可能合法；是否错误需语义和时序证据 | 02 conflicts/constraints/evidence；05 compile |
| 分块 / 流水 / 任务并行 | L0 迭代、缓冲深度和 Task 数量是不同层级 | 01 loop；03 tiling/pipeline/deps；04 control |
| 混合拆核 / Vector split | 当前混合分解由 ExpandMixedKernel 处理；SplitVectorKernel 已不是减半驱动 | 01 kernel；04 mixed/pure；06 的当前版本边界 |
| AUTO 依赖 | 当前本地编译分析为 opt-in；不可把规则样例当默认全量行为 | 01 kernel；03 deps |
| 容量 / 性能 | 静态容量下降、模型成本降低和实测收益分别验证 | 02 address；03 cost/capacity；05 experiment |
| 首次变化 / 首次偏离 / 根因 | 有变化不等于异常；相同谓词首次失败只缩小检测区间；根因需机制与实验 | 04 identity；05 compile/failure；06 first/nonmonotone |
| 性质声明 / 验证结果 | produced 声明不等于本次执行了 verifier；检查通过仅覆盖实际规则 | 05 failure；06 declaration/coverage/blindspots |

### 来源材料自身的差异

- 当前 `SplitVectorKernel` 文档明确“不再减半”，但 `ExpandMixedKernel` 文档仍残留旧描述。第四篇只采用当前分工，摘录范围已避开旧表述。
- `00-pass_manager.md` 的自动验证小节写三个性质、每个只验一次；当前 `ir_property.cpp` 自动集合有 13 项，`passes.cpp` 会在 invalidation 后允许重新验证。第六篇以当前源码集合与逻辑为准，不复制过时数字。
- Pass Atlas 将 InitMemRef 的 SSAForm 失效解释成“一绑定物理 MemRef，一个名字一次赋值就不再成立”，这个推断过强。第六篇只陈述源码契约失效，不推导所有变量都被重新赋值。
- 早期 UX 报告建议用“op 数量守恒”做通用 verifier；合法内联、降级、融合和 DCE 都可能改变数量。第六篇明确它不是全流水线通用不变量。
- 01/02 的 DSA_RP 为已注明的官网版本分支；本地快照解释仍以 PYPTO/PTOAS 边界为准。未把官网编号与历史 run 编号强行对齐。

未修改这些研究来源文件，也未把它们的历史统计重新声明为当前事实。当前核对未发现上述核心概念仍有未处理的跨篇冲突；这不等于对整个编译器语义进行了形式化证明。

## 3. Insight 是否仍有未解释概念

**有。** 六篇覆盖编译结构、片上规划、决策、对象对应、诊断证据与性质契约，不能代替完整 AI Infra 知识体系。

[详细覆盖表](insight-coverage.md)包含全部 34 个 Markdown/HTML 内容文件的范围判定、12 组明确缺口与原文摘录；[可核对目录](insight-inventory.json)保留路径、标题和文件哈希。空的 `09lingqu.md` 已记录为空文件，不当作已经覆盖。

优先补充顺序建议：

1. **布局与坐标**：stride、offset、ND/DN/NZ、TileView；直接补足 01/02 的阅读前提。
2. **运行时资源与依赖**：task window、ring heap、dep pool、creator/tensormap/explicit、early resolve；不能与片上 MemRef 复用混为一谈。
3. **硬件性能下界**：Roofline、算术强度、访存事务、向量化与融合取舍；补足 03 的成本模型之外的硬件解释。
4. **独立专题**：训练 Tape/Checkpoint/梯度完成/回放，Serving KV/动态组批/P-D，TP/EP 集合通信，迁移与低精度数值验证。

上述是后续候选，不额外扩张本轮六篇计划，也不把“提过术语”计为已解释机制。

## 4. 可以 self-improve 的地方

| 改进 | 本轮实施 | 后续复用方式 |
| --- | --- | --- |
| 按声明核对具体源码，避免只依赖文档标题 | 核对 verifier 集合、失效重验和当前 split 分工；来源附行段与 SHA256 | 每篇建立“关键断言—来源—版本—适用条件”表；冲突时记录裁决 |
| 统一 glossary 与图元标签 | 已修正 02–06 的 aria-label / inspector 同源问题 | 图元接口显式接收 glossary，减少复制后闭包语义漂移 |
| 自动覆盖全部模式 | 新增可重复执行的六篇静态检查器，共 111 个正文状态 | 扩展新章节时自动检查模式、释义、来源锚点和 pages.json 一致性 |
| 区分测试证据强度 | 分别报告脚本、SVG、源码摘录和未执行的浏览器/编译测试 | 不把 VM 生成成功写成“交互、布局、性能均验证” |
| 概念覆盖先盘点再判断 | 34 文件清点，12 组缺口附原文片段 | 报告生成前先建立覆盖表，避免仅凭关键词检索声称完整 |
| 组合模式优先于新增图标 | 提出七类候选及每类误用边界 | 先拿多个真实场景检验，再进入 skill 通用图元库 |

使用 self-improvement 方法将“来源版本核查”和“静态验证边界/释义同步”整理为本仓库学习记录；未修改用户记忆目录，未把单次路径错误写成经验。

## 验证与复现

在本目录执行：

```sh
rtk node validate.cjs
rtk python3 validate-evidence.py --source-root /path/to/PyPTO3-main
```

第一条只需报告文件；第二条可选地使用源码仓库核对摘录，不是 HTML 运行依赖。报告本体不加载该仓库。

[validation.json](validation.json)记录六篇脚本、111 状态、释义键、来源锚点、章节数据、SVG XML、marker 引用和文本锚点边界的实际检查。33 条源码/材料摘录及哈希逐项匹配，第二篇两份函数的内存导出与原 JSON 完全一致。01/02 未随附的原仓库资料仍显示为说明文字，不伪造可点击路径。外部官网链接未在本轮逐一重新在线检查。

实际字体宽度、图形遮挡、桌面/窄屏布局与指针/键盘交互尚需视觉验收。没有执行编译、仿真或 Ascend 性能实验；报告不声称这些结果已被验证。
