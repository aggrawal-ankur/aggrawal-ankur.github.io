# Program Storage and Accessibility Clauses

Program storage can be divided into:

  1. **Stack**: per-call storage.
  2. **Static**: program-lifetime storage.
  3. **Heap**: for dynamic allocation.

To understand which program storage is in use for a variable, we have to understand storage classes.

---

The C source we write either has storage classes enabled by default (extern and auto) or we define them ourselves (static and register).

<!-- CONFUSED ABOUT THIS PART -->

<!-- These storage classes influence the assembly.
  - If `extern`, the symbol is marked global.
  - For an `auto`, a unique symbol is emitted, usually `.0` suffixed or a `.` prefixed symbol.
  - The symbol is left as is if `static` is used.
  - Register needs nothing.

The assembly determines how the linker perceives a symbol. -->

---

| Variable Scope | Storage Class | Storage Location | Lifetime | Accessibility |
| :------------- | :------------ | :--------------- | :------- | :------------ |
| Block | auto (default) | Stack | Block's lifetime | Within the block |
| | static | Static storage (.data/.bss) | Program's lifetime | Within the block |
| Global in the file | extern (default) | Static storage (.data/.bss) | Program's lifetime | Entire program |
| | static | Static storage (.data/.bss) | Program's lifetime | Instructions from that TU in the final program |

---

**Note: Accessibility belongs to C. It doesn't apply to assembly.**




static with function? static inline
extern inside a block?
