# 来源与证据
核对日期：2026-10-10。实际本地文件摘录；教学图不是真实编译的连续快照。

<a id="props"></a>
## props
`repo/pto/include/pypto/ir/transforms/pass_properties.h:21–35`；SHA256 `0097cc0f45bc4936c901eb819137de6649dcd78e66ba0ca08f09229d0ae06754`
```text
/// @brief Central registry of PassProperties for all built-in passes.
///
/// Each constant declares the required, produced, and invalidated IRProperties
/// for one pass.  Using `inline const` (not `constexpr`) because
/// IRPropertySet's initializer_list constructor is not constexpr in C++17.

// -- Inline-function elimination pass (runs first, before everything) ---------

inline const PassProperties kInlineFunctionsProperties{.produced = {IRProperty::InlineFunctionsEliminated}};

// -- SynthesizeAllReduceSignals and MaterializeCommDomainScopes passes (run
//    late in the pipeline, after phase-fence expansion and immediately before
//    LowerHostTensorCollectives).
//    Nothing between InlineFunctions and here removes the host_orch
//    alloc/window/dispatch/allreduce chain (host_orch is never tile-lowered), so
```

<a id="memory"></a>
## memory
`repo/pto/include/pypto/ir/transforms/pass_properties.h:248–275`；SHA256 `0097cc0f45bc4936c901eb819137de6649dcd78e66ba0ca08f09229d0ae06754`
```text

// -- Memory / codegen passes --------------------------------------------------

inline const PassProperties kInitMemRefProperties{
    .required = {IRProperty::SSAForm, IRProperty::SplitIncoreOrch, IRProperty::IncoreTileOps,
                 IRProperty::TileOps2D, IRProperty::TileMemoryInferred},
    .produced = {IRProperty::HasMemRefs, IRProperty::NormalizedStmtStructure},
    .invalidated = {IRProperty::SSAForm}};

// Semantic must-alias materialization (Step 0 formerly inside MemoryReuse).
// Same requirements as MemoryReuse; retargets MemRefs in place without adding or
// removing structural IR properties.
inline const PassProperties kMaterializeSemanticAliasesProperties{
    .required = {IRProperty::SplitIncoreOrch, IRProperty::IncoreTileOps, IRProperty::HasMemRefs,
                 IRProperty::TileOps2D, IRProperty::NormalizedStmtStructure},
    .produced = {IRProperty::NormalizedStmtStructure}};

inline const PassProperties kMemoryReuseProperties{
    .required = {IRProperty::SplitIncoreOrch, IRProperty::IncoreTileOps, IRProperty::HasMemRefs,
                 IRProperty::TileOps2D, IRProperty::NormalizedStmtStructure},
    .produced = {IRProperty::NormalizedStmtStructure}};

inline const PassProperties kAllocateMemoryAddrProperties{
    .required = {IRProperty::SplitIncoreOrch, IRProperty::IncoreTileOps, IRProperty::HasMemRefs,
                 IRProperty::TileOps2D},
    .produced = {IRProperty::AllocatedMemoryAddr}};

// -- Return order normalization pass ------------------------------------------
```

<a id="registry"></a>
## registry
`repo/pto/docs/en/dev/passes/99-verifier.md:1–62`；SHA256 `53e3315cc4caeaeee70941c9686a5f60a432ddbc08dda952de8e32f8c121f545`
```text
# IR Verifier

Extensible verification system for validating PyPTO IR correctness through pluggable property verifiers with diagnostic reporting and Pass integration.

## Overview

| Component | Description |
| --------- | ----------- |
| **PropertyVerifier (C++)** | Base class for verification rules |
| **PropertyVerifierRegistry (C++)** | Singleton mapping IRProperty → PropertyVerifier factories with verify/report API |
| **Diagnostic** | Structured error/warning report with severity, location, and message |
| **VerificationError** | Exception thrown when verification fails |

### Key Features

- **Pluggable Rule System**: Extend with custom verification rules
- **Property-Based Verification**: Opt-in property sets — verify exactly what you need
- **Structural Properties**: TypeChecked, BreakContinueValid, NoRedundantBlocks, UseAfterDef, OutParamNotShadowed, NoNestedInCore, InOutUseValid, PipelineLoopValid, ArrayNotEscaped, and ManualDepsOnSubmitOnly are verified before/after each pass by `VerificationInstrument`; at pipeline start `PassPipeline` verifies only the lightweight subset shared with `GetVerifiedProperties()`
- **Dual Verification Modes**: Collect diagnostics or throw on first error
- **Pass Integration**: Use as a Pass in optimization pipelines
- **Comprehensive Diagnostics**: Collect all issues with source locations

## Architecture

### Structural vs Pipeline Properties

| Category | Examples | Behavior |
| -------- | -------- | -------- |
| **Structural** | TypeChecked, BreakContinueValid, NoRedundantBlocks, UseAfterDef, OutParamNotShadowed, NoNestedInCore, InOutUseValid, PipelineLoopValid, ArrayNotEscaped, ManualDepsOnSubmitOnly | Always true. Verified before/after each pass by `VerificationInstrument`; the subset shared with `GetVerifiedProperties()` is also checked at pipeline start. Never in PassProperties. |
| **Pipeline** | SSAForm, NoNestedCalls, HasMemRefs, ... | Produced/invalidated by passes. Verified per pass-declared contracts. |

`GetStructuralProperties()` returns `{TypeChecked, BreakContinueValid, NoRedundantBlocks, UseAfterDef, OutParamNotShadowed, NoNestedInCore, InOutUseValid, PipelineLoopValid, ArrayNotEscaped, ManualDepsOnSubmitOnly}`. These are verified **before/after each pass** by `VerificationInstrument`. At **pipeline start**, `PassPipeline::Run()` verifies only the lightweight subset shared with `GetVerifiedProperties()` (`GetStructuralProperties().Intersection(GetVerifiedProperties())`) — so e.g. `ArrayNotEscaped` is checked before/after each pass but not at pipeline start. Since no pass declares them in `required`/`produced`/`invalidated`, `VerificationInstrument` unions them with the pass's declared properties to ensure no pass breaks these fundamental invariants.

### Verification Rule System

The verifier uses a **plugin architecture** where each `PropertyVerifier` subclass is an independent rule:

- Rules run in registration order across all functions
- Each rule operates independently — one rule's failure doesn't affect others
- Rules receive `ProgramPtr` and internally decide whether to iterate over functions or check program-level properties
- Rules can be selectively included via `IRPropertySet`

### Diagnostic System

| Field | Type | Purpose |
| ----- | ---- | ------- |
| `severity` | `DiagnosticSeverity` | Error or Warning |
| `rule_name` | `string` | Which rule detected the issue |
| `error_code` | `int` | Numeric error identifier |
| `message` | `string` | Human-readable description |
| `span` | `Span` | Source location information |

### Integration with Pass System

1. **Automatic property verification**: `PassPipeline` uses `PropertyVerifierRegistry` to check produced properties after each pass (controlled by `VerificationLevel` in `PassContext`). The lightweight subset of structural properties shared with `GetVerifiedProperties()` is checked at pipeline start. See [Pass Manager](00-pass_manager.md).
2. **`VerificationInstrument`**: A `PassInstrument` that verifies properties via `PassContext`. Before each pass, it checks the pass's declared `required` properties. After each pass, it checks the pass's declared `produced` properties **plus all structural properties** — ensuring no pass breaks fundamental IR invariants.

The `run_verifier()` utility creates a standalone `Pass` for ad-hoc use in custom pipelines, but it is **not** part of the default optimization strategies.

## Built-in Rules

| Rule Name | IRProperty | Purpose |
```

<a id="sets"></a>
## sets
`repo/pto/src/ir/transforms/ir_property.cpp:136–193`；SHA256 `5a6e6afccada2437eeb612d53abdc363fd25f8362d4f0b1955385c4ad2bb7434`
```text
const IRPropertySet& GetVerifiedProperties() {
  static const IRPropertySet props{IRProperty::SSAForm,
                                   IRProperty::TypeChecked,
                                   IRProperty::MixedKernelExpanded,
                                   IRProperty::AllocatedMemoryAddr,
                                   IRProperty::BreakContinueValid,
                                   IRProperty::NoRedundantBlocks,
                                   IRProperty::InOutUseValid,
                                   IRProperty::CallDirectionsResolved,
                                   IRProperty::ManualDepsOnSubmitOnly,
                                   IRProperty::ReturnParamsExplicit,
                                   IRProperty::AivSplitValid,
                                   IRProperty::HardSyncallOccupancyValid,
                                   IRProperty::IterArgCarryClassified};
  return props;
}

VerificationLevel GetDefaultVerificationLevel() {
  // C++17: static local initialization is thread-safe and runs exactly once
  static const VerificationLevel level = [] {
    const char* env = std::getenv("PYPTO_VERIFY_LEVEL");
    if (env == nullptr) {
      return VerificationLevel::Basic;
    }
    std::string val(env);
    if (val == "none") {
      return VerificationLevel::None;
    }
    if (val == "roundtrip") {
      return VerificationLevel::Roundtrip;
    }
    return VerificationLevel::Basic;
  }();
  return level;
}

const IRPropertySet& GetStructuralProperties() {
  static const IRPropertySet props{IRProperty::TypeChecked,         IRProperty::BreakContinueValid,
                                   IRProperty::NoRedundantBlocks,   IRProperty::UseAfterDef,
                                   IRProperty::OutParamNotShadowed, IRProperty::NoNestedInCore,
                                   IRProperty::InOutUseValid,       IRProperty::PipelineLoopValid,
                                   IRProperty::ArrayNotEscaped,     IRProperty::ManualDepsOnSubmitOnly};
  return props;
}

const IRPropertySet& GetDefaultVerifyProperties() {
  static const IRPropertySet props{IRProperty::SSAForm,
                                   IRProperty::TypeChecked,
                                   IRProperty::NoNestedCalls,
                                   IRProperty::BreakContinueValid,
                                   IRProperty::NoRedundantBlocks,
                                   IRProperty::UseAfterDef,
                                   IRProperty::OutParamNotShadowed,
                                   IRProperty::NoNestedInCore,
                                   IRProperty::TileTypeCoherence,
                                   IRProperty::ArrayNotEscaped};
  return props;
}
```

<a id="pipeline"></a>
## pipeline
`repo/pto/src/ir/transforms/passes.cpp:250–277`；SHA256 `585cee4a31859c865208bb1b932468aa7fb0bdb0bdf4fc073891ea724fc03582`
```text
  // Verify structural invariants at pipeline start
  if (should_verify) {
    auto structural = GetStructuralProperties().Intersection(GetVerifiedProperties());
    if (!structural.Empty()) {
      pass::VerifyProperties(structural, current, "pipeline_input");
      verified = verified.Union(structural);
    }
  }

  for (const auto& p : passes_) {
    current = p(current);

    if (should_verify) {
      // Remove invalidated properties so they get re-verified if re-produced
      auto invalidated = p.GetInvalidatedProperties().Intersection(GetVerifiedProperties());
      if (!invalidated.Empty()) {
        verified = verified.Difference(invalidated);
      }
      auto to_verify = p.GetProducedProperties().Intersection(GetVerifiedProperties()).Difference(verified);
      if (!to_verify.Empty()) {
        pass::VerifyProperties(to_verify, current, p.GetName());
        verified = verified.Union(to_verify);
      }
    }

    if (should_diagnose) {
      auto diags = DiagnosticCheckRegistry::GetInstance().RunChecks(effective_checks,
                                                                    DiagnosticPhase::PostPass, current);
```

<a id="instrument"></a>
## instrument
`repo/pto/src/ir/transforms/pass_context.cpp:72–90`；SHA256 `f4aa67c8bda28f6990a2eee9c9ee076025128d373dccb6c6bec3f5b40685593a`
```text
void VerificationInstrument::RunBeforePass(const Pass& pass, const ProgramPtr& program) {
  if (mode_ != VerificationMode::Before && mode_ != VerificationMode::BeforeAndAfter) {
    return;
  }
  VerifyOrThrowWithContext(pass.GetRequiredProperties().Union(GetStructuralProperties()), program,
                           "Pre-verification failed before pass '" + pass.GetName() + "'");
}

void VerificationInstrument::RunAfterPass(const Pass& pass, const ProgramPtr& program) {
  if (mode_ != VerificationMode::After && mode_ != VerificationMode::BeforeAndAfter) {
    return;
  }
  VerifyOrThrowWithContext(pass.GetProducedProperties().Union(GetStructuralProperties()), program,
                           "Post-verification failed after pass '" + pass.GetName() + "'");
}

std::string VerificationInstrument::GetName() const { return "VerificationInstrument"; }

// CallbackInstrument
```

<a id="ux"></a>
## ux
`Insight/UX_Insight_Report（pypto仓）.md:78–107`；SHA256 `2df4b71036a283ec5e0f046e7f8186589c5900785bff6e67710fd37243d6cfc4`
```text

### 阶段 2 — 编译 / IR Passes / 编排（Lowering）
> bug 密度最高的地带。

**痛点**
- Pass **悄悄丢东西**：`ExpandMixedKernel` 丢 matmul（#963）、丢嵌套 loop 累加器初始化（#977）；`MemoryReuse` 复用仍存活的 loop yield 缓冲导致**数据损坏**（#768）；`ConvertToSSA` 跨作用域错连同名变量（#642）。
- **作用域规则不可见且不一致**：incore/auto_incore 块外的语句被**静默丢弃、无警告**（#919）；chunked `pl.parallel` 放在 auto_incore 外**被接受而非被拒绝**（#577）。
- 单一 Pass（`ExpandMixedKernel`）独占 37 单——**某些 Pass 是脆弱热点**。

**期望**：Pass 要么正确变换、要么**明确报错**，绝不静默丢弃；作用域 / 合法性规则应在编译期强制并给出可读诊断。

**设计机会点**
- **Pass 级不变量校验（verifier）**：每个 Pass 后断言「op 数量守恒 / 依赖完整 / 作用域合法」，把 #963/#977/#768 从「运行出错」提前到「编译报错」。
- 把「块外语句被忽略」「非法嵌套」等从静默行为升级为**编译期诊断**（#919/#577 的直接诉求）。
- 对高频脆弱 Pass（ExpandMixedKernel）建**控制流 / 边界的属性测试（property/fuzz）**，取代逐 case 补丁。

### 阶段 3 — 代码生成（Codegen）
**痛点**：codegen 持续「生成语义错误但能编译的代码」——
- `[M,1]` 少写 `pl.DN` → **静默生成错误 stride**（#739）；矩阵右操作数用错 block layout（#762）；chunked 循环里发 `add_output` 而非 `add_inout`（#858）；写进临时张量而非外部输出（#866）；const 表达式 dtype 发错（#934）；序列化丢 `memory_space`（#522/#553）。
- 根因常被明确写为「**层间知识不一致**」：C++ codegen 已知规则，但 Python type resolver 未同步（#739 原文）。

**期望**：一处正确的规则应在所有层自动生效；codegen 不应在缺信息时「猜一个默认值」然后错下去。

**设计机会点**
- 建立布局 / 类型规则的**单一事实源（single source of truth）**，消除 C++/Python 双写漂移（#739、#522、#553、#1300 RFC 的共同诉求）。
- Codegen 前做**完整性校验**：布局 / 内存空间 / 输出方向缺失时报错，而非默认 ND、默认 row‑major。

### 阶段 4 — 运行与验证（Runtime / Correctness）
**痛点**
- **最坏失败模式**：编译干净、设备上跑出全零或 4094/4096 mismatch（#1525）。用户无法判断是自己写错还是编译器错。
```

<a id="roundtrip"></a>
## roundtrip
`repo/pto/docs/en/dev/passes/00-pass_manager.md:203–230`；SHA256 `9a3f3ebbd02b17c0a978200e6e562c4616f5fd872ac8f5027dca2bfbb6955f72`
```text
### RoundtripInstrument

Print→parse roundtrip verification instrument. After every pass, it:

1. Prints the resulting IR to Python DSL text via `python_print()`
2. Parses the text back to an IR `Program` via `parse()`
3. Asserts `structural_equal(original, reparsed)` — a failure means the printer or parser cannot faithfully represent the IR produced by that pass

```python
from pypto.pypto_core import passes
from pypto.ir.instruments import make_roundtrip_instrument

with passes.PassContext([make_roundtrip_instrument()]):
    result = passes.convert_to_ssa()(program)
```

**Known non-fatal cases** (instrument skips the check without failing):

| Case | Behaviour | Reason |
| ---- | --------- | ------ |
| Printer `InternalError` (e.g. `ForKind::Unroll` + SSA `iter_args`) | `UserWarning`, roundtrip skipped | No valid DSL syntax for this transitional state |
| `UnknownType` in original IR (manually built via `ir.Call(ir.Op(...))`) | Silent skip | Parsing infers a concrete type; this is a type improvement, not a bug |
| `tensor.add(x, scalar)` → `tensor.adds` after roundtrip | Silent skip | Python API dispatches scalar RHS to `tensor.adds`; manual construction used wrong op name |
| `tile.load` 3-arg → 4-arg after roundtrip | Silent skip | C++ requires 4 args; manually constructed IR with 3 args is normalised by the printer |
| Variable pointer mismatch (dynamic-shape Vars in return types) | Silent skip | `structural_equal` without `enable_auto_mapping` cannot track Vars outside the function body |

**Enabled by default in unit tests** via `tests/ut/conftest.py` (see [Test Fixture](#test-fixture) below). Disable with `PYPTO_VERIFY_LEVEL=basic` or `PYPTO_VERIFY_LEVEL=none`.

```
