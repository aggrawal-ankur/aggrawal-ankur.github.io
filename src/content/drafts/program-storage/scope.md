# The Concept Of Scope

***Scope defines where a declaration can be referenced from.***

There are 2 scopes.
  1. Block Scope
  2. File Scope

## Block Scope

***Any declaration inside a `{ }` block is block scoped.***

Example: functions, if-else and loops.

The default storage class for block scoped declarations is `auto`.

It resembles with **local scope** but that is too shallow because a block itself can contain other blocks. Example:

  * A function is a block that can contain an if block, which can contain another series of conditional blocks.
  * A function can contain a for loop, which may contain nested if-else blocks.

As long as the block persist, the declaration persist. When the block goes out of business, the declarations perish.

---

A block scope declaration always has the `auto` storage class. We don't need to specify it.

## File Scope

***A declaration which is globally accessible within one translation unit is considered a file scoped declaration.***

For example, `pie` is a file scoped declaration within the `hello.c` translation unit.
```c
// hello.c
#include <stdio.h>

float pie = 3.14;

int main(void);
```

A file scope declaration has `extern` storage class by default, but it can also have the `static` storage class.
  - These two storage classes specify the linkage of an identifier.
  - `extern` makes the identifier visible across all translation units, thus the whole program, basically.
  - `static` restricts the identifier to its translation unit only.

# Note

Scope is a part of C's language grammar, therefore it is implemented at compile-time only.

It is the compiler's job to emit an assembly which complies with the C's language grammar.

If you get your hands on the compiler-generated assembly, you can mess with scope rules because they don't exist at assembly level.
