# 片上内存复用：从张量生命期到地址分配

图解系列 02，2026-10-10，**已完成，用户已指示继续下一篇**。

入口：[index.html](index.html)。单文件 HTML，内联 CSS、JavaScript、SVG 和真实案例摘录；正文与交互无需网络。来源链接需联网或保留仓库目录。系列计划：[PyPTO 图解报告系列计划](../../PyPTO_图解报告系列计划.md)。

## 讲解与交互

11 节：封面、值与存储、生命周期、生命周期干涉、MemRef 共享、复用约束、流水与别名、地址分配、规划器配置、编译产物、分析流程。

- 三个 4 KiB Tile 的教学主线：改变 A 的最后使用位置，观察冲突关系与复用机会。
- 独立分配 / 合法复用：3 槽 12 KiB 与 2 槽 8 KiB 的存储绑定、地址布局对照。
- 约束对照：空间隔离、跨 dtype 复用、升精度 cast 的 no-alias 限制，以及流水并发和视图别名。
- 真实案例：`copy_hidden` 的 BF16 → FP32 与 `copy_out` 的 FP32 → BF16；可切换图、地址字段和原始 IR 摘录。
- 图元点击与键盘释义、底部章节导航、方向键翻页、info、缩放拖动和适应画布。

沿用图解 01 的页面框架与交互，内嵌 `llm-compute-diagrams/assets/compiler-primitives.js`。绿色张量、紫色 OP、暖沙色存储和中性 Pass 保留既有语义。无向冲突边与数据、存储绑定、跨阶段对应分开表达。

## 内容依据与版本边界

1. 本地 MemoryReuse 文档（原 PyPTO3 路径：`../../repo/pto/docs/en/dev/passes/30-memory_reuse.md`）与实现（原 PyPTO3 路径：`../../repo/pto/src/ir/transforms/memory_reuse_pass.cpp`）：按空间分组、最大优先装箱、`can_share`、no-alias、流水约束；当前实现不要求 shape / dtype / TileView 完全相同。
2. 本地 AllocateMemoryAddr 实现（原 PyPTO3 路径：`../../repo/pto/src/ir/transforms/allocate_memory_addr_pass.cpp`）：按分配 base 分组，保留成员偏移，更新变量类型上的 MemRef。该文件第 105 行明确 Ptr 类型的 `tile.alloc` 无需特殊改写；本地文档中“改写 alloc 地址参数”的说法滞后，报告未沿用。
3. 本地 PassManager（原 PyPTO3 路径：`../../repo/pto/python/pypto/ir/pass_manager.py`）用于确认 PYPTO / PTOAS 路径。[官网 MemoryReuse](https://www.pypto.ai/pypto/dev/passes/36-memory_reuse/)与[官网 AllocateMemoryAddr](https://www.pypto.ai/pypto/dev/passes/37-allocate_memory_addr/)仅补充规划器边界，特别标记 DSA_RP 与本地版本差异。
4. 原始 memory map（原 PyPTO3 路径：`../assets/32_after_AllocateMemoryAddr.memory_map.json`）的两个函数原样提取至 [evidence.json](evidence.json)，同一摘录内嵌在 HTML，保留原文件 SHA-256。`backend.detected=false`，报告不把 `limit` 当作本机实测容量。
5. Memory Inspector 的字段与异常判定（原 PyPTO3 路径：`../memory-inspector/memory-map-abnormality-guide.md`）用于解释源码行生命期、alias 合并及高水位。Transform Explorer（原 PyPTO3 路径：`../pass-transform-explorer/index.html`）用于说明怎样回查同一编译的前后 IR；最终导出本身不能证明首次合并发生在哪个 Pass。

教学主线假设顺序执行、同一 Vec 空间、每个值 4 KiB，无额外保留区、视图或流水。生命期横轴是语句位置，不是设备运行时间。复用后占用更少不直接推出加速比例。

## 验证记录

- 内联脚本解析通过；没有外部运行资源或 fetch；10 个本地来源目标存在。
- 两个证据函数与原始 JSON 深度一致；检查原始分配大小和区间，高水位分别为 24576 B、16384 B。
- 浏览器 1440×900：10 个正文页面、18 个展示状态无页面横向溢出或图中文字出界，未记录 JavaScript 错误；发现的一处生命期标题与刻度相交已修正并复查。
- 实际验证键盘 Enter 释义、info / Escape、缩放、拖动、适应、真实案例与原始 IR 联动。
- 390×844：封面、生命期、安全条件、证据、完整图无页面横向溢出，info 位于视口内；画布固定高度，可缩放查看细节。
- 通过本地 HTTP 预览验证；未运行 PyPTO 编译器、设备性能实验或独立 `file://` 浏览器测试。

2026-10-10：用户已指示继续第三篇。

## 术语与文案校订（2026-10-10）

全篇标题、导航、正文、图注和图元释义改用明确的对象与分析行为，统一使用生命周期、生命周期干涉、MemRef 共享、缓冲区、地址分配等术语。删除“接用”“守住”“空档”等口语化比喻，以及“把值连起来”等以绘图动作代替技术概念的标题。

生命周期干涉图明确标注为教学构造，表示复用的约束条件，不表示已发生的地址冲突；MemRef 与 base、底层分配、字节偏移分别解释。数值示例与原始编译产物保持不变。

## 迁移记录

2026-10-10：正式文件迁入 `reports/llm-compute/`，原 Design 路径保留相对符号链接。正文与嵌入数据离线可用；未随附的原仓库材料显示为来源说明，不保留失效超链接。

[系列计划](../../PyPTO_图解报告系列计划.md)

## 2026-10-12 全系列内容消融

原版保留作为详细对照；标题和未定义符号已校订。推荐从[单篇完整报告](../pypto-guides/index.html)阅读；[逐节删并依据](../pypto-guides/MERGE-REVIEW.md)记录全部61节的去向。尚未进行读者实验。
