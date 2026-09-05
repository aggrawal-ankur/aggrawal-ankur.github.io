# Examples

We will use this command to compile our source to assembly.
```bash
gcc ./main.c -S -O0 -fno-asynchronous-unwind-tables -fno-dwarf2-cfi-asm -masm=intel
```
This ensures that we get intel syntax, no optimization and no `cfi*` directives. Pure assembly.

## Function scope and default storage class

An integer is sized 4-bytes but that makes `rsp` misaligned, so we are expecting the compiler to reserve 16 bytes on the stack.
```c
#include <stdio.h>

int main(void){
  int a;
}
```
**Reality:** Function prologue and epilogue. No allocation on stack.

---

Lets use this declaration somewhere. Lets take user input.
```c
#include <stdio.h>

int main(void){
  int a;
  printf("Enter a: ");
  scanf("%d", &a);
}
```

This is the assembly:
```nasm
main:
	push rbp
	mov	 rbp, rsp
	sub	 rsp, 16            ; <- Here
	lea	 rax, .LC0[rip]
	mov	 rdi, rax
	mov	 eax, 0
	call printf@PLT
	lea	 rax, -4[rbp]
	mov	 rsi, rax
	lea	 rax, .LC1[rip]
	mov	 rdi, rax
	mov	 eax, 0
	call __isoc99_scanf@PLT
	mov	 eax, 0
	leave
	ret
```
We have stack allocation. It is rounded up to 16 bytes to keep rsp aligned.

---

What if we "declare + initialize", instead of user input?
```c
#include <stdio.h>

int main(void){
  int a = 45;
}
```

This is the assembly:
```c
main:
	push rbp
	mov	 rbp, rsp
	mov	 DWORD PTR -4[rbp], 45
	mov	 eax, 0
	pop	 rbp
	ret
```

Since main is a leaf function, the compiler optimized to not use rsp. It used `rbp` as a reference point (for the current stack frame) and reserved 4 bytes from there. Then we are storing 45 at the 4th block (byte).

The stack is not misaligned because we are not moving the stack pointer. We are moving `rbp` relative.

## Outcomes

1. Any allocation in a block scope has the `auto` storage class and goes on the stack by default.
2. If a block scope declaration is uninitialized and is not populated/used later in the program, the compiler doesn't reserve space for it.
3. `rsp` is subtracted 16-bytes aligned to reserve space.
4. `rbp` is used as a stable pointer to reference allocations inside a stack frame.

## Outside function scope and default storage class

Since it is uninitialized, it should be zero-initialized at runtime and declared in `.bss`.
```c
#include <stdio.h>

int BASE;

int main(void){}
```

This is the assembly:
```nasm
	.text
	.globl BASE
	.bss
	.align 4
	.type  BASE, @object
	.size  BASE, 4
PI:
	.zero  4
```
Indeed.

---

We can use readelf to check its linkage as we are not using .c multiple files so there is no other way to verify if it is "globally" available or not.
```bash
$ readelf ./main --symbols | grep BASE

31: 0000000000004014     4 OBJECT  GLOBAL DEFAULT   25 BASE
```
Verified.

---

Let' initialize it.
```c
#include <stdio.h>

int BASE = 16;

int main(void){}
```
Now the declaration should be in `.data`.

This is the assembly:
```nasm
	.text
	.globl BASE
	.data
	.align 4
	.type  BASE, @object
	.size  BASE, 4
PI:
	.long  16
```
Indeed.

## Outcomes

A global declaration has external linkage and always exist in memory.
