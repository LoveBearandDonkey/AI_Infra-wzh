# 函数内联、区域提取与混合核拆分 · 图解 04

入口：[独立 HTML](index.html)。11 节，18 种正文图示状态，沿用前篇导航、模式切换、图元释义、缩放和平移。

## 范围

图形均为结构教学案例，不是一次真实编译的连续快照。区分函数定义、调用点、区域、核函数和任务实例。解释当前 InlineFunctions、OutlineIncoreScopes、ConvertTensorToTileOps、ExpandMixedKernel 的关键变化，并明确 SplitVectorKernel 的版本边界。

来源：[摘录](source-evidence.md)、[结构化证据与文件哈希](evidence.json)。Explorer 仅提供按名称索引与有限的拆核识别，不当作通用编译 provenance。

## 验证

脚本解析、18 种图示状态生成、释义键与来源链接检查通过；SVG XML 和文本锚点边界检查通过。这些静态检查不验证浏览器中的文字实际宽度或布局。未执行真实编译或设备运行；按目标仓库规则，不默认进行浏览器自动化或截图，视觉验收尚未完成。


统一检查见[系列自查](../pypto-series-audit/README.md)。

## 2026-10-12 全系列内容消融

原版保留作为详细对照；标题和未定义符号已校订。推荐从[单篇完整报告](../pypto-guides/index.html)阅读；[逐节删并依据](../pypto-guides/MERGE-REVIEW.md)记录全部61节的去向。尚未进行读者实验。
