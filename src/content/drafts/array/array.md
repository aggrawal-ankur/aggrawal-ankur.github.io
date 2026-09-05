# Arrays

Arrays are consecutive blocks of memory interpreted together as a collection.

Note: We use printf to make `main()` a non-leaf function so that we don't have to confuse with red zone.

## Example 1: Declaration Only

Here we are only declaring the array. No initialization.
```c
#include <stdio.h>

int main(void){
  int arr[5];
}
```

This is the assembly and as expected, there is no reservation on the stack.
```nasm
main:
	push rbp
	mov	 rbp, rsp
	mov	 eax, 0
	pop	 rbp
	ret
```

## Example 2 - Declare and Use (No init)

Here we are declaring an array and printing its elements without initialization.

As expected, we get garbage value.

## Example 3 - Declaration + Initialization

When we properly define the array (declare and initialize), we expect `n*sizeof(int)` bytes reserved on the stack. If the number is not 16-bytes aligned, round it up.

```c
#include <stdio.h>

int main(void){
  int arr[5] = {1, 2, 3, 4, 5};
  printf("Hello\n");
}
```

We expect 32 bytes on the stack as 20 bytes rounded up to the nearest 16-divisible value is 32.

This is the assembly:
```nasm
main:
	push rbp
	mov	 rbp, rsp
	sub	 rsp, 32
	mov	 DWORD PTR -32[rbp], 1
	mov	 DWORD PTR -28[rbp], 2
	mov	 DWORD PTR -24[rbp], 3
	mov	 DWORD PTR -20[rbp], 4
	mov	 DWORD PTR -16[rbp], 5
```

As expected, 32 bytes are reserved on the stack.

Even if we do not mention 5 explicitly, the assembly generated is no different, because the calculation for size is done during compilation.

## Example 4 - Empty Initialization

Here we are defining an empty array of 5 elements.
```c
#include <stdio.h>

int main(void){
  int arr[5] = {};
}
```

This is the assembly:
```nasm
main:
	push rbp
	mov	 rbp, rsp
	sub	 rsp, 32

	pxor	xmm0, xmm0
	movaps	XMMWORD PTR -32[rbp], xmm0
	movaps	XMMWORD PTR -16[rbp], xmm0
```

The 3 instructions `pxor movaps*2` are used to zero-initialize the 5 elements at runtime.

If we use `-mno-sse -mno-sse2 -mno-avx` flags with `gcc` , we can see that the compiler uses `mov` instructions.
```nasm
main:
	push rbp
	mov	 rbp, rsp
	sub	 rsp, 32
	mov	 QWORD PTR -32[rbp], 0
	mov	 QWORD PTR -24[rbp], 0
	mov	 QWORD PTR -16[rbp], 0
	mov	 QWORD PTR -8[rbp], 0
```

If we change from `arr[5]` to `arr[100]` and keep these flags, we'd expect too many `mov` instructions. Let's see.

```nasm
main:
	push rbp
	mov	 rbp, rsp
	sub	 rsp, 400
	lea	 rdx, -400[rbp]
	mov	 eax, 0
	mov	 ecx, 50
	mov	 rdi, rdx
	rep  stosq
```

That's not the case.

I recompiled the `arr[5]` code again and now I have a slightly different assembly. The number of `mov` instructions reduced.

```nasm
main:
	push	rbp
	mov	rbp, rsp
	sub	rsp, 32
	mov	QWORD PTR -20[rbp], 0
	mov	QWORD PTR -12[rbp], 0
	mov	DWORD PTR -4[rbp], 0
```

---

Modern compilers are **optimization monsters**. They have evolved for decades and now they have too many tricks under their sleeves. You close one door and another is opened.

Compilers search for the most efficient way to do something, and that depends on so many parameters. This is why there is always a possibility that two identical systems in an identical environment with the same compiler can generate a completely different assembly.

***The assembly might be different, but the intent always remains the same.***

There are so many ways to achieve the desired outcome that the path almost becomes insignificant.

*That's why, understanding the intent is a far better strategy than understanding every optimization that the compiler can make to achieve the same outcome. There is no end to compiler optimizations.*

---

So, what's the intent here?

* The intent is to zero-initialize the array efficiently.
* SIMD instructions are one way to do that. They zero multiple integers in parallel, reducing instruction count and improving throughput.
* `pxor` clears the register, and `movaps` writes aligned 128-bit blocks.
* For now, it's enough to know that SIMD zeroes multiple elements in parallel for efficiency.

---

Therefore,
  - *when we declare an array without initializing it, it contains garbage value at runtime.*
  - *when we define any empty array, it is zero-initialized at runtime.*

## Example 5 - Incomplete Initialization

We are declaring an array of 5 elements but we are not initializing all the 5 elements.
```c
#include <stdio.h>

int main(void){
  int arr[5] = {1, 2, 3};
  printf("Hello\n");
}
```

This is the assembly:
```nasm
main:
	push	rbp
	mov	rbp, rsp
	sub	rsp, 32

	; Zero-initialize the array
	pxor	xmm0, xmm0
	movaps	XMMWORD PTR -32[rbp], xmm0
	movd	DWORD PTR -16[rbp], xmm0

	; Initialize the positions from starting
	mov	DWORD PTR -32[rbp], 1
	mov	DWORD PTR -28[rbp], 2
	mov	DWORD PTR -24[rbp], 3
```

An uninitialized array has garbage values but an initialized array (even partial ones) should have proper values.

In case of partial initialization, the remaining positions are zero-initialized at runtime, making the array perfect.

### Questions Time

**Q1. What's the purpose of saving `rsp` in `rbx` ? And why we are pushing `rbx` on stack?**

  * `rbx` is a callee-saved register. If the callee function want to use `rbx`, it has to preserve the state of `rbx` and return `rbx` in the same state to the caller function. That's why it is pushed on stack.
  * We are using it to preserve the state of `rsp` after reserving 40 bytes. Later it used in cleanup.

**Q2. Why inconsistent use of registers? When you need sign-extended value, why you are using `eax`? just use `rax` directly?**
  * Compiler optimization.

**Q3. How the stack is cleaned up after usage?**

* Just reduce `rsp` and we're done.
* There are thousands of processes running constantly. It doesn't matter as the next process overwrites the old memory.
* That's why sometimes we get exactly what we expect but the next moment it vanishes because the stack memory mistakenly had that exact value from a previous process but soon some other process override it. An undefined behavior, basically.
