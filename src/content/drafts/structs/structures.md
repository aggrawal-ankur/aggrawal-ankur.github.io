# Structures

A structure is a contiguous block of memory that groups different variables under one name.

Example:
```c
#include <stdio.h>

struct Point {
  int x;
  int y;
};

int main(void){
  struct Point p1;               // No Initialization
  p1.x = 6;
  p1.y = 5;

  struct Point p2 = {6, 6};      // Complete Initialization

  struct Point p3 = {};          // Empty Initialization: Zero-initialize

  struct Point p4 = {7};         // Incomplete Initialization: The rest is automatically zeroed.
}
```

A `struct` definition doesn't reserve any space. It is a compilation-time artifact. Only variables of that definitions gets any storage.

***Note: printf() is used to make the main() a non-leaf function. ***

## auto class

```c
#include <stdio.h>

struct Point {
  int x;
  int y;
};

int main(void){
  struct Point p1;
  p1.x = 6;
  p1.y = 5;

  printf("Hello.\n");
}
```

Two integers take 8 bytes and 8 bytes for padding, so we expect 16 bytes of reservation on the stack.

This is the assembly:
```nasm
main:
	push rbp
	mov	 rbp, rsp
	sub	 rsp, 16

	mov	 DWORD PTR -8[rbp], 6
	mov	 DWORD PTR -4[rbp], 5

	lea	 rax, .LC0[rip]
	mov	 rdi, rax
	call puts@PLT
	mov	 eax, 0
	leave
	ret
```

Indeed.

## Block Static

```c
#include <stdio.h>

struct Point {
  int x;
  int y;
};

int main(void){
  static struct Point p1;
  p1.x = 6;
  p1.y = 5;

  printf("Hello.\n");
}
```

Since `p1` is a block static, we are expecting it to have static storage.

This is the assembly:
```nasm
main:
	push rbp
	mov	 rbp, rsp

	mov	 DWORD PTR p1.0[rip], 6
	mov	 DWORD PTR p1.0[rip+4], 5

	lea	 rax, .LC0[rip]
	mov	 rdi, rax
	call puts@PLT
	mov	 eax, 0
	pop	 rbp
	ret

	.local	p1.0
	.comm	p1.0,8,8
```

As expected, there is no reservation on stack.

## File Static

```c
#include <stdio.h>

struct Point {
  int x;
  int y;
};

static struct Point p1;

int main(void){
  p1.x = 6;
  p1.y = 5;

  printf("Hello.\n");
}
```

`p1` is declared in file scope, but with `static` class. We are expecting static storage.

This is the assembly:
```nasm
	.text
	.local    p1
	.comm     p1,8,8
	.section  .rodata

.LC0:
	.string	"Hello."
	.text
	.globl main
	.type  main, @function

main:
	push rbp
	mov	 rbp, rsp
	mov	 DWORD PTR p1[rip], 6
	mov	 DWORD PTR p1[rip+4], 5
	lea	 rax, .LC0[rip]
	mov	 rdi, rax
	call puts@PLT
	mov	 eax, 0
	pop	 rbp
	ret
```

## Extern

```c
#include <stdio.h>

struct Point {
  int x;
  int y;
};

struct Point p1;

int main(void){
  p1.x = 6;
  p1.y = 5;

  printf("Hello.\n");
}
```

`p1` id declared an extern here. We expect it to be globally available.

This is the assembly:
```nasm
	.text
	.globl p1
	.bss
	.align 8
	.type  p1, @object
	.size  p1, 8

p1:
	.zero  8
	.section   .rodata

.LC0:
	.string	"Hello."
	.text
	.globl	main
	.type	main, @function

main:
	push rbp
	mov	 rbp, rsp
	mov	 DWORD PTR p1[rip], 6
	mov	 DWORD PTR p1[rip+4], 5
	lea	 rax, .LC0[rip]
	mov	 rdi, rax
	call puts@PLT
	mov	 eax, 0
	pop	 rbp
	ret
```

As expected, `p1` is declared as a global symbol.
