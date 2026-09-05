# Pointer To Struct

```c
#include <stdio.h>

struct Point {
  int x;
  int y;
};

int main() {
  struct Point p = {10, 20};
  struct Point *ptr = &p;

  ptr->x = 30;
  ptr->y = 40;

  printf("%d %d\n", p.x, p.y);
}
```

This is the assembly:
```nasm
.LC0:
	.string	"%d %d\n"

main:
	push rbp
	mov	 rbp, rsp
	sub	 rsp, 16

	mov	 DWORD PTR -16[rbp], 10
	mov	 DWORD PTR -12[rbp], 20

	lea	 rax, -16[rbp]
	mov	 QWORD PTR -8[rbp], rax

	mov	 rax, QWORD PTR -8[rbp]
	mov	 DWORD PTR [rax], 30

	mov	 rax, QWORD PTR -8[rbp]
	mov	 DWORD PTR 4[rax], 40

	mov	 edx, DWORD PTR -12[rbp]
	mov	 eax, DWORD PTR -16[rbp]
	mov	 esi, eax
	lea	 rax, .LC0[rip]
	mov	 rdi, rax
	mov	 eax, 0
	call printf@PLT

	mov	 eax, 0
	leave
	ret
```

Lets draw the initial state of the stack.

```
3992 <->     rbp  <->
3988 <->  -4[rbp] <->
3984 <->  -8[rbp] <->
3980 <-> -12[rbp] <-> 20        p.y
3972 <-> -16[rbp] <-> 10        p.x
```

Let's go instruction by instruction as too much movement in close proximity is happening.

---

These two instructions setup our struct pointer `ptr` which goes at `-8[rbp]` .
```nasm
lea rax, -16[rbp]                    ; obtain the address of p.x
mov QWORD PTR -8[rbp], rax           ; save it at -8[rbp]
```

State of stack:
```
3992 <->     rbp  <->
3988 <->  -4[rbp] <->
3984 <->  -8[rbp] <-> 3972    ptr
3980 <-> -12[rbp] <-> 20      p.y
3972 <-> -16[rbp] <-> 10      p.x
```

These two instructions obtain the address of `p.x` and update the value at it with 30.
```
mov rax, QWORD PTR -8[rbp]
mov DWORD PTR [rax], 30
```

State of stack:
```
3992 <->     rbp  <->
3988 <->  -4[rbp] <->
3984 <->  -8[rbp] <-> 3972    ptr
3980 <-> -12[rbp] <-> 20      p.y
3972 <-> -16[rbp] <-> 30      p.x
```

---

These two instructions obtain the address of `p.y` and update the value at it with 40.
```
mov rax, QWORD PTR -8[rbp]
mov DWORD PTR 4[rax], 40
```

State of stack:
```
3992 <->     rbp  <->
3988 <->  -4[rbp] <->
3984 <->  -8[rbp] <-> 3972    ptr
3980 <-> -12[rbp] <-> 40      p.y
3972 <-> -16[rbp] <-> 30      p.x
```
