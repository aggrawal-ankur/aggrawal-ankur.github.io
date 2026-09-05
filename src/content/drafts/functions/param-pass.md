# Parameter Passing

***Parameters are the variables defined in a function's definition. They act as placeholders for values the function will receive and provides a way to use them in the function's body.***

***Arguments are the actual values supplied to a function when it is called.***

For example:
```c
#include <stdio.h>

int square(int n){
  return n*n;
}

int main(void){
  square(5);
}
```
  - `n` is the parameter and `5` is the argument.

---

Arguments can be passed in two ways.

1. A copy of the original value.
2. A reference of the original value.

*When a copy of the original value is passed, any manipulation made inside the function doesn't affect the original value. Such a function call is known as **call by value**.*

*When a reference of the original value is passed, the function receives the original value. Any manipulation made to the value affects the original value. Such a function call is known as **call by reference**.*

---

In this example, we have two functions, both taking a number and incrementing it by 10.
```c
#include <stdio.h>

void inc1(int n){
  printf("Inside inc1\n");
  printf("  Before increment: %d\n", n);
  n += 10;
  printf("  After increment: %d\n", n);
}

void inc2(int *m){
  printf("Inside inc2\n");
  printf("  Before increment: %d\n", *m);
  *m += 10;
  printf("  After increment: %d\n", *m);
}

int main(){
  int n = 2;
  printf("In main\n");
  printf("  Before increment: %d\n", n);
  inc1(n);
  printf("In main\n");
  printf("  After increment: %d\n", n);

  printf("\n--------\n\n");

  int m = 4;
  printf("In main\n");
  printf("  Before increment: %d\n", m);
  inc2(&m);
  printf("In main\n");
  printf("  After increment: %d\n", m);
}
```

`inc1(n)` is an example of call by value and `inc2(&m)` is an example of call by reference.

## Assembly Comparison

Take this code:
```c
#include <stdio.h>

int sq_by_val(int n){
  n = n*n;
}

int sq_by_ref(int *m){
  *m = (*m)*(*m);
}

int main(void){
  int n = 5;
  int m = 6;

  sq_by_val(5);
  sq_by_ref(&m);

  printf("n = %d\n", n);
  printf("m = %d\n", m);
}
```

This is the assembly:
```nasm
	.text
	.globl	sq_by_val
	.type	sq_by_val, @function
sq_by_val:
	push rbp
	mov	 rbp, rsp

	mov	 DWORD PTR -4[rbp], edi        ; Store a copy of n
	mov	 eax, DWORD PTR -4[rbp]        ; Load n
	imul eax, eax                      ; Compute n*n
	mov	 DWORD PTR -4[rbp], eax        ; Store n*n
	nop
	pop	 rbp
	ret

	.globl	sq_by_ref
	.type	sq_by_ref, @function
sq_by_ref:
	push rbp
	mov	 rbp, rsp

	mov	 QWORD PTR -8[rbp], rdi     ; Store a ptr to m
	mov	 rax, QWORD PTR -8[rbp]     ; Load the addr of m
	mov	 edx, DWORD PTR [rax]       ; Load m
	mov	 rax, QWORD PTR -8[rbp]     ; Load the addr of m
	mov	 eax, DWORD PTR [rax]       ; Load m
	imul edx, eax                   ; Compute m*m
	mov	 rax, QWORD PTR -8[rbp]     ; Load the ptr to m
	mov	 DWORD PTR [rax], edx       ; Update the value at the memory with m*m

	nop
	pop	 rbp
	ret

	.section	.rodata
.LC0:
	.string	"n = %d\n"
.LC1:
	.string	"m = %d\n"

	.text
	.globl	main
	.type	main, @function
main:
	push rbp
	mov	 rbp, rsp
	sub	 rsp, 16

	mov	 DWORD PTR -4[rbp], 5   ; Store n
	mov	 DWORD PTR -8[rbp], 6   ; Store m

	mov	 edi, 5
	call sq_by_val

	lea	 rax, -8[rbp]
	mov	 rdi, rax
	call sq_by_ref

	mov	 eax, DWORD PTR -4[rbp]
	mov	 esi, eax
	lea	 rax, .LC0[rip]
	mov	 rdi, rax
	mov	 eax, 0
	call printf@PLT

	mov	 eax, DWORD PTR -8[rbp]
	mov	 esi, eax
	lea	 rax, .LC1[rip]
	mov	 rdi, rax
	mov	 eax, 0
	call printf@PLT

	mov	 eax, 0
	leave
	ret

```

## But what is the utility of call by reference?

That's the only way stack frames can interact.

That's how you pass arrays to a function.

That's the only way stack frames can manage complex data.

Reference is the **only** mechanism that lets a function access memory outside its own frame.