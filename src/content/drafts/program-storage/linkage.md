# The Concept Of Linkage

***If I use one identifier across multiple translation units, do they refer to the same object, or different ones?***
  - This is specified by linkage.

## External Linkage

***The identifier refers to the same object across all the translation units.***

When a declaration is placed outside of any function, it has the `extern` storage class, which makes it accessible to the entire project (all the .c files; every translation unit).

---
Example:
```c
int PI = 3.14;
extern int PI2 = 3.14;

int circumference(int r) {
  return 2 * PI * r;
}
```
  - Both `PI` and `PI2` have external linkage.

---

External linkage is achieved by the `extern` keyword, which tells the assembler to make a symbol global, which tells the linker to keep the symbol visible across the program.

## Internal Linkage

***Within one translation unit, each declaration of an identifier with internal linkage denotes the same object and it is visible within that translation unit only.***

---

Example:
```c
static int PI = 3.14;

int circumference(int r) { return 2 * PI * r; }

int area(int r){ return PI * r * r; }
```
  - In this translation unit, anyone referring to **PI** would be referring to the **PI** declared in this file.

---

Internal linkage is achieved by the `static` keyword, which tells the assembler not to make the identifier a global symbol, which tells the linker to keep the symbol invisible outside its object file.

## No Linkage

***An identifier with no linkage refers to a unique entity accessible only within its own scope, never shared across files or blocks.***

When a symbol has the `auto` storage class, it is stored on the stack and its lifetime is depended on the block's lifetime, which means exporting it has no meaning, so there is no need for linkage.