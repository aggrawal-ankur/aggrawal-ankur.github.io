# Program Storage and Accessibility Clauses

Program storage can be divided into:

  1. **Stack**: per-call storage.
  2. **Static**: program-lifetime storage.
  3. **Heap**: for dynamic allocation.

Any allocation that doesn't rely on malloc-family functions is either stack or static allocation. To understand them, we have to understand storage classes.

---

The C source we write either has storage classes enabled by default (extern and auto) or we define them ourselves (static and register).

These storage classes influence the assembly.
  - For an `extern`, the symbol is marked global.
  - For an `auto`, a unique symbol is emitted, usually `.0` suffixed or a `.` prefixed symbol.
  - The symbol is left as is if `static` is used.
  - Register needs nothing.

The assembly determines how the linker perceives a symbol.

# Final Mental Model

| Declared In | Default Storage Class | Explicit Storage Class | Storage Location | Lifetime | Accessibility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Block | auto | | Stack | Block's lifetime | Within the block |
| Block | | static | Static storage (.data/.bss) | Program's lifetime | Within the block |
| File (Outside all blocks ) | extern | | Static storage (.data/.bss) | Program's lifetime | Entire program |
| File (Outside all blocks ) | | static | Static storage (.data/.bss) | Program's lifetime | Instructions from that file in the final program |

---

A block static identifier inherits the program's lifetime but the block's accessibility.

A file static identifier inherits the program's lifetime but file-only accessibility.

---

# Note

The accessibility part belong to C grammar. This rule has no meaning for assembly.