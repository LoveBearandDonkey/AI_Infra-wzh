# PyPTO 编译流水线图解

入口：[index.html](index.html)。单文件 HTML，无外部脚本、字体、样式或网络数据依赖，双击可以离线阅读。官网链接与仓库相对来源链接并存；将 HTML 单独发送时，来源文件不会随之打包，正文和真实摘录仍可阅读。

## 内容与读者

面向正在建立 AI Infra 概念体系的产品、设计及开发者。12 个步骤包括封面、继承图元、新增对象、关系图例、Tensor、Callable、Tile、分块循环、核与任务、缓冲与地址、真实 IR 对照和完整图。

主线使用二维 XW 教学模型。混合计算拆核和两个独立值的内存复用为补充示例，不冒充主线实际编译结果。历史 `qk_pv` 证据作为单独案例，和当前源码机制分开。

## 图例契约

| 状态 | 对象 | 几何 / 配色 | 语义边界 |
| --- | --- | --- | --- |
| 继承 | 输入、中间值、输出 | 绿色正方形网格 `#B1EF6B` | 阶段变化不改变数据角色 |
| 继承 | 模型参数 | 蓝紫网格 `#BCA0F3` | Tile 化后仍保持参数身份 |
| 保留 | 聚合结果 / 梯度 | 黄 `#F2C45F` / 青 `#79D4F2` | 前向 MatMul 主线未单独展开；不挪作阶段色 |
| 继承 | 计算操作 | 中灰胶囊，高 48、圆角 24、字号 18；宽 140/260/360 | 计算操作与 Pass 区分 |
| 继承 | 逐元素 Add / Multiply | 直径均为 48 的圆形 ＋ / ×，符号采用居中矢量线 | MatMul 始终使用命名计算节点 |
| 新增修饰 | Tile | 统一张量细边框 + 低亮度网格底纹；对象名及 shape / 空间标签叠加在网格内 | 不宣称每个 Tile 独占存储 |
| 新增 | 循环范围 | 括线 + 迭代标签 | 包含关系、迭代次数；不表示设备数或时间 |
| 图解统称 | Callable（源码 Function） | 名称页签 + 中性范围框 | 定义，和调用实例区分 |
| 新增 | Task | 切角节点 + TASK 标识 | 提交身份，节点宽度无耗时意义 |
| 新增 | MemRef / 内存引用 | 中性双侧线存储槽 | 逻辑值通过存储绑定关联 |
| 新增 | 地址区间 | 带 B 单位刻度的轴 + 区间块 | 每个内存空间独立；半开区间 |
| 新增观察层 | Pass / 阶段 IR 文件 | 步骤标签 / 折角文档 | 编译行为与观察记录，不充当数据流节点 |

关系线：数据为浅灰白实线双折角箭头；调用为灰色长虚线空心箭头；任务依赖为带“先完成”的实线空心箭头；存储绑定为空心圆终点；跨阶段 IR对应为点线空心菱形。包含关系由范围框 / 括线表达。每种关系都有文字及点击释义。

## 证据与边界

- 视觉参考：AI Infra `reports/llm-compute/` 系列及 `methods/llm-compute-diagrams` 图例、讲解和交互约定。
- 当前编译机制：PassManager（原 PyPTO3 路径：`../../repo/pto/python/pypto/ir/pass_manager.py`） 与相应 Pass 文档。按 2026-10-10 工作区源码解释，未宣称是外部上游最新版。
- 当前源码中，PTOAS memory planner 可跳过 PyPTO 的机会性复用与地址分配；AUTO 编译期依赖分析默认关闭。报告明确这些条件，不把示意路径作为所有运行的固定序列。
- 历史原始证据：10_after_OutlineClusterScopes.py（原 PyPTO3 路径：`../../Data/DeepseekV4/_jit_l3_decode_csa_20260903_010617/passes_dump/10_after_OutlineClusterScopes.py`） 第 1543 行，以及 11_after_ConvertTensorToTileOps.py（原 PyPTO3 路径：`../../Data/DeepseekV4/_jit_l3_decode_csa_20260903_010617/passes_dump/11_after_ConvertTensorToTileOps.py`） 第 1661 行，同为 `qk_pv` 内的 MatMul。原语句与文件 SHA-256 已嵌入 HTML；只为了排版在赋值前换行。
- `K=256, k=64` 及 `4 KiB` 存储示例均为教学值，不作为自动选择或性能实测。
- 图解中的阶段与空白距离无耗时意义；静态生命周期不等于运行时间。

## 交互

底部步骤导航及方向键翻页；图元点击 / Tab + Enter 显示定义；前后状态、K 分块、纯 Cube / 混合计算、复用模式及总览观察维度可切换。支持缩放、拖动和适应；info 可通过按钮、外部点击或 Escape 关闭。

## 验证

已通过脚本语法与来源链接检查；在浏览器验证 11 个正文步骤、20 个展示状态、图元键盘释义、info、缩放、拖动与适应。已检查 1440×900 桌面视口和 390×844 窄屏，未发现页面横向溢出；初始图形检查未发现文字相交或超出画布。

HTML 静态检查确认没有外部运行资源。预览器安全策略阻止 `file://` 导航，因此没有声称验证了双击直开；实际交互验证使用回环地址 HTTP 预览。内容以源码及 IR 文件核对，未运行 PyPTO 编译器或设备性能实验。

## 2026-10-10 术语与连线修订

- 全部数据网格改为内部居中文字：第一行对象名，第二行形状或空间。此规则遵循本次用户要求；本次读取的已安装 skill 与 AI Infra 源 skill 尚未包含这条文字规则。
- 所有关系线使用水平、垂直线段，并且每条完整路径只保留一个终点标记。折角文档、切角任务及箭头自身的斜边属于图元轮廓。
- 封面补出计算结果 C tile；存储绑定从值连到 MemRef，调用线从 Task 连到函数边界。Tile 页重排为两列加载、汇入计算、输出 Tile、写回 Tensor。
- 去除“外提”“下降”等不直观的表述，统一为“提取为独立函数”“转换为 Tile 操作”。Callable 是可调用函数的图解统称；MemRef 是内存引用，不等同于硬件缓冲。
- 第 10 页改名“真实 IR 对照”。IR、dump、snapshot 分开解释；保留历史文件、行号与 SHA-256，不将当前官网的 Pass 编号套入历史产物。

官网核对记录（2026-10-10）：

| 术语 / 机制 | 核对结论 | 官方依据 |
| --- | --- | --- |
| OutlineIncoreScopes | 将 InCore 作用域提取成 Function，原位置改为调用 | [OutlineIncoreScopes](https://www.pypto.ai/pypto/dev/passes/09-outline_incore_scopes/) |
| IR | Intermediate Representation，中间表示 | [IR Overview](https://www.pypto.ai/pypto/dev/ir/00-overview/) |
| snapshot / dump | 编程模型页明确使用 snapshot 描述每个 Pass 后保存的 IR；页面以 IR 转储文件称呼具体产物 | [Programming Model](https://www.pypto.ai/pypto/user/03-programming-model/#the-compilation-pipeline) |
| Tensor → Tile | 转换 InCore 内操作并更新调用点；与进一步 L0 分块分开 | [ConvertTensorToTileOps](https://www.pypto.ai/pypto/dev/passes/11-convert_tensor_to_tile_ops/) |
| L0 分块 | 根据后端容量选择形状，改写 K 循环，可进一步切分 M/N | [AutoTileMatmulL0](https://www.pypto.ai/pypto/dev/passes/18-auto_tile_matmul_l0/) |
| 混合核 | 混合函数拆成 AIC/AIV，由 Group 组织；非混合函数转换类型 | [ExpandMixedKernel](https://www.pypto.ai/pypto/dev/passes/24-expand_mixed_kernel/) |
| 内存复用 / 地址 | 同空间、生命周期及安全约束；规划器路径不同，新增说明官网 DSA_RP 路径 | [MemoryReuse](https://www.pypto.ai/pypto/dev/passes/36-memory_reuse/)、[AllocateMemoryAddr](https://www.pypto.ai/pypto/dev/passes/37-allocate_memory_addr/) |
| AUTO 任务依赖 | 编译期分析需要显式开启；依赖约束顺序而非耗时 | [AutoDeriveTaskDependencies](https://www.pypto.ai/pypto/dev/passes/43-auto_derive_task_dependencies/) |

修订验证：脚本解析及 20 个正文状态渲染通过；关系线生成函数拒绝斜线段。浏览器在 1440×900 检查封面及全部状态，文字未出界或相互覆盖。额外检查窄屏、网格点击、缩放和来源展开。未运行编译器或性能测试。

### 内嵌张量标签样式纠正

直接复用 AI Infra `training-parallel-communication-v1.html` 的 `tensorNode` 和 `llm-inference-dense-to-clusters-v1.html` 的 `tensor` 风格：深色底 `#131313`、语义色边框 1.2、圆角 6、11×11 方格 / pitch 14、底纹透明度 0.22、标签采用相同语义色和常规字重 14px，描边减至 2.5px。双行信息沿用现有 60 高边界，第二行 12px，避免改变连线锚点。此前高亮网格上的粗白字不属于该图元样式，已移除。继承图元、Tile、封面、总览与入口预览共用此实现。

### 图元精修与辅助色

按用户本次反馈覆盖原 Add / Multiply 不同尺寸约定：两者均为直径 48，圆周 1.5、选中 2，符号用关于圆心对称的矢量线绘制，避免字体基线导致偏移。程序对象使用蓝灰 `#8EAED0`，存储使用暖沙 `#C7AD88`，编译记录使用紫灰 `#B1A4C9`，用于细边框与文字及低亮度底色；张量四类颜色仍专用于数据角色。计算 OP 保留系列中灰胶囊。色彩说明同步到 info，整篇与封面预览共用实现。

### 图元的语义抽象修订

02 改以包含、调用、存储绑定、跨阶段处理四种关系呈现对象。移除 IR 的折角文件图形，使用输入节点、操作与有向边组成局部数据流；Task 移除无语义的切角。Pass 放在两幅阶段 IR 之间。局部图仅作教学示意，不宣称完整 IR 等同于 DAG，也不宣称从 dump 自动解析。官网 IR Overview 将 PyPTO IR 描述为不可变树结构，包含表达式与语句等节点；dump 是该程序结构的保存载体。第 10 页共用新 IR 图元，原始证据保持不变。

### OP 与 Callable 的层级

胶囊表示当前 IR 层级中的计算操作；函数范围框表示可调用定义，其函数体可包含多个 OP 和循环。02 的函数示例改为 Load → MatMul，避免单个 MatMul 与完整 kernel 被误认为同一层级。IR 缩略图中的 Tensor 圆角为 4（高度 20），OP 圆角为 10（高度 20，完整胶囊）；02、10 共用。

### 参考效果与 Kernel 图元（2026-10-10）

计算 OP 统一为参考图的蓝紫主色（#685CF0）、深紫计算标识和白色名称；循环采用左实线与其余三边虚线。Tensor 继续使用数据角色色，IR 缩略图保留 Tensor 圆角矩形与 OP 胶囊的差异。此用户指定样式覆盖此前中灰胶囊约定。

Kernel 采用设备函数范围框，包含入口名、AIC/AIV 目标标签和计算体；02 展示 Task 引用 Kernel，08 展示独立 AIC 或由 Group 组织的 AIC/AIV。普通 Function 不再命名为 kernel。图元表示程序定义，不代表芯片或一次执行实例。

依据：[PyPTO ExpandMixedKernel](https://www.pypto.ai/pypto/dev/passes/24-expand_mixed_kernel/) 说明混合 InCore 拆分为 AIC/AIV 并由 Group 组织；[NVIDIA CUDA Programming Guide](https://docs.nvidia.com/cuda/archive/13.1.0/cuda-programming-guide/02-basics/writing-cuda-kernels.html) 区分设备执行 kernel 及其启动。CUDA 的线程网格不移植为 PyPTO 的图元语义。

### 宽屏与图例间距

页面取消整体最大宽度，解释面板在桌面端限制为 320–440px，左侧占据剩余空间。02 图例扩为 1000×650，以水平分隔线划分结构、提交与存储、编译三行，行内增加留白和分隔。循环边框与文字使用 OP 同色 #685CF0；Function 内部操作依赖改用灰色箭头。

### 新增对象图例网格

02 改为三列两行等宽单元格：循环、Kernel、Task、MemRef、Pass、IR。Tile 与 OP 不再独立列为新增对象，OP 仅作为循环和 Kernel 的内部计算示例。全篇 OP、循环与 Kernel 的主色统一为 `#685CF0`；任务、存储和编译记录保留各自的辅助色。

### 02 对象层级校对

依据 PyPTO Task 依赖模型、TaskId、PTO Codegen 与 In-Core Simulator Profiling 文档，区分 IR 操作、Kernel 定义、Task 调度和设备指令。02 的 Task 图元补充目标、参数与示例依赖；不新增指令图元，不把对象图例当作时间线。官方链接已列于页面来源。

### 指令与编译过程补充

02 增加设备指令窄条，以搬运、计算、同步作为类别示意。Task 与 Kernel 统一紫色。IR 与 Pass 使用中性色，独立展示输入 IR、三个代表性 Pass 与输出 IR；不代表完整流水线。完整图改为 Task 直接调用 Kernel，内部 IR 对应设备代码，底部展示编译过程。

## 迁移记录

2026-10-10：正式文件迁入 `reports/llm-compute/`，原 Design 路径保留相对符号链接。正文与嵌入数据离线可用；未随附的原仓库材料显示为来源说明，不保留失效超链接。

[系列计划](../../PyPTO_图解报告系列计划.md)


2026-10-10 系列自查：澄清 outlining 输入/输出方向，补充 K 累加初值；当前 HTML 哈希见[统一验证记录](../pypto-series-audit/validation.json)。目录中的原 source SHA 仍标识最初收录快照，不用它冒充此次修订版本。
