# Array Decay

***Also know as array-to-pointer decay, is an internal process that automatically converts an array into a pointer to its first element. This conversion leads to the loss of array's original size and dimension information.***

It is essential for passing an array to a function.

Take this:
```c
#include <stdio.h>

void takeArray(int arr[]){}

void takeArrayPtr(int* arr){}

int main(){
  int arr[] = {41, 23, 94, 55};
  takeArray(arr);
}
```

This is the assembly for both the functions.
```nasm
takeArray:
	push rbp
	mov	 rbp, rsp
	mov	 QWORD PTR -8[rbp], rdi
	nop
	pop	rbp
	ret

takeArrayPtr:
	push rbp
	mov	 rbp, rsp
	mov	 QWORD PTR -8[rbp], rdi
	nop
	pop	 rbp
	ret

main:
	push rbp
	mov	 rbp, rsp
	sub	 rsp, 16

	mov	 DWORD PTR -16[rbp], 41
	mov	 DWORD PTR -12[rbp], 23
	mov	 DWORD PTR -8[rbp], 94
	mov	 DWORD PTR -4[rbp], 55

	lea	 rax, -16[rbp]
	mov	 rdi, rax
	call takeArray

	mov	 eax, 0
	leave
	ret
```

There is no difference.