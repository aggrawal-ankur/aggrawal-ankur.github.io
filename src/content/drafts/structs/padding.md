# Internal Padding In Structs

Padding and alignment is paramount for structures.

Take this:
```c
#include <stdio.h>

struct Point {
  int x;
  int y;
  char gen;
  int* memo;
};

int main(){
  int num = 88;

  struct Point P;
  P.x = 4;
  P.y = 5;
  P.gen = 'M';
  P.memo = &num;

  printf("Hello\n");
}
```

We need 17 bytes (4 + 4 + 1 + 8) so 32 bytes would be reserved on the stack.

This is the assembly:
```nasm
.LC0:
	.string	"Hello"

main:
	push rbp
	mov	 rbp, rsp
	sub	 rsp, 32

	mov	 DWORD PTR -4[rbp], 88    ; num

	mov	 DWORD PTR -32[rbp], 4    ; P.x
	mov	 DWORD PTR -28[rbp], 5    ; P.y
	mov	 BYTE PTR -24[rbp], 77    ; P.gen (ASCII value of 'M')

	lea	 rax, -4[rbp]             ; addr of -4[rbp], which is n
	mov	 QWORD PTR -16[rbp], rax  ; P.memo

	lea	 rax, .LC0[rip]
	mov	 rdi, rax
	call puts@PLT

	mov	eax, 0
	leave
	ret
```
Indeed.

---

Let's have a look at the stack layout.
```
                       rbp
                    *---------*
-04, -03, -02, -01  | num 88  |
                    *---------*
-08, -07, -06, -05, | Padding |
                    *---------*
-16, -15, -14, -13, | P.memo  | -16[rbp] (8-byte)
-12, -11, -10, -09  *---------*
                    *---------*
-24, -23, -22, -21, | P.gen   | -24[rbp] (1-byte + 7-byte for padding)
-20, -19, -18, -17  *---------*
                    *---------*
-28, -27, -26, -25  | P.y     | -28[rbp] (4-byte)
                    *---------*
-32, -31, -30, -29  | P.x     | -32[rbp] (4-byte)
                    *---------*
```

If we print the size of our struct, we get 24 bytes. But we require only 17 bytes.

---

There are two paddings in effect here.

1. Padding for the rsp to be 16-bytes aligned.
2. Padding required by the internal struct members to be aligned per the largest struct member.

The largest member in this struct is `memo`, which is a pointer variable. The rest of the members have to be aligned such that the internal access mechanism can traverse in terms of 8-bytes across the struct.
  - 4-4 bytes for `x` and `y` keeps the struct 8-bytes aligned.
  - 1-byte for `gen` makes the access misaligned, so 7 bytes of padding is added here.
  - After the cpu traverses (4+4+8) bytes, it reaches the first byte in `memo` and accessing a QWORD value gives the pointer.
