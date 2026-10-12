# Learnings

## [LRN-20261010-P01] knowledge_gap

**Logged**: 2026-10-10
**Priority**: high
**Status**: resolved
**Area**: docs

### Summary
编译器图解需要对关键断言核对当前源码，单个文档内也可能混有不同版本描述。

### Details
Pass Manager 文档的三项默认验证集合已经落后于源码中的十三项；SplitVectorKernel 当前不再减半，其他 Pass 文档仍保留旧分工。属性 invalidated 撤销保证，也不能据此推断具体变量一定被重新赋值。

### Suggested Action
对关键断言同时记录来源文件、行段、哈希、适用条件与冲突裁决；不要把历史 UX 建议直接当作当前实现契约。

### Metadata
- Source: task audit
- Related Files: reports/llm-compute/pypto-series-audit/README.md
- Tags: source-evidence, version, compiler

### Resolution
- Resolved: 2026-10-10
- Notes: 第四、六篇以当前源码解释，并在系列自查记录来源差异。

## [LRN-20261010-P02] best_practice

**Logged**: 2026-10-10
**Priority**: medium
**Status**: resolved
**Area**: frontend

### Summary
图元 aria-label 与解释面板必须共用同一份释义；静态全状态检查不能替代浏览器验收。

### Details
报告覆盖 glossary 后，内嵌图元闭包仍可能使用旧释义生成 aria-label。已同步 02–06 的图元 glossary，并提供覆盖六篇 111 个状态的静态验证脚本。检查明确不覆盖字体宽度、遮挡和浏览器交互。

### Suggested Action
将 glossary 作为共享图元的显式配置；输出中分别标记静态、浏览器和真实运行验证，避免笼统写“全部通过”。

### Metadata
- Source: task audit
- Related Files: reports/llm-compute/pypto-series-audit/validate.cjs
- Tags: accessibility, glossary, validation

### Resolution
- Resolved: 2026-10-10
- Notes: 本轮报告已修正；正式通用图元接口重构留作后续候选，不在本次扩张修改。
