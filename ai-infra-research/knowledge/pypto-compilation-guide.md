# PyPTO 编译流水线图解

[打开交互图解](../reports/llm-compute/pypto-compilation-guide/index.html#cover)

以二维 MatMul 为主线，逐步解释 Tensor、Tile、循环、Kernel、Task、设备指令、MemRef，以及 IR 与 Pass 的关系。

## 阅读提纲

- 继承与新增图元、对象层级与关系线
- Tensor 转换为 Tile，分块循环与 Kernel 调度
- 设备指令类别、缓冲与地址复用
- 历史 IR 对照与完整编译关系图

## 来源与验证

2026-10-10：按用户要求收录自 PyPTO3 的 `Design/pypto-compilation-guide/index.html`。此副本保留图解、交互、官网引用、历史 IR 摘录和指纹；原仓库源码与 dump 文件未打包，相应入口改为说明文字。教学形状与指令类别不代表实测结果。

源报告已在本次制作中检查交互和布局。本次收录检查目录、脚本语法和入口；未重新进行技术复审或浏览器视觉验收。

2026-10-12：入口更新为独立定稿版本；报告正文保持不变。后续专题见 [函数变换、内存复用与问题定位](../reports/llm-compute/pypto-guides/index.html#cover)。
