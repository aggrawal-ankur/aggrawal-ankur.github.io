# File Static

***A file static identifier inherits the program's lifetime but is only accessible by the instructions belonging to its source file.***

`PI` is a file static declaration here:
```c
// abcd.c
#include <stdio.h>

static float PI = 3.14;

int main(void);
```
... which means, `PI` is stored in the static storage but only accessible by the instructions belonging to `abcd.c` source file.

---

Example:
```c
#include <stdio.h>

static int BASE;

int main(void){}
```

We expect `BASE` to have internal linkage and a declaration in `.bss`.

This is the assembly.
```nasm
.text
.local BASE
.comm  BASE,4,4
```
Indeed.

---

Example:
```c
#include <stdio.h>

static int BASE = 16;

int main(void){}
```

Here we expect a declaration in `.data`.

This is the assembly.
```nasm
	.data
	.align 4
	.type	BASE, @object
	.size	BASE, 4
PI:
	.long	16
```
Indeed.