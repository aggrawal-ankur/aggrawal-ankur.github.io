# Procedures

A procedure is a code symbol with jump statements and some "clever" usage of stack.

***A procedure is a named, reusable block of code that performs a specific task, can accept input (arguments), has proper memory-management and returns a result.***

---

A procedure is composed of four core components:
  1. **Header** (label) is the name of the function.
  2. **Prologue** (entry setup) represents the "clever use of stack".
  3. **Body** represents the function body.
  4. **Epilogue** (cleanup and return)

---

The clever use of stack is about implementing stack frames and return context, which requires some general purpose registers, reserved for some specific uses in the System V ABI.

| Register | Convention |
| :------- | :--------- |
| rsp | Stack pointer register; holds a pointer to the top of the stack. |
| rbp | Base pointer register; holds a pointer to the start of a stack frame, acts as a stable pointer as rsp is volatile. |
| rip | Global instruction pointer register; holds the address of the next instruction. |

## Prologue

These two instructions form the **function prologue**.
```nasm
push rbp
mov rbp, rsp
```

As per System V ABI, `rsp` is guaranteed to be 16-bytes aligned.

Before calling a procedure, `rsp` is 16-bytes aligned. The `call` instruction

  1. Push the next instruction in the caller's stack frame on the stack. This makes `rsp` misaligned by 8-bytes.
  2. Jump on the procedure's header (label).

---

After `call`, we push the base pointer of the caller's stack frame on stack, this is used in returning to the caller function. This instruction makes the `rsp` 16-bytes aligned again.

---

Next we setup the base pointer for the current stack frame.

  * When we push the return address on stack, 8 bytes are subtracted and rbp is stored there. The `rsp` now points to the memory where this return address is stored.
  * When we push `rbp` on stack, the `rsp` now points to the memory where `rbp` is stored.

We have pushed `rbp` on stack and now we can modify it to represent the current stack frame.
```nasm
mov rbp, rsp
```
The new base pointer points to where rsp is right now, which is the old base pointer.

Take this:

  * If the `rsp` was `0d4000` before `call`, pushing the return address would subtract it to `0d3992`, here goes the return address.
  * When we push `rbp`, the `rsp` is subtracted by 8 again and `rbp` goes on `0d3984`. The `rsp` also points at `0d3984` now.
  * When we do `mov rbp, rsp`, `rbp` now stores `0d3984`.
  * When we ask what is `0d3984`, it would be the new base pointer. When we ask what is at `0d3984`, it would be the old base pointer.

## Body

The body does two things.
  1. Reserving space for local variable on the stack.
  2. Everything else (instructions and static allocation).

Stack pointer movement is word-aligned. Meaning, `rsp` always moves in units of the machine's word size, which is 64-bit (or 8-bytes) on x64.
  - So, rsp must be 8-bytes aligned.

But there are some special instructions (`SIMD`) which require the stack to be 16-bytes aligned.

To keep `rsp` 16-bytes aligned, the total allocation on the stack must be divisible by 16. As long as this is true, no padding is required.

If rsp is not divisible by 16, the allocation size is rounded up to the next 16-divisible digit.

Take this: if 100 bytes of locals are required, 112 bytes are reserved. 12 bytes of padding is required to ensure 16-bytes alignment.

---

There are **leaf functions** which are functions which don't call any other functions inside them. For leaf functions, a concept called **red zone** exists in x64 System V ABI.

  * Red zone is a small area of memory on the stack that a function can use for temporary storage without explicitly moving the stack pointer.
  * The red zone is 128 bytes immediately below the `rsp` (stack pointer).
  * The red zone is guaranteed to be safe, nothing will write there unexpectedly as no nested function call exist in that frame.

## Epilogue

It is about cleanup and return.
```nasm
leave
ret
```

To free the memory, we just make it inaccessible.

  * Reducing `rsp` doesn't clear the memory. The values are still there.
  * But there are so many processes running and leaving constantly, the space gets reused very quickly. You mark a memory free and another process overwrites it.

---

When we execute the `leave` instruction
  * It restores the `rsp` by moving `rbp` into it. Remember, `rbp` is pointing at the old base pointer.
  * And `pop rbp` pops the rsp and moves the old base pointer in `rbp` and add 8-bytes to `rsp` to point at the return address.

---

At last, we execute the `ret` instruction, which pops the return address into `rip`. And we are back into the old stack frame or old function context.

## Return value?

As per the ABI, the return goes in the accumulator (`rax`).

When you write raw assembly, you can technically return multiple things as long as you comply with the ABI rules. But only one return value is allowed in C.
