# Variable Length Arrays

We don't have to fix the length of an array at compile-time.

We can pre-compute a value based on some formula, just before passing it to the array, like this:
```c
int n = 5;
int arr[n];
```

We can take the number as an input from the user, like this:
```c
int m;
scanf("%d", &m);
int arr[m];
```

Both are identified as variable length allocations, even though the first one has `n` known already.

---

VLA assumes `n` is not known at compile-time, so it has to calculate how much padding `n*sizeof(type)` would require to satisfy the 16-divisible demand.

## High Level Idea

1. Calculate the space for things defined at compile-time and reserve it on stack.
2. Ensure `n` is populated, either at compile-time or runtime.
3. Calculate the bytes required by `type arr[n]` declaration.
4. Calculate the padding required for 16-bytes alignment for `rsp`.
5. Reserve the space for the array on stack.
6. Align the base address of the array (arr[0]) 4-bytes.

## Example

```c
#include <stdio.h>

int main(void){
  int n;                // Not known at compile-time
  scanf("%d", &n);

  int arr[n];
  printf("%d", arr[0]);
}
```

Normally, an integer is sized 4-bytes, so the total requirement is given by `n*4` bytes.

Lets see how much padding is required for `n ∈ {1....8}`

| n    | Bytes    | Padding |
| :--- | :----    | :------ |
|  1   | 1*4 = 4  | 16 - 4 = 12  |
|  2   | 2*4 = 8  | 16 - 8 = 8   |
|  3   | 3*4 = 12 | 16 - 12 = 4  |
|  4   | 4*4 = 16 | 16 - 16 = 0  |
|  5   | 5*4 = 20 | 32 - 20 = 12 |
|  6   | 6*4 = 24 | 32 - 24 = 8  |
|  7   | 7*4 = 28 | 32 - 28 = 4  |
|  8   | 8*4 = 32 | 32 - 32 = 0  |

This shows that the value for padding for a 4-byte integer belongs to `{0, 4, 8, 12}`. Also, when the total bytes required are greater than the closest 16-divisible digit, we take the next 16-divisible digit.

With this information, we can create a simple program to calculate the total bytes required.

```c
#include <stdio.h>

int main(void){
  int n;
  printf("Enter n: ");
  scanf("%d", &n);

  int l, u;
  int bytes = n * sizeof(int);

  if (bytes % 16 == 0){
    printf("Voila... It's a multiple of 16 already!\n");
    return 0;
  }
  else if (bytes % 16 > 8){
    u = bytes + ((bytes % 16) - 8);
    l = u - 16;
  }
  else{
    l = bytes - ((bytes % 16));
    u = l + 16;
  }

  printf("u: %d\n", u);
  printf("l: %d\n", l);
  printf("\n Allocate %d bytes on stack.\n", u);
}
```

This program "efficiently" calculates how much `n*sizeof(int)` defers from a multiple of 16. And that's the "intent" behind variable length allocation.
  - *We have to calculate how far we are from the next multiple of 16. Once we get this value, we can allocate space on the stack.*

---

Let's see how the compiler does it.
```nasm
	.text
	.section	.rodata
.LC0:
	.string	"%d"
	.text
	.globl main
	.type  main, @function
main:
	push rbp
	mov	 rbp, rsp
	push rbx
	sub	 rsp, 40              ; reserve space for known variables
	mov	 rax, rsp
	mov	 rbx, rax

	; scanf("%d", &n)

	lea	rax, -36[rbp]         ; &n
	mov	rsi, rax              ; arg2 = &n
	lea	rax, .LC0[rip]        ; "%d"
	mov	rdi, rax              ; arg1 = "%d"
	mov	eax, 0
	call	__isoc99_scanf@PLT

	; calculate the total bytes required

	mov   eax, DWORD PTR -36[rbp]
	movsx rdx, eax
	sub	  rdx, 1
	mov	  QWORD PTR -24[rbp], rdx
	cdqe
	lea	  rdx, 0[0+rax*4]

	; calculate padding required for 16-bytes alignment of rsp

	mov	 eax, 16
	sub	 rax, 1
	add	 rax, rdx
	mov	 ecx, 16
	mov	 edx, 0
	div	 rcx
	imul rax, rax, 16

	; reserve the space for array
	sub	rsp, rax

	; Make the base address of array (arr[0]) 4-byte aligned, if not
	mov	rax, rsp
	add	rax, 3
	shr	rax, 2
	sal	rax, 2

	; printf()
	mov	 QWORD PTR -32[rbp], rax
	mov	 rax, QWORD PTR -32[rbp]
	mov	 eax, DWORD PTR [rax]
	mov	 esi, eax                   ; &arr[0]
	lea	 rax, .LC0[rip]             ; arg2
	mov	 rdi, rax                   ; arg1 = arr[0]
	mov	 eax, 0
	call printf@PLT

	; restore rsp and return
	mov	rsp, rbx
	mov	eax, 0
	mov	rbx, QWORD PTR -8[rbp]
	leave
	ret
```

As usual, the compiler does it differently.

  - Add 15 to the bytes required, we get `(n + 15)`.
  - Divide this by 16 and focus on quotient, we have to do `(n+15)//16` .
  - Multiply the quotient with 16 and you get the total bytes required.

For example, take n = 5.
  - n * sizeof(int) = 5 * 4 = 20
  - 20 + 15 = 35
  - 35 // 16 = 2
  - 2 * 16 = 32

Remember the `ceil()` and `floor()` functions in math.h?

  - `ceil` rounds up to the next integer while `floor` rounds down to the previous integer.
  - `ceil(5.6)` would give 6 and `floor(5.6)` would give 5.
  - We are rounding in terms of 1.

The algorithm above does the same thing except it rounds integers to the next multiple of 16.

# Static && Extern VLA

Both are possible but require **compile-time constant declaration**. Because storage with static duration must be determined fully at compile time as memory layout is fixed before runtime.

Simply put,
```c
// Outside Functions
int n = 5;

int arr1[n];
static int arr2[n];

func(){
  int m = 5;
  static int arr3[m];
}
```
... these are invalid.

The valid ones are:
```c
// Outside Functions
const int n = 5;

int arr1[n];
static int arr2[n];

func(){
  const int m = 5;
  static int arr3[m];
}
```
