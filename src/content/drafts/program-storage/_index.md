# Program Storage and Accessibility Clauses

Program storage can be divided into:

  1. **Stack**: per-call storage.
  2. **Static**: program-lifetime storage.
  3. **Heap**: for dynamic allocation.

To understand which program storage is in use for a variable, we have to understand storage classes.

---

There are 4 things associated with a variable.

  1. **Storage Location:** Where in the memory the variable would be stored?
  2. **Lifetime:** How long the variable should exist (or be accessible)?
  3. **Scope:** Where the variable can be accessed from?
  4. **Default State:** Whether the variable has a default value if uninitialized?

All variables in C have a storage class. Sometimes it is visible, other times it is not. A storage class gives a compiler the 4 pieces of information associated with a variable. [NEEDS IMP.]

<!-- CONFUSED ABOUT THIS PART -->

<!-- These storage classes influence the assembly.
  - If `extern`, the symbol is marked global.
  - For an `auto`, a unique symbol is emitted, usually `.0` suffixed or a `.` prefixed symbol.
  - The symbol is left as is if `static` is used.
  - Register needs nothing.

The assembly determines how the linker perceives a symbol. -->

---

There are 4 storage classes.

| Storage Class | Scope | Lifetime | Default Value (when uninitialized) | Storage Location |
| :------------ | :---- | :------- | :--------------------------------- | :--------------- |
| auto     | Block | Until the block lives | Garbage (undefined) | Stack |
| register | | | Garbage (undefined) | A register |
| static   | **Block scope** when declared within a block, **File scope** when declared globally in the file. | Until the program exist in memory | 0 | `.data` (if initialized); `.bss` (if uninitialized, or zero-initialized) |
| extern   | Program scope | Until the program exist in memory | 0 | `.data` (if initialized); `.bss` (if uninitialized, or zero-initialized) |

---

1. A variable declared inside a block by default has the `auto` storage class. This variable goes on stack, inherits garbage value from the stack, is accessible by the instructions in that block and dies when the block terminates. If `static` is used with this variable, it's lifetime is increased to program scope, it has a default value if uninitialized, but it remains accessible within the block only.

2. A variable declared at file scope (no blocks) by default has the `extern` storage class. The variable goes on static storage, has program's lifetime and is accessible by the whole program. If `static` is used with this variable, it's accessibility is reduced to the TU it is defined in.

**Note: Accessibility belongs to C. It doesn't apply to assembly.**




how static (.data/.bss) variables are created in assembly.
static with function? static inline
extern inside a block?
