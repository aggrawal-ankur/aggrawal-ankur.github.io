# Structures As Function Arguments

Unlike arrays, a struct doesn't decay into a pointer when passed to a function.

Take this:
```c
#include <stdio.h>

struct Point {
  int x;
  int y;
};

void takePointPtr(struct Point *p){}

void takePoint(struct Point p){}

int main() {
  struct Point p = {10, 20};
  printPoint(p);
  printPointPtr(&p);
}
```

This is the assembly:
```nasm
takePointPtr:
	push rbp
	mov	 rbp, rsp
	mov	 QWORD PTR -8[rbp], rdi
	nop
	pop  rbp
	ret

takePoint:
	push rbp
	mov	 rbp, rsp
	mov	 QWORD PTR -8[rbp], rdi
	nop
	pop  rbp
	ret

main:
	push rbp
	mov	 rbp, rsp
	sub	 rsp, 16
	mov	 DWORD PTR -8[rbp], 10
	mov	 DWORD PTR -4[rbp], 20

	mov	 rax, QWORD PTR -8[rbp]    ; loading a QWORD value
	mov	 rdi, rax
	call takePoint

	lea	 rax, -8[rbp]              ; loading an address
	mov	 rdi, rax
	call takePointPtr

	mov	 eax, 0
	leave
	ret
```

Although both the functions have the same assembly, but the difference lies in what does the `main` procedure calls them with.
  - `takePoint` receives a QWORD value.
  - `takePointPtr` receives a pointer to the first value.
