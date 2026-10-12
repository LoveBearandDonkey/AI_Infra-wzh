# 第四篇来源证据
核对日期：2026-10-10。当前实现说明与教学案例分开；不使用旧版 SplitVectorKernel 负责减半的文档描述。

<a id="inline"></a>
## inline
`repo/pto/docs/en/dev/passes/01-inline_functions.md:1–42`；SHA256 `cbc6f2ba3cd31e1e772032b2da47182d1eaa71658fd36d7dfde4f0d130f568f9`
```text
# InlineFunctions Pass

Eliminates `FunctionType.Inline` functions by splicing their bodies at every call site.

## Overview

Functions decorated as `@pl.function(type=pl.FunctionType.Inline)` (or via the JIT-side `@pl.jit.inline`) are *source-level utilities*: each call site expands into a fresh, alpha-renamed copy of the body, with formal parameters substituted by actual-argument expressions. After this pass, no `FunctionType.Inline` function and no `Call` to one survives in the program — subsequent passes treat the spliced code as if it had been written inline at the call site.

Runs as the **first** pass in `OptimizationStrategy.Default` so downstream passes (`UnrollLoops`, `OutlineIncoreScopes`, …) never observe Inline functions.

**Produces**: `IRProperty.InlineFunctionsEliminated`.

**Requires**: nothing — runs on a freshly parsed program.

**When to use**: Always, as part of the default pipeline. The pass is a no-op when no Inline functions exist.

## API

| C++ | Python | Level |
| --- | ------ | ----- |
| `pass::InlineFunctions()` | `passes.inline_functions()` | Program-level |

**Python usage**:

```python
from pypto.pypto_core import passes

inline_pass = passes.inline_functions()
program_inlined = inline_pass(program)
```

## Algorithm

1. **Collect** all functions with `func_type == FunctionType::Inline`.
2. **Cycle-detect** the Inline → Inline call graph; raise `pypto::ValueError` naming the cycle if one is found.
3. **Iterate to fixpoint** — each iteration walks every function (including the Inline ones, so that nested Inline-calls-Inline expands transitively):
   - For every top-level `LHS = inline_call(args)` or `EvalStmt(inline_call(args))` in a function body:
     - Build the param-substitution map (formal `Var` → actual `Expr`).
     - Alpha-rename every locally-bound `Var` in the inlined body to a fresh name (`<orig>_inline<counter>`) to avoid collisions across multiple call sites.
     - Splice the renamed-and-substituted body's statements before the call site.
     - Replace the call with: `LHS = renamed_return` (single-return) or `LHS = MakeTuple([renamed_returns...])` (multi-return). When `LHS` resolves to the same `Var` as the substituted return value, the assignment is omitted to avoid a redundant SSA copy.
4. **Drop** all Inline functions from the program.
```

<a id="outline"></a>
## outline
`repo/pto/docs/en/dev/passes/08-outline_incore_scopes.md:1–83`；SHA256 `58af19e738584a11535a0d5620bab47785b4e557087cf7debe7cf3209038cffd`
```text
# OutlineIncoreScopes Pass

Outlines InCore scopes into separate functions.

## Overview

This pass transforms `InCoreScopeStmt` nodes into separate `Function(InCore)` definitions and replaces the scope with a Call to the outlined function.

**Requirements**:

- Input IR must be in SSA form (run ConvertToSSA first); SSAForm is preserved (produced) by this pass
- Only processes Opaque functions (InCore functions are left unchanged)

**When to use**: Run after ConvertToSSA when you need to extract InCore computation regions into separate callable functions.

## API

| C++ | Python | Level |
| --- | ------ | ----- |
| `pass::OutlineIncoreScopes()` | `passes.outline_incore_scopes()` | Program-level |

**Factory function**:

```cpp
Pass OutlineIncoreScopes();
```

**Python usage**:

```python
from pypto.pypto_core import passes

outline_pass = passes.outline_incore_scopes()
program_outlined = outline_pass(program)
```

## Algorithm

1. **Scan for InCore Scopes**: Find all `InCoreScopeStmt` nodes in Opaque functions
2. **Analyze Inputs**: Determine external variable references (variables defined outside scope, used inside)
3. **Analyze Outputs**: Determine internal definitions used after scope (variables defined inside, used outside)
4. **Create Function**: Extract scope body into new `Function(scope_type=InCore)` with:
   - Parameters = input variables
   - Returns = output variables
   - Body = scope body
5. **Replace Scope**: Replace `InCoreScopeStmt` with:
   - Call to outlined function with input arguments
   - AssignStmt for each output variable
6. **Add to Program**: Add outlined function to program's function list

**Param-explicit returns**: the outlined function returns its
own parameters, not SSA result vars, whenever a tensor output writes through
a parameter — store-target outputs return the param directly, other outputs
are traced via the shared `return_lineage` utility. Kernel-allocated outputs
keep their SSA value. This makes the return→param mapping a pointer-identity
lookup for orchestration codegen (`ReturnParamsExplicit` invariant).

**Naming**:

- Default: `{original_func}_incore_{counter}` (e.g., `main_incore_0`, `main_incore_1`)
- User-provided: when `InCoreScopeStmt.name_hint` is non-empty, that name is used directly
  - `with pl.at(level=pl.Level.CORE_GROUP, name_hint="fused_add"):` → function named `fused_add`

**Name collisions** (`name_hint` is a *hint*, not a unique identifier — outlined
functions share one program-wide namespace, so collisions are resolved
automatically):

- **In-function** — two scopes in the same function sharing a `name_hint` get a
  numeric suffix: `my_kernel`, `my_kernel_0`.
- **Cross-function** — two *different* functions outlining scopes with the same
  `name_hint` (typically a reused `@pl.jit.inline` helper composed into a host
  program) are disambiguated by namespacing the collision under the originating
  function. The first function keeps the bare hint (stable, matching its
  standalone compilation); the later one is prefixed:
  - `single_a` → `dup_scope`, `single_b` → `single_b_dup_scope`

  This lets independently-runnable child kernels be composed into one
  `@pl.jit.host` program without manually renaming shared helper internals. The
  same rule applies to the sibling `OutlineHierarchyScopes` and
  `OutlineClusterScopes` passes (which share the outlining utility).

## Example

```

<a id="tile"></a>
## tile
`repo/pto/docs/en/dev/passes/10-convert_tensor_to_tile_ops.md:1–63`；SHA256 `9a65227c46869a38b4cd3d24497cd36ac2f93436d628bd56dc54aaedfb78d15e`
```text
# ConvertTensorToTileOps Pass

Converts tensor operations to tile operations in InCore functions and updates orchestration call sites.

## Overview

After `OutlineIncoreScopes` extracts InCore scopes into separate functions, those functions still operate on `TensorType` variables using `tensor.*` operations. This pass lowers them to `TileType` variables with `tile.*` operations that map directly to PTO-ISA instructions.

The pass also updates call sites in orchestration/opaque functions: for each new output parameter added to an InCore function, a `tensor.create` is inserted at the call site.

**Requirements**:

- Input IR must be in SSA form
- InCore scopes must be outlined (run `OutlineIncoreScopes` first)
- Statement structure must be normalized

**When to use**: Run after `OutlineClusterScopes` and before `OptimizeOrchTensors`.

## API

| C++ | Python | Level |
| --- | ------ | ----- |
| `pass::ConvertTensorToTileOps()` | `passes.convert_tensor_to_tile_ops()` | Program-level |

**Python usage**:

```python
from pypto.pypto_core import passes

convert_pass = passes.convert_tensor_to_tile_ops()
program_tiled = convert_pass(program)
```

## Algorithm

The pass operates in three program-level phases:

### Phase 1: Transform InCore Functions

For each `FunctionType::InCore` function:

1. **Pre-scan MatmulSlice patterns**: Collect `tensor.slice` results consumed by `tensor.matmul` / `tensor.matmul_acc`. These need a Mat `tile.load` (natural, plus a zero-copy `tile.transpose_view` when transposed) instead of the default `tile.load(Vec)`.

2. **Insert tile.load (entry loads)**: For each `TensorType` parameter directly consumed by a converted op, insert `tile.load(param, zeros, shape, shape, target_memory=Vec)` at function entry. Parameters only referenced by self-loading ops (`tensor.slice`, `tensor.matmul`, `tensor.read`, `tensor.write`, `tensor.assemble`) are skipped — they manage their own loads.

3. **Convert body via TensorToTileMutator**: Walk the function body and convert each `tensor.*` call to its `tile.*` equivalent using `OpConversionRegistry`. The mutator propagates type changes through control flow (IterArgs, ForStmt/WhileStmt return_vars, IfStmt return_vars).

4. **Insert tile.store (exit stores)**: For each return value converted from `TensorType` to `TileType`, add an `Out` parameter and insert `tile.store(tile, zeros, out_param)`. If the return value comes from a `tile.assemble` loop, the loop is rewritten to use `tile.store` directly (conversion-time assemble-loop rewrite; distinct from `OptimizeOrchTensors` Pattern 3 which handles cross-function optimization).

### Phase 2a: Propagate Added Outputs Through Spmd/Group Wrappers

`OutlineClusterScopes` produces Spmd/Group wrappers that are transparent 1:1
forwarders of their params to a single inner InCore call. When Phase 1 appends
`Out` params to that InCore callee, the wrapper must mirror the appended params
on its own signature and forward them through the inner call — otherwise
orchestration codegen's `BuildWrapperReorderedParams` invariant (every inner-call
`Var` arg resolves to a wrapper param) breaks.

For each `FunctionType::Spmd` / `FunctionType::Group` function:

1. `ForwardedCallFinder` locates the first call to a transformed InCore (one
   whose Phase 1 added at least one `Out` param).
2. If found, the wrapper signature is extended with matching `Out` params (same
```

<a id="mixed"></a>
## mixed
`repo/pto/docs/en/dev/passes/19-expand_mixed_kernel.md:1–20`；SHA256 `5a7934765353bdeec6ea74fdb48900433c21d8672a14a5294ce47a589b10fd4d`
```text
# ExpandMixedKernel Pass

Expands mixed InCore functions into separate AIC (Cube) + AIV (Vector) kernels wrapped in a Group function. Non-mixed InCore functions get their FunctionType converted to AIC or AIV.

## Overview

After `OutlineIncoreScopes` and `ConvertTensorToTileOps`, InCore functions may contain both Cube ops (`tile.matmul`, `tile.gemv`, etc.) and Vector ops (`tile.add`, `tile.exp`, etc.). Some ops like `tile.load`, `tile.store`, `tile.move`, and `tile.reshape` are classified as Cube or Vector based on the MemorySpace of their tile operands. Functions containing ops from both sides are **mixed InCore functions**. Hardware requires Cube and Vector operations to run on separate core types, so this pass splits them into:

- **AIC function** (`FunctionType::AIC`) — contains only Cube + shared ops
- **AIV function** (`FunctionType::AIV`) — contains only Vector + shared ops
- **Group function** (`FunctionType::Group`) — calls AIC then AIV, replaces the original

When an existing Group function already calls the InCore function (e.g. from `OutlineClusterScopes`), the pass **rewrites that Group in-place** to call AIC + AIV directly, avoiding a redundant Group wrapper. When a standalone `Spmd` wrapper calls the InCore function, the pass preserves the `Spmd` wrapper and creates a `Group` callee under it so launch semantics stay on `FunctionType::Spmd`.

For **non-mixed InCore functions** (pure Cube or pure Vector), the pass converts `FunctionType::InCore` to the corresponding type without splitting:

- Pure Cube → `FunctionType::AIC`
- Pure Vector or shared-only → `FunctionType::AIV`

After this pass, no `FunctionType::InCore` functions remain in the program.
```

<a id="vector"></a>
## vector
`repo/pto/docs/en/dev/passes/21-split_vector_kernel.md:1–29`；SHA256 `b0e4cede27bc4c03c67b5afcdf23ea618285948a1e8ba2eb1131826308054e87`
```text
# SplitVectorKernel Pass

After the staged convergence refactor, `SplitVectorKernel` has two narrow jobs;
it **no longer halves any function body**:

1. **`split_aiv` attribute stamping** — the SOLE split path through this pass.
   A `split_aiv` kernel (hand-authored, or produced upstream by
   [`LowerAutoVectorSplit`](18-lower_auto_vector_split.md)) has already lowered
   its explicit `tile.aiv_shard` / `tile.aic_gather` into split-stamped
   `tpush`/`tpop` (folded by `ExpandMixedKernel`) and carries already-halved
   compute tiles plus its own `tile.get_subblock_idx()`. This pass leaves the
   body untouched and only stamps `split` (+ `dual_aiv_dispatch` for AIV
   functions) on the function attrs.

2. **No-split dual-AIV dispatch** — on Ascend910B (any backend whose
   `BackendHandler::RequiresNoSplitDualAivDispatch()` returns `true`), when
   `ExpandMixedKernel` decides a mixed kernel cannot be split it tags the AIV
   function `dual_aiv_dispatch=True`. This pass wraps the body in a per-lane
   `if subblock_idx == 0 ... else` replay so AIC↔AIV cross-core handshakes stay
   balanced even though only lane 0 does real compute.

> **Historical note.** This pass used to drive per-op AIV halving
> (`ProcessFunction` / `ResolveSplitMode` / `CrossCoreSplitCollector`). That
> driver was deleted once `LowerAutoVectorSplit` became the live auto-split
> lowering path: after it runs, every split function reaches this pass already
> `split_aiv`-marked, so re-halving here would double-halve the already-half
> body. The halving machinery itself (shape halving, offset localization,
> `tile.slice` arg-halving, reduce-on-split-axis rejection, loop tracking) now
> lives in `split_axis_utils`, called by `LowerAutoVectorSplit` — see that
```

<a id="explorer"></a>
## explorer
`Design/pass-transform-explorer/app.js:3667–3740`；SHA256 `83c531d3537739cf8ef47adf5f74e3b721df378473299f018154b821a32c6676`
```text
  // Callable lineage
  //
  // The index is built per Pass; this transposes it per callable so a single
  // computation can be followed down the whole pipeline. Everything here is a
  // regrouping of `pass.functions` / `pass.changedFunctions` — no new facts.
  // ══════════════════════════════════════════════════════════════════════

  var CALLABLES = Object.create(null);

  /**
   * ExpandMixedKernel turns a mixed InCore function into an AIC kernel, an AIV
   * kernel and a Group shell that coordinates them. Detecting that precisely
   * (kind flips to Group in the same Pass that adds `<name>_aic` / `_aiv`)
   * matters: plain name-prefix matching would also swallow `foo` / `foo_0`,
   * which are distinct callables the compiler merely disambiguated.
   */
  function detectSplits(r) {
    var splits = Object.create(null);
    var childOf = Object.create(null);
    r.passes.forEach(function (p) {
      var added = Object.create(null);
      var toGroup = [];
      (p.changedFunctions || []).forEach(function (cf) {
        if (cf.status === 'added') added[cf.name] = cf;
        if (cf.status === 'changed' && cf.kind === 'Group' && cf.kindBefore && cf.kindBefore !== 'Group') {
          toGroup.push(cf.name);
        }
      });
      toGroup.forEach(function (root) {
        var kids = ['_aic', '_aiv'].map(function (s) { return root + s; })
          .filter(function (n) { return added[n]; });
        if (!kids.length) return;
        splits[root] = { passIdx: p.idx, passName: p.name, kids: kids };
        kids.forEach(function (k) { childOf[k] = root; });
      });
    });
    return { splits: splits, childOf: childOf };
  }

  function buildCallables(r) {
    var lineage = detectSplits(r);
    var rows = Object.create(null);   // name -> {passIdx -> fn record}
    var marks = Object.create(null);  // name -> {passIdx -> changedFunction}
    var order = [];

    r.passes.forEach(function (p) {
      (p.functions || []).forEach(function (f) {
        if (!rows[f.name]) { rows[f.name] = Object.create(null); order.push(f.name); }
        rows[f.name][p.idx] = f;
      });
      (p.changedFunctions || []).forEach(function (cf) {
        if (!marks[cf.name]) marks[cf.name] = Object.create(null);
        marks[cf.name][p.idx] = cf;
      });
    });

    var list = order.filter(function (n) { return !lineage.childOf[n]; }).map(function (name) {
      var kids = (lineage.splits[name] || {}).kids || [];
      var members = [name].concat(kids);

      var timeline = r.passes.map(function (p) {
        var parts = members.map(function (m) {
          var rec = rows[m] && rows[m][p.idx];
          return rec ? {
            name: m, lines: rec.lines, stmts: rec.stmts, kind: rec.kind,
            loops: rec.loops || 0, allocs: rec.allocs || 0, tasks: rec.tasks || 0,
          } : null;
        }).filter(Boolean);
        var touched = members.filter(function (m) { return marks[m] && marks[m][p.idx]; });
        function sum(k) { return parts.reduce(function (a, b) { return a + b[k]; }, 0); }
        return {
          idx: p.idx,
          name: p.name,
          phase: p.phase,
```

<a id="transport"></a>
## transport
`repo/pto/docs/en/dev/passes/19-expand_mixed_kernel.md:59–64`；SHA256 `5a7934765353bdeec6ea74fdb48900433c21d8672a14a5294ce47a589b10fd4d`
```text
Cross-core data transfer at CV boundaries is handled by splitting explicit `tile.move` ops into `tpush`/`tpop` pairs:

| Direction | AIC side | AIV side |
| --------- | -------- | -------- |
| Cube→Vector (e.g. Acc→Vec) | `tpush_to_aiv(source_tile)` | `dest_var = tpop_from_aic()` |
| Vector→Cube (e.g. Vec→Mat/Left/Right) | `dest_var = tpop_from_aiv()` | `tile.move` to adapt fractal layout, then `tpush_to_aic(adapted_tile)` |
```
