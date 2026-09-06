# Program Storage and Accessibility Clauses

Program storage can be divided into:

  1. **Stack**: per-function (call frame) storage.
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

There are 4 storage classes: auto, resigner, static and extern.

---

Scope defines where a variable can be referenced or accessed. There are 3 scopes.
  1. Block scope
  2. File scope
  3. Program scope

## Block Scope

All variables inside a pair of curly-braces are block scoped. Example: functions, if-else and loops.

The default storage class for block scoped declarations is `auto`, which means the variable goes on stack. It is implicit, which is why no one specifies it.

As long as the block exist, the variables exist. When the block terminates, the variables cease to exist, which is why they can not be referenced outside of the block.

## File Scope and Program Scope

A variable which is globally accessible within one translation unit is a file scoped declaration.

A variable which is accessible throughout the whole program is a program scoped declaration.

By default, a variable declared outside of any function is a program scoped declaration. However, if we use `static`, the declaration becomes file scoped.

In the example below, pie1 is a program scoped variable and pie2 is a file scoped variable.
```c
/* hello.c */
#include <stdio.h>

float pie1 = 3.14;
static float pie2 = 3.14;

int main(void);
```

## Assembly Context

Block scoped declarations are a part of C only. The compiler enforces block scope accessibility. Once we are in assembly, we can easily access those variables.

Assembly doesn't have scopes. It has linkage.

**If I use one identifier across multiple translation units, do they refer to the same object, or different ones?** This is answered by linkage.

There are two types of linkages: external and internal.
  - With external linkage, an identifier refers to the same object throughout the program (across all the TUs).
  - Within one translation unit, each declaration of an identifier with internal linkage refers to the same object and it is visible within that TU only.

A variable with `extern` storage class has external linkage (STB_GLOBAL). A variable with `static` storage class has internal linkage (STB_LOCAL), doesn't matter where it is declared in the file.

---

| Storage Class | Scope | Lifetime | Default Value (when uninitialized) | Storage Location |
| :------------ | :---- | :------- | :--------------------------------- | :--------------- |
| auto     | Block | Until the block lives | Garbage (undefined) | Stack |
| register | | | Garbage (undefined) | A register |
| static   | **Block scope** when declared within a block, **File scope** when declared globally in the file. | Until the program exist in memory | 0 | `.data` (if initialized); `.bss` (if uninitialized, or zero-initialized) |
| extern   | Program scope | Until the program exist in memory | 0 | `.data` (if initialized); `.bss` (if uninitialized, or zero-initialized) |

---





how static (.data/.bss) variables are created in assembly.
static with function? static inline
extern inside a block?




<!-- CONFUSED ABOUT THIS PART -->

<!-- These storage classes influence the assembly.
  - If `extern`, the symbol is marked global.
  - For an `auto`, a unique symbol is emitted, usually `.0` suffixed or a `.` prefixed symbol.
  - The symbol is left as is if `static` is used.
  - Register needs nothing.

The assembly determines how the linker perceives a symbol. -->