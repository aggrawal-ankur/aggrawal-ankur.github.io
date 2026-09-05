# Recursion (Recursive Function)

***A function that calls itself during its execution to solve a problem by breaking it in smaller, simpler instances of the same problem is called a recursive function.***

It requires a **recursive case** where the function calls itself with a modified input and a **base case**, which is the stopping condition that prevents infinite recursion.

The recursive case and base case makes a recursion either easy to understand or very complex. For this reason, we will take **factorial**, because it is very straightforward.

Problems like Tower of Hanoi and Fibonacci series can be solved with recursion but they are a little complex to understand.

---

Recursion is the ideal to understand stack discipline.
  1. how stack frames are really "stacked"?
  2. how arguments are managed across calls?
  3. how returns are managed?

# Factorial

To calculate the factorial of a number, we use this formula:
```
n! = n * (n - 1) * (n - 2) * .... * (n - (n-1))
```
  - where `n` is a positive integer and the factorial of 0 is 1.

Take 5! as an example.
```
5! = 5 * (5 - 1) * (5 - 2) * (5 - 3) * (5 - 4)
   = 5 * 4 * 3 * 2 * 1
   = 120
```

An iterative program would calculate the factorial as:
```c
int factorial(int n){
  if (n == 0){
    return 1;
  }
  int f = 1;
  for (int i = 1; i <= n; i++){
    f *= i;
  }
  return f;
}
```

To do this with recursion, we need a base case and recursive case.
  * Factorial is defined for positive integers only and the least you can go is 0, whose factorial is 1. So, `0! = 1` will be the base case.
  * Recursive case will be `n * func(n - 1)`

Each recursive call reduces the value of `n`  until it becomes 0. When it becomes zero, return is triggered. And the final return computes `n!`.

It can be implemented as:
```c
#include <stdio.h>

int rec_fact(int n){
  if (n == 0){
    return 1;
  }
  return (n * rec_fact(n - 1));
}

int main(){
  int n = 5;
  rec_fact(n);
}
```

This the assembly.
```nasm
rec_fact:
    push rbp
    mov  rbp, rsp
    sub  rsp, 16

    mov DWORD PTR -4[rbp], edi    ; Store n

    cmp  DWORD PTR -4[rbp], 0     ; (n == 0) check
    jne  .L2                      ; if not, hit the recursive case
    mov  eax, 1
    jmp  .L3                      ; if yes, hit the base case

; return n * rec_fact(n - 1)
.L2:
    mov  eax, DWORD PTR -4[rbp]    ; Load n
    sub  eax, 1                    ; (n - 1)
    mov  edi, eax                  ; arg1 = eax
    call rec_fact                  ; recursive call
    imul eax, DWORD PTR -4[rbp]    ; when the the base case is hit by a frame, multiply the return (rax) with n

; return
.L3:
    leave
    ret

main:
    push rbp
    mov  rbp, rsp
    sub  rsp, 16

    mov  DWORD PTR -4[rbp], 5
    mov  eax, DWORD PTR -4[rbp]
    mov  edi, eax
    call rec_fact

    mov  eax, 0
    leave
    ret
```

# The Initial Stack Layout

We can talk theory all the day, but how one interprets that theory changes everything. And the best way to ensure that we are on the same page is by visualizing the stack.

**Note: This visual representation of stack might not be very accurate, but it works.**

With ASCII Art, we can draw the theory. That's it.

All the addresses are in decimal, no hex is used as it complicates the calculation.

The addresses are kept deliberately small so that **subtraction of bytes** is easier to calculate.

---

This is the initial state of the stack.
```
4008: rsp

        *------------------*
4000 -> | old rbp on stack | (push rbp)
        *------------------*
           new rbp = 4000
        Stack Frame: main()
        *------------------*
3996 -> | edi (n = 5)      | -4[rbp]
        *------------------*
3992 -> |                  | -8[rbp]
        *------------------*
3988 -> |                  | -12[rbp]
        *------------------*
3984 -> |                  | -16[rbp]
        *------------------*
3976 -> | addr(mov eax, 0) |
        *------------------*
3968 -> | main() rbp (4000)|
        *------------------*
           new rbp = 3968
       Stack Frame: rec_fact()
        *------------------*
3964 -> | edi (n = 5)      | -4[rbp]
        *------------------*
3960 -> |                  | -8[rbp]
        *------------------*
3956 -> |                  | -12[rbp]
        *------------------*
3952 -> |                  | -16[rbp]
        *------------------*
3944 -> | addr(imul eax, 5)|
        *------------------*
3936 -> | old rbp (3968)   |
        *------------------*
           new rbp = 3936
       Stack Frame: rec_fact()
        *------------------*
3932 -> | edi (n = 4)      | -4[rbp]
        *------------------*
3928 -> |                  | -8[rbp]
        *------------------*
3924 -> |                  | -12[rbp]
        *------------------*
3920 -> |                  | -16[rbp]
        *------------------*
3912 -> | addr(imul eax, 4)|
        *------------------*
3904 -> | old rbp (3936)   |
        *------------------*
           new rbp = 3904
       Stack Frame: rec_fact()
        *------------------*
3900 -> | edi (n = 3)      | -4[rbp]
        *------------------*
3896 -> |                  | -8[rbp]
        *------------------*
3892 -> |                  | -12[rbp]
        *------------------*
3888 -> |                  | -16[rbp]
        *------------------*
3880 -> | addr(imul eax, 3)|
        *------------------*
3872 -> | old rbp (3904)   |
        *------------------*
           new rbp = 3872
       Stack Frame: rec_fact()
        *------------------*
3868 -> | edi (n = 2)      | -4[rbp]
        *------------------*
3864 -> |                  | -8[rbp]
        *------------------*
3860 -> |                  | -12[rbp]
        *------------------*
3856 -> |                  | -16[rbp]
        *------------------*
3848 -> | addr(imul eax, 2)|
        *------------------*
3840 -> | old rbp (3872)   |
        *------------------*
           new rbp = 3840
       Stack Frame: rec_fact()
        *------------------*
3836 -> | edi (n = 1)      | -4[rbp]
        *------------------*
3832 -> |                  | -8[rbp]
        *------------------*
3828 -> |                  | -12[rbp]
        *------------------*
3824 -> |                  | -16[rbp]
        *------------------*
3816 -> | addr(imul eax, 1)|
        *------------------*
3808 -> | old rbp (3840)   |
        *------------------*
           new rbp = 3808
       Stack Frame: rec_fact()
        *------------------*
3804 -> | edi (n = 0)      | -4[rbp]
        *------------------*
3800 -> |                  | -8[rbp]
        *------------------*
3796 -> |                  | -12[rbp]
        *------------------*
3792 -> |                  | -16[rbp]
        *------------------*
```

The addresses are oscillating between 4 and 8 because a direct `push` is a shorthand for subtracting 8 bytes and moving a value at that memory. When we reserve 16 bytes separately and the bytes are used to store an integer, they are 4-byte aligned for efficient memory access.

This ASCII Art has stopped at `(n = 0)` as we have reached the base condition. Now the frames will exit one-by-one. Let's see how that works.

# Return Management

This is a compressed view of the stack.
```
| Stack Frame | rbp  | n |
*-------------*------*---*
| main        | 4000 | 5 | <- Bottom
| rec_fact    | 3968 | 5 |
| rec_fact    | 3936 | 4 |
| rec_fact    | 3904 | 3 |
| rec_fact    | 3872 | 2 |
| rec_fact    | 3840 | 1 |
| rec_fact    | 3808 | 0 | <- Top
```

Each frame is exactly 32-bytes in size; 16 for locals, 8 for return address and 8 for old `rbp` pointer.

Let's start with the topmost frame.

## The 3808 Frame

State of pointers:
| rbp  | rsp  |
| ---  | ---  |
| 3808 | 3792 |

For `(n==0)`, we set `eax=1` (the return value) and jump to `.L3`.

The `leave` instruction resets the stack pointer using `rbp`.
```nasm
mov rsp, 3808
```

...and pops the old base pointer (located in `rsp`) into `rbp`, which changes the current base pointer to the previous stack frame.
```nasm
mov rbp, [3808]        ; [3808] = 3840
add rsp, 8             ; rsp = 3816
```

Now `rsp=3816` and `rbp=3840`.

When we do `pop rip`, it is:
```nasm
mov rip, [3816]
add rsp, 8             ; rsp = 3824
```

...dereferencing 3816 gives the address of `imul eax, DWORD PTR -4[rbp]` instruction in the previous stack frame (3840).

We have successfully returned to the previous stack frame with `rbp=3840`.

State of pointers:
| rbp  | rsp  |
| ---  | ---  |
| 3840 | 3824 |

## The 3840 Frame

State of pointers:
| rbp  | rsp  |
| ---  | ---  |
| 3840 | 3824 |

Here, `n==1`. So, `.L2` was executed, which sets up the next recursion call.

The next recursion call was `rbp=3808`, which successfully returned 1 in `eax`.

Now we are at:
```nasm
imul eax, DWORD PTR -4[rbp]
```

For this stack frame (`rbp=3840`), `-4[3840]` would go to `3836` which stores a local copy of `n` received by this procedure's frame, which is `1`.

So the instruction becomes:
```nasm
imul eax, 1
```

...and `eax` is already 1, so the result in `eax` would be 1.

After this, `.L3` is called.
```nasm
; leave
mov rsp, 3840
mov rbp, [3840]        ; [3840] = 3872
add rsp, 8             ; rsp = 3848

; return
mov rip, [3848]
add rsp, 8             ; rsp = 3856
```

We have successfully returned to the previous stack frame with `rbp=3872`.

State of pointers:
| rbp  | rsp  |
| ---  | ---  |
| 3872 | 3856 |

## The 3872 Frame

State of pointers:
| rbp  | rsp  |
| ---  | ---  |
| 3872 | 3856 |

Here, `n==2`. So, `.L2` was executed, which sets up the next recursion call.

The next recursion call was `rbp=3840`, which successfully returned 1 in `eax`.

Now we are at:
```nasm
imul eax, DWORD PTR -4[rbp]
```

For this stack frame (`rbp=3872`), `-4[3872]` would go to `3868`, which stores a local copy of `n` received by this procedure's frame, which is `2`.

So the instruction becomes:
```nasm
imul eax, 2
```

...and `eax` is 1, so the result in `eax` would be 2.

After this, `.L3` is called.
```nasm
; leave
mov rsp, 3872
mov rbp, [3872]        ; [3872] = 3904
add rsp, 8             ; rsp = 3880

; ret
mov rip, [3880]
add rsp, 8             ; rsp = 3888
```

We have successfully returned to the previous stack frame with `rbp=3904`.

State of pointers:
| rbp  | rsp  |
| ---  | ---  |
| 3904 | 3888 |

## The 3904 Frame

State of pointers:
| rbp  | rsp  |
| ---  | ---  |
| 3904 | 3888 |

Here, `n=3`. So, `.L2` was executed, which sets up the next recursion call.

The next recursion call was `rbp=3872`, which successfully returned 2 in `eax`.

Now we are at:
```nasm
imul eax, DWORD PTR -4[rbp]
```

For this stack frame (`rbp=3904`), `-4[3904]` would go to `3900`, which stores a local copy of `n` received by this procedure's frame, which is `3`.

So the instruction becomes:
```nasm
imul eax, 3
```

... and `eax` is 2, so the result in `eax` would be 6.

After this, `.L3` is called.
```nasm
; leave
mov rsp, 3904
mov rbp, [3904]        ; [3904] = 3936
add rsp, 8             ; rsp = 3912

; ret
mov rip, [3912]
add rsp, 8             ; rsp = 3920
```

We have successfully returned to the previous stack frame with `rbp=3936`.

State of pointers:
| rbp  | rsp  |
| ---  | ---  |
| 3936 | 3920 |

## The 3936 Frame

State of pointers:
| rbp  | rsp  |
| ---  | ---  |
| 3936 | 3920 |

Here, `n=4`. So, `.L2` was executed, which sets up the next recursion call.

The next recursion call was `rbp=3904`, which successfully returned 6 in `eax`.

Now we are at:
```nasm
imul eax, DWORD PTR -4[rbp]
```

For this stack frame (`rbp=3936`), `-4[3936]` would go to `3932`, which stores a local copy of `n` received by this procedure's frame. The value of `n` is `4`.

So the instruction becomes:
```nasm
imul eax, 4
```

...and `eax` is 6, so the result in `eax` would be 24.

After this, `.L3` is called.
```nasm
; leave
mov rsp, 3936
mov rbp, [3936]        ; [3936] = 3968
add rsp, 8             ; rsp = 3944

; ret
mov rip, [3944]
add rsp, 8             ; rsp = 3952
```

We have successfully returned to the previous stack frame with `rbp=3968`.

State of pointers:
| rbp  | rsp  |
| ---  | ---  |
| 3968 | 3952 |

### The 3968 Frame

State of pointers:
| rbp  | rsp  |
| ---  | ---  |
| 3968 | 3952 |

Here, `n=5`. So, `.L2` was executed, which sets up the next recursion call.

The next recursion call was `rbp=3936`, which successfully returned 24 in `eax`.

Now we are at:
```nasm
imul eax, DWORD PTR -4[rbp]
```

For this stack frame (`rbp=3968`), `-4[3968]` would go to `3964`, which stores a local copy of `n` received by this procedure's frame, which is `5`.

So the instruction becomes:
```nasm
imul eax, 5
```

...and `eax` is 24, so the result in `eax` would be 120.

After this, `.L3` is called.
```nasm
; leave
mov rsp, 3968
mov rbp, [3968]        ; [3968] = 4000
add rsp, 8             ; rsp = 3976

; ret
mov rip, [3976]
add rsp, 8             ; rsp = 3984
```

We have successfully returned to the previous stack frame with `rbp=4000`.

State of pointers: `rsp=3984` and `rbp=4000` .
| rbp  | rsp  |
| ---  | ---  |
| 4000 | 3984 |

Now we are inside the `rbp=4000` stack frame.
  * This is where we started from.
  * From here, we return to the startup code, which handles the exit and cleanup.
